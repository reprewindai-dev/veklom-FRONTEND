import { NextRequest, NextResponse } from "next/server";

/**
 * Mechanical BYOS proxy.
 *
 * The Capability OS must never manufacture backend state in the frontend.
 * Every /api/v1/* request is forwarded byte-for-byte to the configured BYOS
 * backend, preserving the caller's JWT/cookies and the backend's runtime,
 * evidence, settlement, and VNP response headers.
 */
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.VBB_BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8088");

const HOP_BY_HOP_REQUEST_HEADERS = new Set([
  "connection",
  "host",
  "content-length",
  "transfer-encoding",
]);

const HOP_BY_HOP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

async function proxyToByos(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!BACKEND_URL) {
    return NextResponse.json(
      {
        error: "BACKEND_NOT_CONFIGURED",
        detail: "BACKEND_URL/VBB_BACKEND_URL is required for /api/v1 proxying.",
      },
      { status: 503 },
    );
  }

  const { path } = await context.params;
  const incomingUrl = new URL(req.url);
  const upstreamPath = `/api/v1/${path.join("/")}`;
  const upstreamUrl = `${BACKEND_URL.replace(/\/+$/, "")}${upstreamPath}${incomingUrl.search}`;

  const headers = new Headers(req.headers);
  for (const name of HOP_BY_HOP_REQUEST_HEADERS) headers.delete(name);

  try {
    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
      redirect: "manual",
      cache: "no-store",
      // Required by Node when forwarding a ReadableStream request body.
      // @ts-expect-error Node fetch extension
      duplex: "half",
    });

    const responseHeaders = new Headers(upstream.headers);
    for (const name of HOP_BY_HOP_RESPONSE_HEADERS) responseHeaders.delete(name);

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[BYOS proxy] upstream request failed", error);
    return NextResponse.json(
      {
        error: "BACKEND_UNREACHABLE",
        detail: "The configured BYOS backend could not be reached.",
      },
      { status: 502 },
    );
  }
}

export const GET = proxyToByos;
export const POST = proxyToByos;
export const PUT = proxyToByos;
export const PATCH = proxyToByos;
export const DELETE = proxyToByos;
export const OPTIONS = proxyToByos;
