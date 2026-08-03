import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, capiAuthHeaderValue } from "@/lib/capi-runtime";

const CAPPO_BACKEND_URL = CAPI_RUNTIME_URL;
const CAPPO_ADMIN_KEY = capiAuthHeaderValue();
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
const VEKLOM_BACKEND_URL = process.env.BACKEND_URL || "https://api.veklom.com";

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname; // includes /api/...

  let targetUrl = "";
  let headers = new Headers(req.headers);
  headers.delete("host"); // Let the native fetch set the host
  headers.delete("connection");
  headers.delete("x-api-key"); // Never allow clients to select an upstream credential

  const LOCKERPHYCER_URL = process.env.LOCKERPHYCER_URL || "http://lockerphycer-api:8000";
  const LOCKERPHYCER_SECRET = process.env.SECRET_KEY || process.env.LOCKERPHYCER_SECRET_KEY || "";

  let targetBase = VBB_BACKEND_URL;
  if (path === "/v1/exec" || path.startsWith("/v1/exec/") || path.startsWith("/api/v1/capi/")) {
    targetBase = CAPPO_BACKEND_URL;
  } else if (path.startsWith("/api/v1/locker")) {
    targetBase = LOCKERPHYCER_URL;
  } else if (path.startsWith("/api/v1/webmcp") || path.startsWith("/webmcp") || path.startsWith("/mcp")) {
    targetBase = CAPPO_BACKEND_URL; // Forward WebMCP to the core runtime
  }

  if (targetBase === CAPPO_BACKEND_URL && CAPPO_ADMIN_KEY && CAPPO_ADMIN_KEY !== "dev-admin-key-do-not-use-in-prod") {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
  } else if (targetBase === LOCKERPHYCER_URL && LOCKERPHYCER_SECRET) {
    headers.set("Authorization", `Bearer ${LOCKERPHYCER_SECRET}`);
  }

  targetUrl = `${targetBase.replace(/\/+$/, "")}${path}${url.search}`;

  try {
    const init: RequestInit = {
      method: req.method,
      headers,
      // For Next 13+ fetch with body, we need to pass req body directly if it exists and is not GET/HEAD
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-ignore - duplx is needed for passing ReadableStream as body in Node 18+
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
