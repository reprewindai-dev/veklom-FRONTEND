import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VNP_API_BASE =
  process.env.VNP_API_BASE_URL ||
  process.env.BYOS_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://vnp.veklom.com";

const CAPPO_API_BASE =
  process.env.CAPPO_API_BASE_URL ||
  process.env.CAPPO_BACKEND_URL ||
  "https://cappo.veklom.com";

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

async function probeJson(base: string, route: string): Promise<ProbeResult> {
  try {
    const res = await fetch(`${trimSlash(base)}${route}`, {
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
    probeJson(CAPPO_API_BASE, "/api/v1/x402/staking/state"),
    probeJson(VNP_API_BASE, "/api/v1/nexus/scores"),
  ]);

  const verifiedBonds = bondsProbe.state === "verified" ? bondsProbe.data?.providers : [];
  const scoresData = scoresProbe.state === "verified" ? scoresProbe.data : null;
  const verifiedScores = Array.isArray(scoresData)
    ? scoresData
    : Array.isArray(scoresData?.apis)
      ? scoresData.apis
      : [];

  const scoresByApiId = Array.isArray(verifiedScores)
    ? new Map(verifiedScores.map((score: any) => [String(score?.api_id || score?.apiId || score?.id || ""), score]))
    : new Map<string, any>();
  
  const formattedProviders = Array.isArray(verifiedBonds) ? verifiedBonds.map((b: any) => ({
    id: b.apiId,
    targetApiId: b.apiId,
    amountMinor: Math.round(Number(b.bondAmountUsdc || 0) * 100),
    currency: "USDC",
    state: b.status,
    statusLevel: b.status === "healthy" ? "healthy" : "warning",
    latencyAvg: b.observedP95Ms ?? null,
    successRate: scoresByApiId.get(String(b.apiId))?.availability ?? null,
    activeAlerts: b.status === "healthy" ? 0 : 1
  })) : [];

  const totalStakedUsd = formattedProviders.reduce((total: number, provider: any) => {
    const amount = Number(provider.amountMinor);
    return Number.isFinite(amount) ? total + amount / 100 : total;
  }, 0);
  const proofState =
    bondsProbe.state === "error"
      ? "error"
      : formattedProviders.length > 0
        ? "verified"
        : "needs_proof";

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: trimSlash(VNP_API_BASE),
    sources: {
      vnp: trimSlash(VNP_API_BASE),
      cappo: trimSlash(CAPPO_API_BASE),
    },
    proof: {
      state: proofState,
      reason: bondsProbe.state === "error"
        ? "CAPPO staking backend is unreachable."
        : formattedProviders.length > 0
          ? "CAPPO staking returned live route-backed records."
          : bondsProbe.state === "needs_proof"
            ? "CAPPO staking route is reachable but requires authorization proof."
            : "CAPPO staking route returned no live bond records.",
      probes: [
        { route: "/api/v1/x402/staking/state", state: bondsProbe.state, status: bondsProbe.status },
        { route: "/api/v1/nexus/scores", state: scoresProbe.state, status: scoresProbe.status }
      ]
    },
    staking: {
      providers: formattedProviders,
      protocolStats: bondsProbe.state === "verified" ? bondsProbe.data?.protocolStats || { activeBonds: formattedProviders.length, totalStakedUsd } : { activeBonds: formattedProviders.length, totalStakedUsd },
      settlements: bondsProbe.state === "verified" ? bondsProbe.data?.settlements || [] : [],
      verifiers: bondsProbe.state === "verified" ? bondsProbe.data?.verifiers || [] : [],
      kdeCurves: bondsProbe.state === "verified" ? bondsProbe.data?.kdeCurves || {} : {},
      vnpParams: bondsProbe.state === "verified" ? bondsProbe.data?.vnpParams || {} : {}
    },
    markets: [],
    marketProof: {
      state: "needs_proof",
      reason: "No route-backed staking market data returned; synthetic markets are disabled.",
    },
    writeActions: {
      verifierRegistration: { route: "/api/v1/x402/staking/state", state: "read_only" },
      stakePlacement: { route: "/api/v1/x402/staking/state", state: "read_only" },
    }
  });
}
