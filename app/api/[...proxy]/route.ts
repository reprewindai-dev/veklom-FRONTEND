import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, CAPPO_BACKEND_URL, capiAuthHeaderValue } from "@/lib/capi-runtime";
import {
  isCappoExecPath,
  isCappoIdentityPath,
  isCappoProxyPath,
  isCappoPublicPath,
} from "@/lib/cappo-proxy-paths";
import { isOperatorLockerPath } from "@/lib/wallet/proxy-paths";

const CAPI_ADMIN_KEY = capiAuthHeaderValue();
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
const PGL_URL = process.env.PGL_URL || "https://pgl.veklom.com";
const PGL_LEDGER_API_KEY = process.env.PGL_LEDGER_API_KEY || "";
const LOCKERPHYCER_URL = (process.env.LOCKERPHYCER_URL || "").replace(/\/+$/, "");
// LockerPhycer requests carry only the caller's own bearer (or none, for the
// anonymous /api/v1/auth/* flows). No service secret is ever substituted:
// LockerPhycer's SECRET_KEY is its JWT signing key and no route accepts it as a
// bearer, so attaching it only put the signing secret on the wire.
const VLINK_URL = (process.env.VLINK_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
// Internal-only; no public fallback so a missing setting fails closed.
const ABIDE_URL = (process.env.ABIDE_URL || "").replace(/\/+$/, "");

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
  const connectionHeader = headers.get("connection") || "";
  const nominated = connectionHeader.split(",");
  const toDelete = [...HOP_BY_HOP_HEADERS];
  for (const val of nominated) {
    const trimmed = val.trim().toLowerCase();
    if (trimmed) toDelete.push(trimmed);
  }
  for (const header of toDelete) headers.delete(header);
}

async function requirePrincipal(req: NextRequest): Promise<NextResponse | null> {
  const authorization = req.headers.get("authorization") || "";
  if (!authorization.toLowerCase().startsWith("bearer")) {
    return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
  }

  if (!LOCKERPHYCER_URL) {
    return NextResponse.json(
      { error: "LockerPhycer backend is not configured" },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${LOCKERPHYCER_URL}/api/v1/auth/me`, {
      headers: { authorization },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
    }
  } catch {
    return NextResponse.json(
      { error: "LockerPhycer authentication unavailable" },
      { status: 503 },
    );
  }

  return null;
}

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;
  const isCapiInterlinkRoute = path.startsWith("/api/capi/interlink/");

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("x-api-key");
  // Let Node's fetch negotiate its own encoding. Forwarding the browser's
  // (which includes zstd) gets a zstd body back that Node 20 cannot decode, and
  // the content-encoding header is dropped below, so the browser would receive
  // raw compressed bytes labelled as JSON.
  headers.delete("accept-encoding");
  stripHopByHopHeaders(headers);

  let targetBase = "";
  let forwardPath = path;
  // CAPPO itself currently accepts unauthenticated callers, so this proxy is the
  // gate: anything that is not an explicitly public read needs a live session.
  let requiresPrincipal = false;
  let isAbideRoute = false;
  const isPglRoute = path.startsWith("/api/pgl/") || path.startsWith("/api/ledger/");
  // Operator-scoped LockerPhycer routes (wallet, entitlements, Stripe top-up
  // checkout). They must carry the operator's own bearer; the service secret is
  // never substituted for a missing one.
  const isOperatorLockerRoute = isOperatorLockerPath(path);

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
    requiresPrincipal = !isCappoPublicPath(forwardPath);
    headers.delete("authorization");
    headers.delete("cookie");
    headers.delete("x-workspace-id");
    headers.delete("x-veklom-requester-id");

    if (
      isCappoExecPath(forwardPath) ||
      isCappoIdentityPath(forwardPath) ||
      forwardPath.startsWith("/v1/capability/") ||
      forwardPath.startsWith("/v1/executions/")
    ) {
      if (req.headers.has("authorization")) {
        headers.set("authorization", req.headers.get("authorization")!);
      }
    }
  } else if (path.startsWith("/api/capi/")) {
    targetBase = CAPI_RUNTIME_URL;
    forwardPath = path.replace(/^\/api\/capi/, "/api/v1/capi");
  } else if (path.startsWith("/api/abide/")) {
    // ABIDE (wiring W-06) compiles blueprints/contracts and grants nothing, so it
    // gets no caller credentials; the live-session check below still gates it.
    if (!ABIDE_URL) {
      return NextResponse.json({ error: "ABIDE blueprint service is not configured" }, { status: 503 });
    }
    targetBase = ABIDE_URL;
    forwardPath = path.replace(/^\/api\/abide/, "");
    requiresPrincipal = true;
    isAbideRoute = true;
  } else if (path.startsWith("/api/pgl/")) {
    targetBase = PGL_URL;
    forwardPath = path.replace(/^\/api\/pgl/, "/api/v1");
  } else if (path.startsWith("/api/ledger/")) {
    targetBase = PGL_URL;
    forwardPath = path.replace(/^\/api\/ledger/, "/api/v1/ledger");
  } else if (
    path.startsWith("/api/v1/locker") ||
    path.startsWith("/api/v1/auth") ||
    path.startsWith("/api/v1/workspace") ||
    isOperatorLockerRoute
  ) {
    if (!LOCKERPHYCER_URL) {
      return NextResponse.json(
        { error: "LockerPhycer backend is not configured" },
        { status: 503 },
      );
    }
    targetBase = LOCKERPHYCER_URL;
  } else if (
    path.startsWith("/api/v1/vlinks") ||
    path.startsWith("/api/v1/webhooks")
  ) {
    targetBase = VLINK_URL;
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
    // Explicit legacy compatibility routes only. There is deliberately no
    // catch-all /api/v1 -> legacy backend fallback. Any unowned route fails closed.
    targetBase = VBB_BACKEND_URL;
    const isPublicRead =
      (req.method === "GET" || req.method === "HEAD") &&
      (path === "/api/v1/pricing" ||
        path === "/api/v1/x402/config" ||
        path.startsWith("/api/v1/benchmarks/"));
    requiresPrincipal = !isPublicRead;
  } else {
    return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
  }

  const hasBearerIdentity = (headers.get("authorization") || "")
    .toLowerCase()
    .startsWith("bearer");

  if (requiresPrincipal) {
    const principalError = await requirePrincipal(req);
    if (principalError) return principalError;
  }

  if (isAbideRoute) {
    headers.delete("authorization");
    headers.delete("cookie");
  } else if (isPglRoute) {
    if (!PGL_LEDGER_API_KEY) {
      return NextResponse.json(
        { error: "PGL ledger proxy is not configured" },
        { status: 503 },
      );
    }
    const principalError = await requirePrincipal(req);
    if (principalError) return principalError;
    headers.delete("authorization");
    headers.delete("cookie");
    headers.set("x-api-key", PGL_LEDGER_API_KEY);
  } else if (isOperatorLockerRoute) {
    if (!hasBearerIdentity) {
      return NextResponse.json({ error: "AUTHENTICATION_REQUIRED" }, { status: 401 });
    }
  } else if (
    targetBase === CAPI_RUNTIME_URL &&
    !isCapiInterlinkRoute &&
    !hasBearerIdentity &&
    CAPI_ADMIN_KEY
  ) {
    headers.set("x-api-key", CAPI_ADMIN_KEY);
  }

  const targetUrl = new URL(`${targetBase.replace(/\/+$/, "")}${forwardPath}${url.search}`);
  headers.set("host", targetUrl.host);

  try {
    const response = await fetch(targetUrl.toString(), {
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
