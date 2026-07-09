import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, capiAuthHeaderValue, CAPI_EXECUTION_PATH } from "@/lib/capi-runtime";

const CAPPO_BACKEND_URL = CAPI_RUNTIME_URL;
const CAPPO_ADMIN_KEY = capiAuthHeaderValue();

async function proxyExec(req: NextRequest) {
  const url = new URL(req.url);
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");

  if (CAPPO_ADMIN_KEY) {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
  }

  try {
    const response = await fetch(`${CAPPO_BACKEND_URL.replace(/\/+$/, "")}${CAPI_EXECUTION_PATH}${url.search}`, {
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
      { error: "interlink-cAPI governed execution unavailable", detail: err?.message || String(err) },
      { status: 502 },
    );
  }
}

export const POST = proxyExec;
export const OPTIONS = proxyExec;
