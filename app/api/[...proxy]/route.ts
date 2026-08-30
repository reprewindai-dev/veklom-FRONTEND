import { NextRequest, NextResponse } from "next/server";

import {
  CAPI_RUNTIME_URL,
  CAPPO_BACKEND_URL,
  capiAuthHeaderValue,
} from "@/lib/capi-runtime";
import {
  isCappoExecPath,
  isCappoIdentityPath,
  isCappoProxyPath,
} from "@/lib/cappo-proxy-paths";

const CAPI_ADMIN_KEY = capiAuthHeaderValue();
const CAPPO_INTERNAL_EXEC_KEY = process.env.CAPPO_INTERNAL_EXEC_KEY || "";
const VBB_BACKEND_URL =
  process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
const PGL_URL = process.env.PGL_URL || "https://pgl.veklom.com";
const LOCKERPHYCER_URL = (process.env.LOCKERPHYCER_URL || "").replace(/\/+$/, "");
const LOCKERPHYCER_SECRET = process.env.LOCKERPHYCER_SECRET_KEY || "";

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

function stripHopByHopHeaders(headers: Headers) {
  const nominated = (headers.get("connection") || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  for (const header of [...HOP_BY_HOP_HEADERS, ...nominated]) headers.delete(header);
}

type CappoAssertionExchangeResult =
  | { kind: "success"; token: string; workspaceId: string; actorId: string }
  | { kind: "unauthenticated" }
  | { kind: "missing-workspace"; body: unknown }
  | { kind: "unavailable" };

function assertionClaims(token: string): { workspaceId: string; actorId: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(
      Buffer.from(encoded + "=".repeat((4 - (encoded.length % 4)) % 4), "base64").toString("utf8"),
    ) as Record<string, unknown>;
    const workspaceId = typeof payload.workspace_id === "string" ? payload.workspace_id : "";
    const actorId = typeof payload.sub === "string" ? payload.sub : "";
    const expiresAt = typeof payload.exp === "number" ? payload.exp : 0;
    if (!workspaceId || !actorId || expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return { workspaceId, actorId };
  } catch {
    return null;
  }
}

async function exchangeCappoAssertion(req: NextRequest): Promise<CappoAssertionExchangeResult> {
  const authHeaders = new Headers();
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  if (authorization) authHeaders.set("authorization", authorization);
  if (cookie) authHeaders.set("cookie", cookie);
  authHeaders.set("accept", "application/json");

  try {
    const response = await fetch(
      `${VBB_BACKEND_URL.replace(/\/+$/, "")}/api/v1/auth/cappo-token`,
      {
        method: "POST",
        headers: authHeaders,
        redirect: "manual",
        cache: "no-store",
      },
    );
    if (response.status === 401) return { kind: "unauthenticated" };
    if (response.status === 403) {
      let body: unknown = { detail: { error: "WORKSPACE_CONTEXT_MISSING" } };
      try {
        body = await response.json();
      } catch {
        // Preserve the endpoint's documented failure shape.
      }
      return { kind: "missing-workspace", body };
    }
    if (!response.ok) return { kind: "unavailable" };
    const body = (await response.json()) as { access_token?: unknown };
    if (typeof body.access_token !== "string" || !body.access_token) {
      return { kind: "unavailable" };
    }
    const claims = assertionClaims(body.access_token);
    return claims
      ? { kind: "success", token: body.access_token, ...claims }
      : { kind: "unavailable" };
  } catch {
    return { kind: "unavailable" };
  }
}

type PreparedCappoRequest = {
  targetUri: string;
  body: string;
  headers: Record<string, string>;
};

async function executePreparedCappo(
  req: NextRequest,
  assertion: Extract<CappoAssertionExchangeResult, { kind: "success" }>,
): Promise<NextResponse> {
  if (!CAPPO_BACKEND_URL || !CAPPO_INTERNAL_EXEC_KEY || !CAPI_RUNTIME_URL) {
    return NextResponse.json(
      { error: "CAPPO_EXECUTION_PREPARER_NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  let browserBody: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    browserBody = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "INVALID_EXECUTION_REQUEST" }, { status: 400 });
  }
  const lease = browserBody.capability_lease;
  const executionId =
    lease && typeof lease === "object" && !Array.isArray(lease)
      ? (lease as Record<string, unknown>).execution_id
      : null;
  if (typeof executionId !== "string" || !executionId) {
    return NextResponse.json(
      { error: "CAPABILITY_LEASE_EXECUTION_ID_REQUIRED" },
      { status: 400 },
    );
  }

  const prepareResponse = await fetch(
    `${CAPI_RUNTIME_URL.replace(/\/+$/, "")}/api/internal/cappo/prepare`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-cappo-internal-key": CAPPO_INTERNAL_EXEC_KEY,
      },
      body: JSON.stringify({
        body: browserBody,
        executionId,
        workspaceId: assertion.workspaceId,
        actorId: assertion.actorId,
      }),
      redirect: "manual",
      cache: "no-store",
    },
  );
  if (!prepareResponse.ok) {
    const detail = await prepareResponse.text();
    console.error("CAPPO request preparation failed", prepareResponse.status, detail.slice(0, 500));
    return NextResponse.json(
      { error: "CAPPO_EXECUTION_PREPARATION_FAILED" },
      { status: 502 },
    );
  }
  const prepared = (await prepareResponse.json()) as PreparedCappoRequest;
  const expectedTarget = `${CAPPO_BACKEND_URL.replace(/\/+$/, "")}/v1/exec`;
  if (
    prepared.targetUri !== expectedTarget ||
    typeof prepared.body !== "string" ||
    !prepared.headers ||
    typeof prepared.headers !== "object"
  ) {
    return NextResponse.json(
      { error: "CAPPO_EXECUTION_PREPARER_TARGET_MISMATCH" },
      { status: 502 },
    );
  }

  const headers = new Headers(prepared.headers);
  stripHopByHopHeaders(headers);
  headers.set("authorization", `Bearer ${assertion.token}`);
  headers.delete("cookie");
  headers.delete("x-api-key");

  try {
    const response = await fetch(prepared.targetUri, {
      method: "POST",
      headers,
      body: prepared.body,
      redirect: "manual",
      cache: "no-store",
    });
    const responseHeaders = new Headers(response.headers);
    stripHopByHopHeaders(responseHeaders);
    responseHeaders.delete("content-encoding");
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Prepared CAPPO execution failed", error);
    return NextResponse.json({ error: "CAPPO_EXECUTION_UPSTREAM_ERROR" }, { status: 502 });
  }
}

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("x-api-key");
  stripHopByHopHeaders(headers);

  let targetBase = "";
  let forwardPath = path;

  if (path.startsWith("/api/cappo/")) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json(
        { error: "CAPPO capability proxy is not configured" },
        { status: 503 },
      );
    }
    forwardPath = path.replace(/^\/api\/cappo/, "");
    if (!isCappoProxyPath(forwardPath)) {
      return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
    }

    targetBase = CAPPO_BACKEND_URL;
    headers.delete("authorization");
    headers.delete("cookie");
    headers.delete("x-workspace-id");
    headers.delete("x-veklom-requester-id");

    if (isCappoExecPath(forwardPath) || isCappoIdentityPath(forwardPath)) {
      const exchange = await exchangeCappoAssertion(req);
      if (exchange.kind === "unauthenticated") {
        return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
      }
      if (exchange.kind === "missing-workspace") {
        return NextResponse.json(exchange.body, { status: 403 });
      }
      if (exchange.kind === "unavailable") {
        return NextResponse.json({ error: "CAPPO_ASSERTION_UNAVAILABLE" }, { status: 502 });
      }
      if (isCappoExecPath(forwardPath)) return executePreparedCappo(req, exchange);
      headers.set("authorization", `Bearer ${exchange.token}`);
    }
  } else if (path.startsWith("/api/capi/")) {
    targetBase = CAPI_RUNTIME_URL;
    forwardPath = path.replace(/^\/api\/capi/, "/api/v1/capi");
  } else if (path.startsWith("/api/ledger/")) {
    targetBase = PGL_URL;
    forwardPath = path.replace(/^\/api\/ledger/, "/api/v1/ledger");
  } else if (path.startsWith("/api/v1/locker")) {
    if (!LOCKERPHYCER_URL) {
      return NextResponse.json(
        { error: "Lockerphycer backend is not configured" },
        { status: 503 },
      );
    }
    targetBase = LOCKERPHYCER_URL;
  } else if (
    path.startsWith("/api/v1/webmcp") ||
    path.startsWith("/webmcp") ||
    path.startsWith("/mcp")
  ) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json({ error: "CAPPO backend is not configured" }, { status: 503 });
    }
    targetBase = CAPPO_BACKEND_URL;
  } else if (
    path.startsWith("/api/v1/agents") ||
    path.startsWith("/api/v1/benchmarks") ||
    path.startsWith("/api/v1/gpc") ||
    path.startsWith("/api/v1/execution") ||
    path.startsWith("/v1/governance") ||
    path.startsWith("/api/v1/pricing") ||
    path.startsWith("/api/v1/x402") ||
    path.startsWith("/api/v1/platform")
  ) {
    targetBase = VBB_BACKEND_URL;
  } else if (path.startsWith("/api/v1/")) {
    targetBase = VBB_BACKEND_URL;
  } else {
    return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
  }

  const hasBearerIdentity = (headers.get("authorization") || "")
    .toLowerCase()
    .startsWith("bearer");
  if (targetBase === LOCKERPHYCER_URL && LOCKERPHYCER_SECRET) {
    headers.set("Authorization", `Bearer ${LOCKERPHYCER_SECRET}`);
  } else if (targetBase === CAPI_RUNTIME_URL && !hasBearerIdentity && CAPI_ADMIN_KEY) {
    headers.set("x-api-key", CAPI_ADMIN_KEY);
  }

  const targetUrl = `${targetBase.replace(/\/+$/, "")}${forwardPath}${url.search}`;
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error Node fetch requires duplex for streamed request bodies.
      duplex: "half",
      redirect: "manual",
      cache: "no-store",
    });
    const responseHeaders = new Headers(response.headers);
    stripHopByHopHeaders(responseHeaders);
    responseHeaders.delete("content-encoding");
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy error:", error instanceof Error ? error.message : "Unknown upstream error");
    return NextResponse.json({ error: "Gateway Proxy Error" }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
