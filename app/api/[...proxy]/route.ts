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
  const path = url.pathname; // includes /api/...

  let headers = new Headers(req.headers);
  headers.delete("host"); // Let the native fetch set the host
  headers.delete("connection");
  headers.delete("x-api-key"); // Never allow clients to select an upstream credential

  let targetBase = "";
  let forwardPath = path;

  // Explicit Upstream Route Table
  if (path.startsWith("/api/cappo/v1/capability/")) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json({ error: "CAPPO backend is not configured" }, { status: 500 });
    }
    targetBase = CAPPO_BACKEND_URL;
    forwardPath = path.replace(/^\/api\/cappo/, ""); // Forward as /v1/capability/...
  } else if (path === "/api/cappo/v1/exec" || path.startsWith("/api/cappo/v1/exec/")) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json({ error: "CAPPO backend is not configured" }, { status: 500 });
    }
    targetBase = CAPPO_BACKEND_URL;
    forwardPath = path.replace(/^\/api\/cappo/, "");
  } else if (path.startsWith("/api/capi/")) {
    targetBase = CAPI_RUNTIME_URL;
    forwardPath = path.replace(/^\/api\/capi/, "/api/v1/capi"); // Forward to cAPI
  } else if (path.startsWith("/api/ledger/")) {
    targetBase = PGL_URL;
    forwardPath = path.replace(/^\/api\/ledger/, "/api/v1/ledger"); // Forward to PGL
  } else if (path.startsWith("/api/v1/locker")) {
    targetBase = LOCKERPHYCER_URL;
  } else if (path.startsWith("/api/v1/webmcp") || path.startsWith("/webmcp") || path.startsWith("/mcp")) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json({ error: "CAPPO backend is not configured" }, { status: 500 });
    }
    targetBase = CAPPO_BACKEND_URL; // Forward WebMCP to the core runtime
  } else if (path.startsWith("/api/v1/agents") || path.startsWith("/api/v1/benchmarks") || path.startsWith("/api/v1/gpc") || path.startsWith("/api/v1/execution") || path.startsWith("/v1/governance") || path.startsWith("/api/v1/pricing") || path.startsWith("/api/v1/x402") || path.startsWith("/api/v1/platform")) {
     // Legacy allowlist for VBB_BACKEND_URL / other known paths
     // Wait, the instructions say "No unknown edge route receives a default origin."
     // So we must explicitly map these.
     targetBase = VBB_BACKEND_URL;
  } else {
    // Fail closed
    return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
  }

  // Inject Server Credentials
  if (targetBase === CAPPO_BACKEND_URL && CAPPO_ADMIN_KEY && CAPPO_ADMIN_KEY !== "dev-admin-key-do-not-use-in-prod") {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
  } else if (targetBase === LOCKERPHYCER_URL && LOCKERPHYCER_SECRET) {
    headers.set("Authorization", `Bearer ${LOCKERPHYCER_SECRET}`);
  } else if (targetBase === CAPI_RUNTIME_URL && CAPI_ADMIN_KEY) {
    headers.set("x-api-key", CAPI_ADMIN_KEY);
  }

  const targetUrl = `${targetBase.replace(/\/+$/, "")}${forwardPath}${url.search}`;

  try {
    const init: RequestInit = {
      method: req.method,
      headers,
      // For Next 13+ fetch with body, we need to pass req body directly if it exists and is not GET/HEAD
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-ignore - duplex is needed for passing ReadableStream as body in Node 18+
      duplex: "half", 
    };

    const response = await fetch(targetUrl, init);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding"); // Let Next.js handle encoding

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
