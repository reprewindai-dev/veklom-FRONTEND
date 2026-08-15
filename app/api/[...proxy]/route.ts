import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, CAPPO_BACKEND_URL, capiAuthHeaderValue, cappoAuthHeaderValue } from "@/lib/capi-runtime";

const CAPI_ADMIN_KEY = capiAuthHeaderValue();
const CAPPO_ADMIN_KEY = cappoAuthHeaderValue();
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
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

  for (const header of [...HOP_BY_HOP_HEADERS, ...nominated]) {
    headers.delete(header);
  }
}

type RequesterIdentity = {
  id?: string;
  workspace_id?: string;
  role?: string;
};

async function resolveRequesterIdentity(req: NextRequest): Promise<RequesterIdentity | null> {
  const authHeaders = new Headers();
  const authorization = req.headers.get("authorization");
  const cookie = req.headers.get("cookie");
  if (authorization) authHeaders.set("authorization", authorization);
  if (cookie) authHeaders.set("cookie", cookie);
  authHeaders.set("accept", "application/json");

  try {
    const response = await fetch(
      `${VBB_BACKEND_URL.replace(/\/+$/, "")}/api/v1/auth/me`,
      {
        method: "GET",
        headers: authHeaders,
        redirect: "manual",
        cache: "no-store",
      },
    );
    if (!response.ok) return null;
    const body = (await response.json()) as RequesterIdentity;
    if (!body.workspace_id || !body.id) return null;
    return body;
  } catch {
    return null;
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
  let cappoCapabilityRequest = false;

  if (path.startsWith("/api/cappo/v1/capability/")) {
    if (!CAPPO_BACKEND_URL || !CAPPO_ADMIN_KEY) {
      return NextResponse.json(
        { error: "CAPPO capability proxy is not configured" },
        { status: 503 },
      );
    }

    // The browser's BYOS/Firebase bearer is not automatically a CAPPO token.
    // Validate it against the canonical BYOS identity endpoint first, then use
    // the server-held CAPPO credential with the validated workspace scope.
    const requester = await resolveRequesterIdentity(req);
    if (!requester) {
      return NextResponse.json(
        { error: "AUTHENTICATION_REQUIRED" },
        { status: 401 },
      );
    }

    targetBase = CAPPO_BACKEND_URL;
    forwardPath = path.replace(/^\/api\/cappo/, "");
    cappoCapabilityRequest = true;

    headers.delete("authorization");
    headers.delete("cookie");
    headers.delete("x-workspace-id");
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
    headers.set("x-workspace-id", requester.workspace_id!);
    headers.set("x-veklom-requester-id", requester.id!);
  } else if (path === "/api/cappo/v1/exec" || path.startsWith("/api/cappo/v1/exec/")) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json({ error: "CAPPO backend is not configured" }, { status: 503 });
    }
    targetBase = CAPPO_BACKEND_URL;
    forwardPath = path.replace(/^\/api\/cappo/, "");
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
  } else if (path.startsWith("/api/v1/webmcp") || path.startsWith("/webmcp") || path.startsWith("/mcp")) {
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
  } else {
    return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
  }

  const hasBearerIdentity = (headers.get("authorization") || "")
    .toLowerCase()
    .startsWith("bearer ");

  if (
    targetBase === CAPPO_BACKEND_URL &&
    !cappoCapabilityRequest &&
    !hasBearerIdentity &&
    CAPPO_ADMIN_KEY &&
    CAPPO_ADMIN_KEY !== "dev-admin-key-do-not-use-in-prod"
  ) {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
  } else if (targetBase === LOCKERPHYCER_URL && LOCKERPHYCER_SECRET) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown upstream error";
    console.error("Proxy error:", message);
    return NextResponse.json({ error: "Gateway Proxy Error" }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
