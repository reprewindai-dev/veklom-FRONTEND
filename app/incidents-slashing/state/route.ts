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

interface ExposureRow {
  id: string;
  target: string;
  provider: string;
  status: string;
  severity: "slashed" | "breach_risk" | "warning" | "healthy";
  targetP95Ms: number | null;
  observedP95Ms: number | null;
  deviationMs: number | null;
  toleranceMs: number | null;
  pendingPenaltyUsdc: number;
  slashedTotalUsdc: number;
  bondAmountUsdc: number | null;
  consensus: any;
  evidenceState: "verified" | "needs_settlement_proof";
  detail: string;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
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

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeExposure(stakingState: any): ExposureRow[] {
  const providers = Array.isArray(stakingState?.providers) ? stakingState.providers : [];
  return providers.map((provider: any) => {
    const penalty = asNumber(provider?.deviation?.penaltyUsdc);
    const slashed = asNumber(provider?.slashedTotalUsdc);
    const status = String(provider?.status || "needs_proof");
    return {
      id: String(provider?.apiId || provider?.name),
      target: String(provider?.name || "Unknown provider"),
      provider: String(provider?.provider || "Veklom Nexus"),
      status,
      severity: slashed > 0 ? "slashed" : status === "critical" ? "breach_risk" : status === "warning" ? "warning" : "healthy",
      targetP95Ms: provider?.targetP95Ms ?? null,
      observedP95Ms: provider?.observedP95Ms ?? null,
      deviationMs: provider?.deviation?.deviationMs ?? provider?.deviation?.excessMs ?? null,
      toleranceMs: provider?.deviation?.toleranceMs ?? null,
      pendingPenaltyUsdc: penalty,
      slashedTotalUsdc: slashed,
      bondAmountUsdc: provider?.bondAmountUsdc ?? null,
      consensus: provider?.consensus || null,
      evidenceState: slashed > 0 ? "verified" : penalty > 0 ? "needs_settlement_proof" : "verified",
      detail: penalty > 0
        ? `BYOS reports ${provider?.deviation?.excessMs ?? provider?.deviation?.deviationMs ?? "unknown"}ms excess and $${Math.round(penalty).toLocaleString()} penalty exposure. No slash settlement row was returned.`
        : "No penalty exposure returned by BYOS staking state.",
    };
  });
}

export async function GET() {
  const [stakingProbe, alertsProbe, incidentsProbe, auditProbe, metricsProbe] = await Promise.all([
    probeJson("/api/v1/x402/staking/state"),
    probeJson("/api/v1/vnp/alerts/triggered"),
    probeJson("/api/v1/incidents/"),
    probeJson("/api/v1/vnp/audit-logs"),
    probeJson("/api/v1/vnp/metrics"),
  ]);

  const staking = stakingProbe.state === "verified" ? stakingProbe.data : null;
  const exposure = normalizeExposure(staking);
  const alerts = alertsProbe.state === "verified" && Array.isArray(alertsProbe.data) ? alertsProbe.data : [];
  const incidents = incidentsProbe.state === "verified" && Array.isArray(incidentsProbe.data) ? incidentsProbe.data : [];
  const auditLogs = auditProbe.state === "verified" && Array.isArray(auditProbe.data) ? auditProbe.data : [];
  const metrics = metricsProbe.state === "verified" ? metricsProbe.data : null;
  const probes = [stakingProbe, alertsProbe, incidentsProbe, auditProbe, metricsProbe].map(({ data, ...probe }) => probe);
  const hardFailures = probes.filter((probe) => probe.state === "error").length;
  const proofGaps = probes.filter((probe) => probe.state === "needs_proof").length;
  const slashedTotalUsdc = exposure.reduce((sum: number, row: ExposureRow) => sum + asNumber(row.slashedTotalUsdc), 0);
  const pendingPenaltyUsdc = exposure.reduce((sum: number, row: ExposureRow) => sum + asNumber(row.pendingPenaltyUsdc), 0);

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: trimSlash(BYOS_API_BASE),
    proof: {
      state: hardFailures > 0 ? "error" : proofGaps > 0 ? "partial" : "verified",
      reason:
        proofGaps > 0
          ? "Some incident routes require authentication proof; public staking and alert routes are still shown."
          : hardFailures > 0
            ? "One or more incident sources failed."
            : "All incident sources returned live route-backed data.",
      probes,
    },
    protocolStats: staking?.protocolStats || null,
    metrics,
    exposure,
    alerts,
    incidents,
    auditLogs,
    totals: {
      totalValueBonded: staking?.protocolStats?.totalValueBonded ?? null,
      activeApis: staking?.protocolStats?.activeApis ?? metrics?.active_apis ?? null,
      activeVerifiers: staking?.protocolStats?.activeVerifiers ?? metrics?.active_validators ?? null,
      totalPenalties: staking?.protocolStats?.totalPenalties ?? null,
      slashedTotalUsdc,
      pendingPenaltyUsdc,
      criticalProviders: exposure.filter((row) => row.severity === "breach_risk").length,
      triggeredAlerts: alerts.length,
      incidentRows: incidents.length,
      auditRows: auditLogs.length,
    },
  });
}
