import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, CAPPO_BACKEND_URL, capiAuthHeaderValue, cappoAuthHeaderValue } from "@/lib/capi-runtime";

const CAPI_ADMIN_KEY = capiAuthHeaderValue();
const CAPPO_ADMIN_KEY = cappoAuthHeaderValue();
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
const PGL_URL = process.env.PGL_URL || "https://pgl.veklom.com";
const LOCKERPHYCER_URL = process.env.LOCKERPHYCER_URL || "http://lockerphycer-api:8000";
const LOCKERPHYCER_SECRET = process.env.SECRET_KEY || process.env.LOCKERPHYCER_SECRET_KEY || "";

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("transfer-encoding");
  // Never allow a browser to select a privileged upstream credential.
  headers.delete("x-api-key");

  let targetBase = "";
  let forwardPath = path;
  let preserveRequesterIdentity = false;

  // Explicit Upstream Route Table
  if (path.startsWith("/api/cappo/v1/capability/")) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json({ error: "CAPPO backend is not configured" }, { status: 503 });
    }
    targetBase = CAPPO_BACKEND_URL;
    forwardPath = path.replace(/^\/api\/cappo/, "");
    // Mount/package ownership is workspace-scoped. Preserve the user's bearer
    // identity so CAPPO can enforce auth_workspace against execution_scope.
    preserveRequesterIdentity = true;
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

  // Inject server credentials only for machine-to-machine routes that are not
  // required to preserve the caller's workspace identity.
  if (
    targetBase === CAPPO_BACKEND_URL &&
    !preserveRequesterIdentity &&
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
    const init: RequestInit = {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error Node fetch requires duplex for streamed request bodies.
      duplex: "half",
      redirect: "manual",
      cache: "no-store",
    };

    const response = await fetch(targetUrl, init);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("connection");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Proxy error:", err.message);
    return NextResponse.json({ error: "Gateway Proxy Error", details: err.message }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
