import { NextRequest, NextResponse } from "next/server";

const CAPPO_BACKEND_URL = process.env.CAPPO_BACKEND_URL || "https://cappo.veklom.com";
const CAPPO_ADMIN_KEY = process.env.CAPPO_API_KEY || process.env.CAPPO_BACKEND_API_KEY || "";
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
      { error: "Cappo execution requires application/json" },
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

  headers.set("accept", "application/json");
  headers.set("x-veklom-runtime-proxy", "control-plane");

  if (CAPPO_ADMIN_KEY) {
    headers.set("x-api-key", CAPPO_ADMIN_KEY);
  }

  return headers;
}

async function proxyExec(req: NextRequest) {
  const validation = validateRequest(req);
  if (validation) return validation;

  const url = new URL(req.url);

  try {
    const response = await fetch(
      `${CAPPO_BACKEND_URL.replace(/\/+$/, "")}/v1/exec${url.search}`,
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
    const detail = err instanceof Error ? err.message.slice(0, 180) : "Cappo execution proxy failed";
    return NextResponse.json(
      { error: "CAPPO governed execution unavailable", detail },
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
