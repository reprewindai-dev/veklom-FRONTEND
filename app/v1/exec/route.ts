import { NextRequest, NextResponse } from "next/server";

const CAPPO_BACKEND_URL = process.env.CAPPO_BACKEND_URL || "https://cappo.veklom.com";
const CAPPO_ADMIN_KEY = process.env.CAPPO_API_KEY || "";

async function proxyExec(req: NextRequest) {
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");

  if (CAPPO_ADMIN_KEY) {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
  }

  try {
    const response = await fetch(`${CAPPO_BACKEND_URL.replace(/\/+$/, "")}/v1/exec${url.search}`, {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error duplex is required for streaming request bodies in Node fetch.
      duplex: "half",
      cache: "no-store",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "CAPPO governed execution unavailable", detail: err?.message || String(err) },
      { status: 502 },
    );
  }
}

export const POST = proxyExec;
export const OPTIONS = proxyExec;
