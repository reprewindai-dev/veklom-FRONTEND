import { NextRequest, NextResponse } from"next/server";
import { CAPI_RUNTIME_URL, CAPPO_BACKEND_URL, capiAuthHeaderValue } from"@/lib/capi-runtime";
import {
 isCappoExecPath,
 isCappoIdentityPath,
 isCappoProxyPath,
} from"@/lib/cappo-proxy-paths";

const CAPI_ADMIN_KEY = capiAuthHeaderValue();
const VBB_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL ||"https://api.veklom.com";
const PGL_URL = process.env.PGL_URL ||"https://pgl.veklom.com";
const LOCKERPHYCER_URL = (process.env.LOCKERPHYCER_URL ||"").replace(/\/+$/,"");
const LOCKERPHYCER_SECRET = process.env.LOCKERPHYCER_SECRET_KEY ||"";

const HOP_BY_HOP_HEADERS = ["connection","content-length","keep-alive","proxy-authenticate","proxy-authorization","te","trailer","transfer-encoding","upgrade",
];

function stripHopByHopHeaders(headers: Headers) {
 const nominated = (headers.get("connection") ||"")
 .split(",")
 .map((value) => value.trim().toLowerCase())
 .filter(Boolean);

 for (const header of [...HOP_BY_HOP_HEADERS, ...nominated]) {
 headers.delete(header);
 }
}

type CappoAssertionExchangeResult =
 | { kind:"success"; token: string }
 | { kind:"unauthenticated" }
 | { kind:"missing-workspace"; body: unknown }
 | { kind:"unavailable" };

async function exchangeCappoAssertion(req: NextRequest): Promise<CappoAssertionExchangeResult> {
 const authHeaders = new Headers();
 const authorization = req.headers.get("authorization");
 const cookie = req.headers.get("cookie");
 if (authorization) authHeaders.set("authorization", authorization);
 if (cookie) authHeaders.set("cookie", cookie);
 authHeaders.set("accept","application/json");

 try {
 const response = await fetch(
 `${VBB_BACKEND_URL.replace(/\/+$/,"")}/api/v1/auth/cappo-token`,
 {
 method:"POST",
 headers: authHeaders,
 redirect:"manual",
 cache:"no-store",
 },
 );
 if (response.status === 401) {
 return { kind:"unauthenticated" };
 }
 if (response.status === 403) {
 let body: unknown = { detail: { error:"WORKSPACE_CONTEXT_MISSING" } };
 try {
 body = await response.json();
 } catch {
 // Preserve the endpoint's documented error shape if its body is unreadable.
 }
 return { kind:"missing-workspace", body };
 }
 if (!response.ok) return { kind:"unavailable" };
 const body = (await response.json()) as { access_token?: unknown };
 return typeof body.access_token ==="string" && body.access_token
 ? { kind:"success", token: body.access_token }
 : { kind:"unavailable" };
 } catch {
 return { kind:"unavailable" };
 }
}

async function proxyRequest(req: NextRequest) {
 const url = new URL(req.url);
 const path = url.pathname;

 const headers = new Headers(req.headers);
 headers.delete("host");
 headers.delete("x-api-key");
 stripHopByHopHeaders(headers);

 let targetBase ="";
 let forwardPath = path;

 if (path.startsWith("/api/cappo/")) {
 if (!CAPPO_BACKEND_URL) {
 return NextResponse.json(
 { error:"CAPPO capability proxy is not configured" },
 { status: 503 },
 );
 }

 forwardPath = path.replace(/^\/api\/cappo/,"");
 if (!isCappoProxyPath(forwardPath)) {
 return NextResponse.json({ error:"Route not found in proxy table", path }, { status: 404 });
 }

 targetBase = CAPPO_BACKEND_URL;
 headers.delete("authorization");
 headers.delete("cookie");
 headers.delete("x-workspace-id");
 headers.delete("x-veklom-requester-id");

 if (isCappoExecPath(forwardPath) || isCappoIdentityPath(forwardPath)) {
 // Authenticate the browser session against BYOS and mint a short-lived,
 // workspace-bound CAPPO audience assertion. The browser never receives
 // or forwards a standing CAPPO operator credential.
 const exchange = await exchangeCappoAssertion(req);
 if (exchange.kind ==="unauthenticated") {
 return NextResponse.json(
 { error:"AUTHENTICATION_REQUIRED" },
 { status: 401 },
 );
 }
 if (exchange.kind ==="missing-workspace") {
 return NextResponse.json(exchange.body, { status: 403 });
 }
 if (exchange.kind ==="unavailable") {
 return NextResponse.json(
 { error:"CAPPO_ASSERTION_UNAVAILABLE" },
 { status: 502 },
 );
 }
 headers.set("authorization", `Bearer ${exchange.token}`);
 }
 } else if (path.startsWith("/api/capi/")) {
 targetBase = CAPI_RUNTIME_URL;
 forwardPath = path.replace(/^\/api\/capi/,"/api/v1/capi");
 } else if (path.startsWith("/api/ledger/")) {
 targetBase = PGL_URL;
 forwardPath = path.replace(/^\/api\/ledger/,"/api/v1/ledger");
 } else if (path.startsWith("/api/v1/locker")) {
 if (!LOCKERPHYCER_URL) {
 return NextResponse.json(
 { error:"Lockerphycer backend is not configured" },
 { status: 503 },
 );
 }
 targetBase = LOCKERPHYCER_URL;
 } else if (path.startsWith("/api/v1/webmcp") || path.startsWith("/webmcp") || path.startsWith("/mcp")) {
 if (!CAPPO_BACKEND_URL) {
 return NextResponse.json({ error:"CAPPO backend is not configured" }, { status: 503 });
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
 targetBase = VBB_BACKEND_URL;
 } else if (path.startsWith("/api/v1/")) {
 // BYOS owns the remaining /api/v1 namespace. Keep this fallback broad so
 // new BYOS routes are not shadowed by this frontend proxy table.
 targetBase = VBB_BACKEND_URL;
 } else {
 return NextResponse.json({ error:"Route not found in proxy table", path }, { status: 404 });
 }

 const hasBearerIdentity = (headers.get("authorization") ||"")
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
 body: req.method !=="GET" && req.method !=="HEAD" ? req.body : undefined,
 // @ts-expect-error Node fetch requires duplex for streamed request bodies.
 duplex:"half",
 redirect:"manual",
 cache:"no-store",
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
 const message = err instanceof Error ? err.message :"Unknown upstream error";
 console.error("Proxy error:", message);
 return NextResponse.json({ error:"Gateway Proxy Error" }, { status: 502 });
 }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
