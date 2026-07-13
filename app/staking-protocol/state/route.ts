import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VNP_API_BASE = process.env.VNP_API_BASE_URL || "https://vnp.veklom.com";

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

async function probeJson(route: string): Promise<ProbeResult> {
  try {
    const res = await fetch(`${trimSlash(VNP_API_BASE)}${route}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      return {
        route,
        state: "error",
        status: res.status,
        detail: res.statusText,
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

export async function GET() {
  const [bondsProbe, scoresProbe] = await Promise.all([
    probeJson("/api/v1/staking/bonds"),
    probeJson("/api/v1/nexus/scores"),
  ]);

  const verifiedBonds = bondsProbe.state === "verified" ? bondsProbe.data : [];
  const verifiedScores = scoresProbe.state === "verified" ? scoresProbe.data : [];

  const scoresByApiId = Array.isArray(verifiedScores)
    ? new Map(verifiedScores.map((score: any) => [String(score?.api_id || score?.apiId || score?.id || ""), score]))
    : new Map<string, any>();
  
  const formattedProviders = Array.isArray(verifiedBonds) ? verifiedBonds.map((b: any) => ({
    id: b.id,
    targetApiId: b.target_api_id,
    amountMinor: b.amount_minor,
    currency: b.currency,
    state: b.state,
    statusLevel: b.state === "active" ? "healthy" : "warning",
    latencyAvg: scoresByApiId.get(String(b.target_api_id))?.observed_p95_ms ?? null,
    successRate: scoresByApiId.get(String(b.target_api_id))?.success_rate ?? null,
    activeAlerts: scoresByApiId.get(String(b.target_api_id))?.active_alerts ?? 0
  })) : [];

  const totalStakedUsd = formattedProviders.reduce((total: number, provider: any) => {
    const amount = Number(provider.amountMinor);
    return Number.isFinite(amount) ? total + amount / 100 : total;
  }, 0);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: trimSlash(VNP_API_BASE),
    proof: {
      state: bondsProbe.state === "error" ? "error" : formattedProviders.length > 0 ? "verified" : "needs_proof",
      reason: bondsProbe.state === "error"
        ? "VNP staking backend is unreachable."
        : formattedProviders.length > 0
          ? "VNP bonds returned live route-backed records."
          : "VNP staking routes are reachable but returned no live bond records.",
      probes: [
        { route: "/api/v1/staking/bonds", state: bondsProbe.state, status: bondsProbe.status },
        { route: "/api/v1/nexus/scores", state: scoresProbe.state, status: scoresProbe.status }
      ]
    },
    staking: {
      providers: formattedProviders,
      protocolStats: { activeBonds: formattedProviders.length, totalStakedUsd },
      settlements: [],
      verifiers: [],
      kdeCurves: {},
      vnpParams: { k: 2, lambda: 1.5, challengeTierA: 50, challengeTierB: 100, consensusWeights: [] }
    },
    markets: [],
    marketProof: {
      state: "needs_proof",
      reason: "No route-backed staking market data returned; synthetic markets are disabled.",
    },
    writeActions: {
      verifierRegistration: { route: "/api/v1/staking/verifiers", state: "needs_auth" },
      stakePlacement: { route: "/api/v1/staking/bonds", state: "needs_auth" },
    }
  });
}
