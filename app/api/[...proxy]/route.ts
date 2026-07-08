import { NextRequest, NextResponse } from "next/server";

const CAPPO_BACKEND_URL = process.env.CAPPO_BACKEND_URL || "https://cappo.veklom.com";
const CAPPO_ADMIN_KEY = process.env.CAPPO_API_KEY || "dev-admin-key-do-not-use-in-prod";
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
const VEKLOM_BACKEND_URL = process.env.BACKEND_URL || "https://api.veklom.com";

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname; // includes /api/...

  let targetUrl = "";
  let headers = new Headers(req.headers);
  headers.delete("host"); // Let the native fetch set the host
  headers.delete("connection");

  const targetBase = path === "/v1/exec" || path.startsWith("/v1/exec/")
    ? CAPPO_BACKEND_URL
    : VBB_BACKEND_URL;

  if (targetBase === CAPPO_BACKEND_URL && CAPPO_ADMIN_KEY && CAPPO_ADMIN_KEY !== "dev-admin-key-do-not-use-in-prod") {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
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
