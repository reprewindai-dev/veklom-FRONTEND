import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BYOS_API_BASE = process.env.BYOS_API_BASE_URL || "https://api.veklom.com";

type ProbeState = "verified" | "needs_proof" | "error";

interface ProbeResult {
  route: string;
  state: ProbeState;
  status: number;
  detail?: string;
  data?: any;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function safeJson(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeError(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data.slice(0, 240);
  return String(data.detail || data.message || data.error || data.reason || "").slice(0, 240) || undefined;
}

async function probeJson(route: string): Promise<ProbeResult> {
  try {
    const res = await fetch(`${trimSlash(BYOS_API_BASE)}${route}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      return {
        route,
        state: res.status === 401 || res.status === 402 || res.status === 403 ? "needs_proof" : "error",
        status: res.status,
        detail: normalizeError(data) || res.statusText,
        data,
      };
    }
    return { route, state: "verified", status: res.status, data };
  } catch (error) {
    return {
      route,
      state: "error",
      status: 0,
      detail: error instanceof Error ? error.message : "probe failed",
    };
  }
}

function isStaticX402MarketFixture(markets: any): boolean {
  return (
    Array.isArray(markets) &&
    markets.length === 1 &&
    markets[0]?.id === "mkt-1" &&
    String(markets[0]?.title || "").includes("OpenAI GPT-4o")
  );
}

export async function GET() {
  const [stakingProbe, x402MarketsProbe, authMarketsProbe, x402DocProbe] = await Promise.all([
    probeJson("/api/v1/x402/staking/state"),
    probeJson("/api/v1/x402/staking/markets"),
    probeJson("/api/v1/benchmarks/staking/markets"),
    probeJson("/.well-known/x402.json"),
  ]);

  const staking = stakingProbe.state === "verified" ? stakingProbe.data : null;
  const verifiedMarkets = authMarketsProbe.state === "verified" && Array.isArray(authMarketsProbe.data)
    ? authMarketsProbe.data
    : [];
  const x402MarketsAreFixture = isStaticX402MarketFixture(x402MarketsProbe.data);
  const marketProof =
    verifiedMarkets.length > 0
      ? { state: "verified", reason: "Authenticated benchmark staking markets returned live records." }
      : x402MarketsAreFixture
        ? { state: "needs_proof", reason: "Public x402 markets route returns a static fixture in BYOS; trading is disabled until authenticated markets return live records." }
        : { state: x402MarketsProbe.state, reason: x402MarketsProbe.detail || "No verified live staking markets returned." };

  const probes = [stakingProbe, x402MarketsProbe, authMarketsProbe, x402DocProbe].map(({ data, ...probe }) => probe);
  const hardFailures = probes.filter((probe) => probe.state === "error").length;
  const proofGaps = probes.filter((probe) => probe.state === "needs_proof").length + (marketProof.state === "needs_proof" ? 1 : 0);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: trimSlash(BYOS_API_BASE),
    proof: {
      state: hardFailures > 0 ? "error" : proofGaps > 0 ? "partial" : "verified",
      reason:
        hardFailures > 0
          ? "One or more staking sources failed."
          : proofGaps > 0
            ? "Read-state is live, but staking markets or write actions still need authenticated settlement proof."
            : "All staking sources returned live route-backed data.",
      probes,
    },
    staking,
    markets: verifiedMarkets,
    marketProof,
    writeActions: {
      verifierRegistration: {
        route: "/api/v1/benchmarks/staking/register-verifier",
        state: authMarketsProbe.state === "verified" ? "available_with_auth" : "needs_auth_proof",
      },
      stakePlacement: {
        route: "/api/v1/benchmarks/staking/stake",
        state: verifiedMarkets.length > 0 ? "available_with_auth" : "disabled_no_verified_market",
      },
    },
    x402: x402DocProbe.state === "verified" ? x402DocProbe.data : null,
  });
}
