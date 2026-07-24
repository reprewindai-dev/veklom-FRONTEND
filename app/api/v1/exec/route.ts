import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, capiAuthHeaderValue, CAPI_EXECUTION_PATH } from "@/lib/capi-runtime";
import { hasBearerAuthorization } from "@/lib/authorization";

const CAPPO_BACKEND_URL = CAPI_RUNTIME_URL;
const CAPPO_ADMIN_KEY = capiAuthHeaderValue();
const MAX_EXEC_BODY_BYTES = 512 * 1024;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function clientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

function rateLimit(req: NextRequest): NextResponse | null {
  const now = Date.now();
  const key = clientKey(req);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  current.count += 1;
  if (current.count > 60) {
    return NextResponse.json(
      { error: "Execution rate limit exceeded", retry_after_seconds: Math.ceil((current.resetAt - now) / 1000) },
      { status: 429 },
    );
  }

  return null;
}

function validateRequest(req: NextRequest): NextResponse | null {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "CAPPO Backend execution requires application/json" },
      { status: 415 },
    );
  }

  const length = Number(req.headers.get("content-length") || "0");
  if (length > MAX_EXEC_BODY_BYTES) {
    return NextResponse.json(
      { error: "Execution payload exceeds 512KB limit" },
      { status: 413 },
    );
  }

  return rateLimit(req);
}

function forwardedHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("x-api-key");

  headers.set("accept", "application/json");
  headers.set("x-veklom-runtime-proxy", "control-plane");

  if (CAPPO_ADMIN_KEY) {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
  }

  return headers;
}

async function proxyExec(req: NextRequest) {
  if (!hasBearerAuthorization(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Bearer authorization required" }, { status: 401 });
  }
  const validation = validateRequest(req);
  if (validation) return validation;

  const url = new URL(req.url);

  try {
    const response = await fetch(
      `${CAPPO_BACKEND_URL.replace(/\/+$/, "")}${CAPI_EXECUTION_PATH}${url.search}`,
      {
        method: "POST",
        headers: forwardedHeaders(req),
        body: req.body,
        // @ts-expect-error duplex is required for streaming request bodies in Node fetch.
        duplex: "half",
        cache: "no-store",
      },
    );

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.set("cache-control", "no-store");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 180) : "CAPPO Backend execution proxy failed";
    return NextResponse.json(
      { error: "CAPPO Backend governed execution unavailable", detail },
      { status: 502 },
    );
  }
}

export const POST = proxyExec;

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Cache-Control": "no-store",
    },
  });
}
