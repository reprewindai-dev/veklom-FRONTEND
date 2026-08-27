// Typed fetch client for the Veklom VCB API.
// Auth: JWT in `Authorization: Bearer <token>` header.
//
// API_BASE is intentionally empty by default so the control plane calls the
// SAME origin it is served from (e.g. https://veklom.com/api/v1/...). This
// avoids cross-origin CORS preflight on authenticated requests — the bug that
// caused the silent login loop when the app called https://api.veklom.com.

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// Two key conventions exist on the veklom.com domain:
//  - the control plane's own keys (veklom.access_token / veklom.refresh_token)
//  - the keys the backend GitHub OAuth bridge writes (veklom_token / veklom_refresh_token)
// We read both and write both so email login and GitHub login share a session.
const TOKEN_KEYS = ["veklom.access_token", "veklom_token"];
const REFRESH_KEYS = ["veklom.refresh_token", "veklom_refresh_token"];

// Session presence marker for edge middleware.
//
// Tokens live in localStorage, which middleware cannot read, and a browser cannot
// attach an Authorization header to a top-level navigation. This cookie carries no
// token material and grants nothing — it only tells middleware that a session
// exists so navigation can be routed to /login instead of rejected. Authorization
// is still decided by the backend on every API call.
const SESSION_COOKIE = "veklom.session";

function writeSessionMarker(present: boolean) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = present
    ? `${SESSION_COOKIE}=present; Path=/; SameSite=Lax; Max-Age=86400${secure}`
    : `${SESSION_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

/**
 * Reconciles the middleware marker with the stored token, so a session that predates
 * the marker is not treated as signed out on the next navigation.
 */
export function syncSessionMarker() {
  if (typeof window === "undefined") return;
  writeSessionMarker(Boolean(getToken()));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  for (const k of TOKEN_KEYS) {
    const v = window.localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}
export function setTokens(access: string, refresh?: string | null) {
  if (typeof window === "undefined") return;
  for (const k of TOKEN_KEYS) window.localStorage.setItem(k, access);
  if (refresh) for (const k of REFRESH_KEYS) window.localStorage.setItem(k, refresh);
  writeSessionMarker(true);
}
export function clearTokens() {
  if (typeof window === "undefined") return;
  for (const k of [...TOKEN_KEYS, ...REFRESH_KEYS, "veklom_user"]) {
    window.localStorage.removeItem(k);
  }
  writeSessionMarker(false);
}

export type ApiErrorKind = "http" | "html" | "invalid_json" | "network" | "configuration";
export type TransportState = "UNAVAILABLE" | "FAILED" | "UNKNOWN";

export class ApiError extends Error {
  constructor(
    public status: number | undefined,
    message: string,
    public body?: unknown,
    public kind: ApiErrorKind = "http",
    public path?: string,
  ) {
    super(message);
  }
}

export function getTransportState(error: unknown): TransportState {
  if (!(error instanceof ApiError)) return "UNKNOWN";
  if (error.kind === "configuration" || error.kind === "html" || error.status === 404) {
    return "UNAVAILABLE";
  }
  if (error.kind === "network") return "UNKNOWN";
  return "FAILED";
}

export interface RequestOpts {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** When true, do not attach the Authorization header (used for /auth/login etc.). */
  unauth?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  baseUrl?: string;
  /** When false, return 402 to the caller without opening the payment modal. */
  handlePaymentRequired?: boolean;
}

const PUBLIC_ROUTE_PREFIXES = [
  "/",
  "/blog",
  "/vnp",
  "/benchmarks",
  "/pricing",
  "/claim",
  "/discovery",
  "/dev",
  "/login",
  "/signup",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((route) => (
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`)
  ));
}

