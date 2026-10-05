import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, CAPPO_BACKEND_URL, capiAuthHeaderValue } from "@/lib/capi-runtime";
import {
  isCappoExecPath,
  isCappoIdentityPath,
  isCappoProxyPath,
} from "@/lib/cappo-proxy-paths";
import { computlessForwardPath } from "@/lib/computless-proxy-paths";

const CAPI_ADMIN_KEY = capiAuthHeaderValue();
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
const PGL_URL = process.env.PGL_URL || "https://pgl.veklom.com";
const PGL_LEDGER_API_KEY = process.env.PGL_LEDGER_API_KEY || "";
const LOCKERPHYCER_URL = (process.env.LOCKERPHYCER_URL || "").replace(/\/+$/, "");
const LOCKERPHYCER_SECRET = process.env.LOCKERPHYCER_SECRET_KEY || "";
const VLINK_URL = (process.env.VLINK_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
// Private Cloud (COMPUTLESS owned-compute fabric). The owner token never leaves this server.
const COMPUTLESS_URL = (process.env.COMPUTLESS_URL || "").replace(/\/+$/, "");
const FABRIC_OWNER_TOKEN = process.env.FABRIC_OWNER_TOKEN || "";
const COMPUTLESS_SANDBOX_URL = (process.env.COMPUTLESS_SANDBOX_URL || "").replace(/\/+$/, "");
const FABRIC_SANDBOX_OWNER_TOKEN = process.env.FABRIC_SANDBOX_OWNER_TOKEN || "";

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
  stripHopByHopHeaders(headers);

  let targetBase = "";
  let forwardPath = path;
  const isPglRoute = path.startsWith("/api/pgl/") || path.startsWith("/api/ledger/");

  if (path.startsWith("/api/computless/")) {
    // Production and sandbox are separate fabrics with separate machines and owner tokens.
    // The data mode picks one; there is no fallback from one to the other.
    const sandboxMode = (req.headers.get("x-veklom-data-mode") || url.searchParams.get("mode")) === "sandbox";
    const fabricUrl = sandboxMode ? COMPUTLESS_SANDBOX_URL : COMPUTLESS_URL;
    const ownerToken = sandboxMode ? FABRIC_SANDBOX_OWNER_TOKEN : FABRIC_OWNER_TOKEN;
    if (!fabricUrl) {
      return NextResponse.json(
        { error: sandboxMode ? "Private Cloud sandbox fabric is not configured" : "Private Cloud (COMPUTLESS) is not configured" },
        { status: 503 },
      );
    }
    const route = computlessForwardPath(req.method, path);
    if (!route) {
      return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
    }
    // Fabric state describes the organization's machines: an authenticated principal is required.
    const principalError = await requirePrincipal(req);
    if (principalError) return principalError;
    headers.delete("authorization");
    headers.delete("cookie");
    if (route.owner) {
      if (!ownerToken) {
        return NextResponse.json({ error: "Private Cloud owner actions are not configured" }, { status: 503 });
      }
      headers.set("authorization", `Bearer ${ownerToken}`);
    }
    targetBase = fabricUrl;
    forwardPath = route.forward;
  } else if (path.startsWith("/api/cappo/")) {
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
  } else if (path.startsWith("/api/pgl/")) {
    targetBase = PGL_URL;
    forwardPath = path.replace(/^\/api\/pgl/, "/api/v1");
  } else if (path.startsWith("/api/ledger/")) {
    targetBase = PGL_URL;
    forwardPath = path.replace(/^\/api\/ledger/, "/api/v1/ledger");
  } else if (
    path.startsWith("/api/v1/locker") ||
    path.startsWith("/api/v1/auth") ||
    path.startsWith("/api/v1/workspace")
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
    // catch-all /api/v1 -> VBB/BYOS fallback. Any unowned route fails closed.
    targetBase = VBB_BACKEND_URL;
  } else {
    return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
  }

  const hasBearerIdentity = (headers.get("authorization") || "")
    .toLowerCase()
    .startsWith("bearer");

  if (isPglRoute) {
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
  } else if (targetBase === LOCKERPHYCER_URL && LOCKERPHYCER_SECRET && !hasBearerIdentity) {
    headers.set("Authorization", `Bearer ${LOCKERPHYCER_SECRET}`);
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
