import { NextRequest, NextResponse } from "next/server";
import { capiAuthHeaderValue, capiExecutionUrl } from "@/lib/capi-runtime";

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

function validateRequest(req: NextRequest): NextResponse | null {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "interlink-cAPI execution requires application/json" },
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

  const now = Date.now();
  const key = clientKey(req);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > 60) {
    return NextResponse.json(
      { error: "interlink-cAPI execution rate limit exceeded", retry_after_seconds: Math.ceil((bucket.resetAt - now) / 1000) },
      { status: 429 },
    );
  }

  return null;
}

function forwardedHeaders(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  headers.set("accept", "application/json");
  headers.set("x-veklom-runtime-proxy", "control-plane");
  headers.set("x-veklom-runtime-source", "interlink-capi");

  const apiKey = capiAuthHeaderValue();
  if (apiKey) headers.set("x-api-key", apiKey);

  return headers;
}

function normalizeCapiPayload(body: any): Record<string, unknown> {
  const action = typeof body?.action === "string" ? body.action : "execute";
  return {
    agent_id: body?.agent_id && body.agent_id !== "agent-test" ? body.agent_id : "agent-atlas",
    capability_id: body?.capability_id || body?.capability || "cap-search",
    action,
    input: {
      target_protocol: body?.target_protocol || "capi",
      payload: body?.payload || {},
      workspace_id: body?.workspace_id || "default",
    },
    approvals: Array.isArray(body?.approvals) ? body.approvals : undefined,
  };
}

export async function POST(req: NextRequest) {
  const validation = validateRequest(req);
  if (validation) return validation;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const response = await fetch(capiExecutionUrl(), {
      method: "POST",
      headers: forwardedHeaders(req),
      body: JSON.stringify(normalizeCapiPayload(body)),
      cache: "no-store",
    });

    const text = await response.text();
    const data = text ? safeJson(text) : {};
    if (!response.ok) {
      return NextResponse.json(data || { error: "interlink-cAPI execution unavailable" }, {
        status: response.status,
        headers: { "cache-control": "no-store" },
      });
    }

    const runId = data?.run_id || data?.execution_id || data?.log_id || null;
    return NextResponse.json(
      {
        ...data,
        run_id: runId,
        execution_id: data?.execution_id || runId,
        proof_source: "interlink-cAPI",
        covenant_runtime: true,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    const detail = err instanceof Error ? err.message.slice(0, 180) : "interlink-cAPI execution proxy failed";
    return NextResponse.json(
      { error: "interlink-cAPI execution unavailable", detail },
      { status: 502 },
    );
  }
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Cache-Control": "no-store",
    },
  });
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return { response: text };
  }
}
