import { NextRequest, NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, CAPPO_BACKEND_URL, capiAuthHeaderValue } from "@/lib/capi-runtime";
import {
  isCappoExecPath,
  isCappoIdentityPath,
  isCappoProxyPath,
} from "@/lib/cappo-proxy-paths";

const CAPI_ADMIN_KEY = capiAuthHeaderValue();
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";
const PGL_URL = process.env.PGL_URL || "https://pgl.veklom.com";
const LOCKERPHYCER_URL = (process.env.LOCKERPHYCER_URL || "").replace(/\/+$/, "");
const LOCKERPHYCER_SECRET = process.env.LOCKERPHYCER_SECRET_KEY || "";
const VLINK_URL = (process.env.VLINK_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

const HOP_BY_HOP_HEADERS = [
  "connection",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
];

function stripHopByHopHeaders(headers: Headers) {
  const connectionHeader = headers.get("connection") || "";
  const nominated = connectionHeader.split(",");
  const toDelete = [...HOP_BY_HOP_HEADERS];
  for (const val of nominated) {
    const trimmed = val.trim().toLowerCase();
    if (trimmed) toDelete.push(trimmed);
  }
  for (const header of toDelete) headers.delete(header);
}

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  const path = url.pathname;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("x-api-key");
  stripHopByHopHeaders(headers);

  let targetBase = "";
  let forwardPath = path;

  if (path.startsWith("/api/cappo/")) {
    if (!CAPPO_BACKEND_URL) {
      return NextResponse.json(
        { error: "CAPPO capability proxy is not configured" },
        { status: 503 },
      );
    }

    forwardPath = path.replace(/^\/api\/cappo/, "");
    if (!isCappoProxyPath(forwardPath)) {
      return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
    }

    targetBase = CAPPO_BACKEND_URL;
    headers.delete("authorization");
    headers.delete("cookie");
    headers.delete("x-workspace-id");
    headers.delete("x-veklom-requester-id");

    if (
      isCappoExecPath(forwardPath) ||
      isCappoIdentityPath(forwardPath) ||
      forwardPath.startsWith("/v1/capability/") ||
      forwardPath.startsWith("/v1/executions/")
    ) {
      if (req.headers.has("authorization")) {
        headers.set("authorization", req.headers.get("authorization")!);
      }
    }
  } else if (path.startsWith("/api/capi/")) {
    targetBase = CAPI_RUNTIME_URL;
    forwardPath = path.replace(/^\/api\/capi/, "/api/v1/capi");
  } else if (path.startsWith("/api/ledger/")) {
    targetBase = PGL_URL;
    forwardPath = path.replace(/^\/api\/ledger/, "/api/v1/ledger");
  } else if (path.startsWith("/api/v1/locker") || path.startsWith("/api/v1/auth")) {
    if (!LOCKERPHYCER_URL) {
      return NextResponse.json(
        { error: "LockerPhycer backend is not configured" },
        { status: 503 },
      );
    }
    targetBase = LOCKERPHYCER_URL;
  } else if (
    path.startsWith("/api/v1/vlinks") ||
    path.startsWith("/api/v1/webhooks")
  ) {
    targetBase = VLINK_URL;
  } else if (
    path.startsWith("/api/v1/webmcp") ||
    path.startsWith("/webmcp") ||
    path.startsWith("/mcp")
  ) {
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
    // Explicit legacy compatibility routes only. There is deliberately no
    // catch-all /api/v1 -> VBB/BYOS fallback. Any unowned route fails closed.
    targetBase = VBB_BACKEND_URL;
  } else {
    return NextResponse.json({ error: "Route not found in proxy table", path }, { status: 404 });
  }

  const hasBearerIdentity = (headers.get("authorization") || "")
    .toLowerCase()
    .startsWith("bearer");

  if (targetBase === LOCKERPHYCER_URL && LOCKERPHYCER_SECRET) {
    headers.set("Authorization", `Bearer ${LOCKERPHYCER_SECRET}`);
  } else if (targetBase === CAPI_RUNTIME_URL && !hasBearerIdentity && CAPI_ADMIN_KEY) {
    headers.set("x-api-key", CAPI_ADMIN_KEY);
  }

  const targetUrl = new URL(`${targetBase.replace(/\/+$/, "")}${forwardPath}${url.search}`);
  headers.set("host", targetUrl.host);

  try {
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error Node fetch requires duplex for streamed request bodies.
      duplex: "half",
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers(response.headers);
    stripHopByHopHeaders(responseHeaders);
    responseHeaders.delete("content-encoding");

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown upstream error";
    console.error("Proxy error:", message);
    return NextResponse.json({ error: "Gateway Proxy Error" }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