export function apiBaseUrl(): string {
  if (API_BASE) return API_BASE;
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

function buildUrl(path: string, query?: RequestOpts["query"], requestedBase?: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = requestedBase || apiBaseUrl() || origin;
  // If we are calling our own Next.js server, we must include the basePath so the rewrite rules apply
  const isSameOrigin = base === origin && !path.startsWith("http");
  const fullPath = isSameOrigin ? `${BASE_PATH}${path}` : path;

  const url = new URL(fullPath.startsWith("http") ? fullPath : `${base}${fullPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

export function apiUrl(path: string, query?: RequestOpts["query"]): string {
  return buildUrl(path, query);
}

function parseResponseBody(res: Response, text: string): unknown {
  if (!text) return undefined;

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const looksJson = contentType.includes("application/json") || contentType.includes("+json");

  if (looksJson) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError(
        502,
        "Expected valid JSON response but received malformed JSON",
        { upstreamStatus: res.status, contentType },
      );
    }
  }

  // For failed upstream calls, keep the HTTP status authoritative and let the
  // normal error path report it. For a successful API response, HTML/text is
  // never valid typed API data: this is the phantom-route/redirect failure mode.
  if (res.ok) {
    throw new ApiError(
      502,
      `Expected JSON response but received ${contentType || "unknown content type"}`,
      {
        upstreamStatus: res.status,
        contentType: contentType || null,
        bodyPreview: text.slice(0, 200),
      },
    );
  }

  return undefined;
}

export async function api<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Accept": "application/json",
    ...(opts.headers || {}),
  };
  if (typeof window !== "undefined") {
    const env = window.localStorage.getItem("veklom.environment") || "production";
    headers["X-Veklom-Environment"] = env;
  }
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (!opts.unauth) {
    const tok = getToken();
    if (tok) headers["Authorization"] = `Bearer ${tok}`;
  }

  const res = await fetch(buildUrl(path, opts.query, opts.baseUrl), {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });

  const text = await res.text();
  const json = parseResponseBody(res, text) as any;

  // Expose Runtime Authority metadata from headers
  const runtimeMeta = {
    execution: {
      executionId: res.headers.get("x-execution-id"),
      requestId: res.headers.get("x-request-id") || res.headers.get("x-veklom-request-id"),
      authorityId: res.headers.get("x-authority-id"),
    },
    evidence: {
      evidenceHash: res.headers.get("x-evidence-hash"),
      ledgerRef: res.headers.get("x-ledger-reference"),
      signatureIds: res.headers.get("x-signature-ids"),
    },
    settlement: {
      receiptId: res.headers.get("x-veklom-receipt-id"),
      paymentState: res.headers.get("x-payment-state"),
    },
    vnp: {
      stake: res.headers.get("x-vnp-stake"),
      stakeResult: res.headers.get("x-vnp-stake-result"),
      yieldInfo: res.headers.get("x-vnp-yield"),
      slashInfo: res.headers.get("x-vnp-slash"),
    }
  };

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("VeklomRuntimeMetadata", { detail: runtimeMeta }));
  }

  // Attach metadata to JSON response if it's an object (non-destructive extension)
  if (json && typeof json === "object" && !Array.isArray(json)) {
    (json as any)._runtimeMeta = runtimeMeta;
  }

  if (typeof window !== "undefined") {
    if (res.status === 503 || (json && ((json as any).status === "degraded" || (json as any)._stale === true))) {
      window.dispatchEvent(new CustomEvent("VeklomDegradedState", {
        detail: {
          isDegraded: true,
          message: (json as any)?.error || "Veklom Core Services are currently experiencing instability. Control Plane is in Read-Only Mode."
        }
      }));
    }
  }

  if (!res.ok) {
    const msg =
      (json && (json.detail || json.message || json.error)) ||
      res.statusText ||
      `HTTP ${res.status}`;

    if (typeof window !== "undefined") {
      const isPublicPage = isPublicRoute(window.location.pathname);

      if (res.status === 412) {
        const event = new CustomEvent("VeklomStateBoundAuthorityViolation", {
          detail: { type: "PRECONDITION_FAILED", message: msg }
        });
        window.dispatchEvent(event);
        throw new ApiError(res.status, "State-Bound Authority Violation: " + String(msg), json);
      } else if (res.status === 428) {
        const event = new CustomEvent("VeklomFencingTokenRequired", {
          detail: { type: "PRECONDITION_REQUIRED", message: msg }
        });
        window.dispatchEvent(event);
        throw new ApiError(res.status, "Fencing Token Required: " + String(msg), json);
      } else if (res.status === 402 && opts.handlePaymentRequired !== false) {
        if (!isPublicPage) {
          const paymentRequiredHeader = res.headers.get("payment-required");
          const facilitatorUrl = res.headers.get("x-402-facilitator-url");

          const event = new CustomEvent("X402PaymentIntervention", {
            detail: {
              type: "PAYMENT_REQUIRED",
              message: msg,
              paymentRequiredHeader,
              facilitatorUrl
            }
          });
          window.dispatchEvent(event);

          throw new ApiError(res.status, "x402 Payment Intervention Triggered: " + String(msg), json);
        }
      } else if (res.status === 403 || res.status === 401) {
        const normalizedMessage = String(msg).toLowerCase();
        const isAuthTokenError = normalizedMessage.includes("invalid or expired token") ||
                                 normalizedMessage.includes("invalid token") ||
                                 normalizedMessage.includes("token expired") ||
                                 normalizedMessage.includes("not authenticated") ||
                                 normalizedMessage.includes("signature has expired") ||
                                 normalizedMessage.includes("credentials") ||
                                 normalizedMessage.includes("unauthorized");

        const code = (json as any)?.code || "";
        if (!isAuthTokenError && (code.includes("LAW0") || normalizedMessage.includes("key") || normalizedMessage.includes("token"))) {
          const event = new CustomEvent("AmbientIntervention", {
            detail: { type: "MISSING_KEY", message: msg, code }
          });
          window.dispatchEvent(event);

          throw new ApiError(res.status, "Ambient Intervention Triggered: " + String(msg), json);
        }

        if (isPublicPage) {
          throw new ApiError(res.status, String(msg), json);
        }

        if (normalizedMessage.includes("token") || normalizedMessage.includes("auth")) {
          if (!window.location.pathname.startsWith("/login")) {
            window.location.href = "/login";
          }
        } else {
          if (!window.location.pathname.startsWith("/governance")) {
            window.location.href = "/governance";
          }
        }
      }
    }

    throw new ApiError(res.status, String(msg), json);
  }
  return json as T;
}

api.get = <T,>(path: string, opts?: RequestOpts) => api<T>(path, { ...opts, method: 'GET' });
api.post = <T,>(path: string, body?: any, opts?: RequestOpts) => api<T>(path, {
  ...opts,
  method: 'POST',
  body,
  headers: {
    ...(opts?.headers || {})
  }
});
api.delete = <T,>(path: string, opts?: RequestOpts) => api<T>(path, { ...opts, method: 'DELETE' });

// SWR fetcher
export const fetcher = <T,>(path: string) => api<T>(path);

export async function duelApi<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const DUEL_BASE = "https://veklom-agent-duel.vercel.app";
  const headers: Record<string, string> = {
    "Accept": "application/json",
  };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const url = new URL(path.startsWith("http") ? path : `${DUEL_BASE}${path}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v));
      }
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });

  const text = await res.text();
  const json = parseResponseBody(res, text) as any;
  if (!res.ok) {
    const msg =
      (json && (json.detail || json.message || json.error)) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(res.status, String(msg), json);
  }
  return json as T;
}
