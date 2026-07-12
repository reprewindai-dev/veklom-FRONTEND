import { NextResponse } from "next/server";
import { CAPI_RUNTIME_URL } from "@/lib/capi-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BYOS_API_BASE =
  process.env.BYOS_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.veklom.com";

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

function routeUrl(base: string, route: string): string {
  return `${trimSlash(base)}${route}`;
}

async function probeJson(base: string, route: string): Promise<ProbeResult> {
  const url = routeUrl(base, route);
  try {
    const res = await fetch(url, {
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

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function gradeForScore(score: number): string {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "Needs Proof";
}

function p95HealthScore(provider: any): number {
  const target = asNumber(provider?.targetP95Ms);
  const observed = asNumber(provider?.observedP95Ms);
  if (!target || !observed) return 0;
  const excess = Math.max(0, observed - target);
  return clampScore(100 - (excess / Math.max(target, 1)) * 100);
}

function bondHealthScore(provider: any): number {
  const bond = asNumber(provider?.bondAmountUsdc);
  const slashed = asNumber(provider?.slashedTotalUsdc);
  if (!bond) return 0;
  return clampScore(100 - (slashed / bond) * 100);
}

function normalizeCards(metrics: any, staking: any, cappo: any) {
  const apis = Array.isArray(metrics?.apis) ? metrics.apis : [];
  const providers = Array.isArray(staking?.providers) ? staking.providers : [];
  const authorizedRate = asNumber(cappo?.metrics?.authorized_rate);
  const physicalProbes = asNumber(metrics?.total_physical_probes_recorded);

  return apis.map((api: any) => {
    const provider = providers.find((item: any) => item?.apiId === api?.id || item?.name === api?.name) || {};
    const composite = clampScore(asNumber(api?.compositeScore));
    const p95Score = p95HealthScore(provider);
    const bondScore = bondHealthScore(provider);
    const cappoScore = clampScore(authorizedRate);
    const probeScore = clampScore(Math.min(100, physicalProbes / 250));

    return {
      id: String(api?.id || provider?.apiId || api?.name),
      name: String(api?.name || provider?.name || "Unnamed API"),
      provider: String(api?.provider || provider?.provider || "Veklom"),
      score: composite,
      grade: gradeForScore(composite),
      status: String(api?.status || provider?.status || "needs_proof"),
      lastUpdated: String(metrics?.timestamp || new Date().toISOString()),
      anchorHash: metrics?.trustBeaconMerkle || "",
      ipfsHash: "",
      txHash: metrics?.blockAnchorTx || "",
      measurementCount: physicalProbes,
      targetP95Ms: provider?.targetP95Ms ?? null,
      observedP95Ms: provider?.observedP95Ms ?? null,
      bondAmountUsdc: provider?.bondAmountUsdc ?? null,
      slashedTotalUsdc: provider?.slashedTotalUsdc ?? null,
      consensus: provider?.consensus || null,
      dimensions: [
        {
          name: "BYOS composite",
          score: composite,
          weight: 30,
          desc: "Route-backed VNP compositeScore from /api/v1/vnp/metrics",
        },
        {
          name: "P95 SLA",
          score: p95Score,
          weight: 25,
          desc: provider?.observedP95Ms
            ? `Observed ${provider.observedP95Ms}ms vs target ${provider.targetP95Ms}ms`
            : "No staking P95 signal returned",
        },
        {
          name: "Bond health",
          score: bondScore,
          weight: 20,
          desc: provider?.bondAmountUsdc
            ? `Bond $${Math.round(asNumber(provider.bondAmountUsdc)).toLocaleString()} / slashed $${Math.round(asNumber(provider.slashedTotalUsdc)).toLocaleString()}`
            : "No provider bond returned",
        },
        {
          name: "CAPPO auth",
          score: cappoScore,
          weight: 15,
          desc: `cAPI authorized rate ${authorizedRate || 0}%`,
        },
        {
          name: "Probe volume",
          score: probeScore,
          weight: 10,
          desc: `${physicalProbes.toLocaleString()} physical probes recorded`,
        },
      ],
    };
  });
}

function normalizeNodes(staking: any, metrics: any) {
  const providers = Array.isArray(staking?.providers) ? staking.providers : [];
  return providers.map((provider: any, index: number) => ({
    id: String(provider?.apiId || `provider-${index}`),
    name: String(provider?.name || `Provider ${index + 1}`),
    region: "BYOS",
    latency: asNumber(provider?.observedP95Ms),
    throughput: asNumber(provider?.bondAmountUsdc),
    status: provider?.status === "healthy" ? "attesting" : "warning",
    activeCycles: asNumber(metrics?.total_physical_probes_recorded),
  }));
}

export async function GET() {
  const [metricsProbe, stakingProbe, leaderboardProbe, x402Probe, cappoProbe] = await Promise.all([
    probeJson(BYOS_API_BASE, "/api/v1/vnp/metrics"),
    probeJson(BYOS_API_BASE, "/api/v1/x402/staking/state"),
    probeJson(BYOS_API_BASE, "/api/v1/benchmarks/leaderboard"),
    probeJson(BYOS_API_BASE, "/.well-known/x402.json"),
    probeJson(CAPI_RUNTIME_URL, "/api/state"),
  ]);

  const metrics = metricsProbe.state === "verified" ? metricsProbe.data : null;
  const staking = stakingProbe.state === "verified" ? stakingProbe.data : null;
  const cappo = cappoProbe.state === "verified" ? cappoProbe.data : null;
  const cards = normalizeCards(metrics, staking, cappo);
  const nodes = normalizeNodes(staking, metrics);
  const probes = [metricsProbe, stakingProbe, leaderboardProbe, x402Probe, cappoProbe].map(({ data, ...probe }) => probe);
  const hardFailures = probes.filter((probe) => probe.state === "error").length;
  const proofGaps = probes.filter((probe) => probe.state === "needs_proof").length;

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    sources: {
      byos: trimSlash(BYOS_API_BASE),
      capi: trimSlash(CAPI_RUNTIME_URL),
    },
    proof: {
      state: hardFailures > 0 ? "error" : proofGaps > 0 ? "partial" : "verified",
      reason:
        proofGaps > 0
          ? "Some Nexus routes require payment or authorization proof before full data can be displayed."
          : hardFailures > 0
            ? "One or more Nexus sources failed to return a usable response."
            : "All Nexus sources returned live route-backed data.",
      probes,
    },
    metrics,
    staking,
    leaderboard: leaderboardProbe.state === "verified" ? leaderboardProbe.data : null,
    leaderboard_state: leaderboardProbe.state,
    x402: x402Probe.state === "verified" ? x402Probe.data : null,
    cappo,
    cards,
    nodes,
    anchoring: {
      merkle: metrics?.trustBeaconMerkle || null,
      merkle_status: metrics?.trustBeaconStatus || "Needs proof",
      block_anchored: metrics?.blockAnchored || 0,
      block_status: metrics?.blockAnchoredStatus || "Needs proof",
    },
  });
}
