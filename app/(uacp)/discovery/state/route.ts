import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BYOS_API_BASE = process.env.BYOS_API_BASE_URL || "https://api.veklom.com";
const DISCOVERY_APP_BASE = process.env.VEKLOM_DISCOVERY_BASE_URL || "https://discovery.veklom.com";

type ProbeState = "verified" | "needs_auth" | "needs_payment" | "error";

interface ProbeResult {
  route: string;
  state: ProbeState;
  status: number;
  detail?: string;
  count?: number;
  payment?: {
    price_usdc?: string;
    network?: string;
    asset?: string;
    challenge_id?: string;
  };
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeError(data: unknown): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data.slice(0, 180);
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    return String(record.detail || record.message || record.error || record.reason || "").slice(0, 180) || undefined;
  }
  return undefined;
}

function stateForStatus(status: number): ProbeState {
  if (status === 401 || status === 403) return "needs_auth";
  if (status === 402) return "needs_payment";
  if (status >= 200 && status < 300) return "verified";
  return "error";
}

async function probe(base: string, route = "", init?: RequestInit): Promise<ProbeResult> {
  const url = `${trimSlash(base)}${route}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json,text/html", ...(init?.headers || {}) },
      cache: "no-store",
      ...init,
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    const state = stateForStatus(res.status);

    return {
      route: route || url,
      state,
      status: res.status,
      detail: state === "verified" ? undefined : normalizeError(data) || res.statusText,
      count: Array.isArray(data) ? data.length : undefined,
      payment:
        state === "needs_payment"
          ? {
              price_usdc: res.headers.get("x-payment-price-usdc") || undefined,
              network: res.headers.get("x-payment-network") || undefined,
              asset: res.headers.get("x-payment-asset") || undefined,
              challenge_id: res.headers.get("x-payment-challenge-id") || undefined,
            }
          : undefined,
    };
  } catch (error) {
    return {
      route: route || url,
      state: "error",
      status: 0,
      detail: error instanceof Error ? error.message : "probe failed",
    };
  }
}

export async function GET() {
  const [discoveryApp, x402Discovery, pglRegistry, x402Search, capiDiscover, capiState] = await Promise.all([
    probe(DISCOVERY_APP_BASE),
    probe(BYOS_API_BASE, "/.well-known/x402.json"),
    probe(BYOS_API_BASE, "/api/v1/pgl/registry"),
    probe(BYOS_API_BASE, "/api/v1/x402/search"),
    probe(BYOS_API_BASE, "/api/v1/capi/discover"),
    probe(BYOS_API_BASE, "/api/v1/capi/state"),
  ]);

  const probes = [discoveryApp, x402Discovery, pglRegistry, x402Search, capiDiscover, capiState];
  const hardFailures = probes.filter((item) => item.state === "error").length;
  const gatedRoutes = probes.filter((item) => item.state === "needs_auth" || item.state === "needs_payment").length;

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: {
      discovery_app: trimSlash(DISCOVERY_APP_BASE),
      byos: trimSlash(BYOS_API_BASE),
    },
    proof: {
      state: hardFailures > 0 ? "error" : gatedRoutes > 0 ? "partial" : "verified",
      reason:
        hardFailures > 0
          ? "One or more Veklom Discovery sources failed."
          : gatedRoutes > 0
            ? "Discovery shell, x402 manifest, and PGL registry are live; paid/search and cAPI routes are correctly gated."
            : "Discovery shell, x402 manifest, PGL registry, x402 search, and cAPI discovery returned live data.",
      probes,
    },
    registryRows: pglRegistry.count ?? null,
    paidSearch: x402Search.payment ?? null,
  });
}
