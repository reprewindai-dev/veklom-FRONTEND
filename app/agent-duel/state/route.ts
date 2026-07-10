import { NextResponse } from "next/server";
import { CAPI_RUNTIME_URL } from "@/lib/capi-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BYOS_API_BASE = process.env.BYOS_API_BASE_URL || "https://api.veklom.com";

type ProbeState = "verified" | "needs_proof" | "needs_endpoint" | "error";

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

async function probeJson(base: string, route: string, init?: RequestInit): Promise<ProbeResult> {
  try {
    const res = await fetch(`${trimSlash(base)}${route}`, {
      headers: { Accept: "application/json", ...(init?.headers || {}) },
      cache: "no-store",
      ...init,
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      return {
        route,
        state: res.status === 404 ? "needs_endpoint" : res.status === 401 || res.status === 402 || res.status === 403 ? "needs_proof" : "error",
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

export async function GET() {
  const [leaderboardProbe, historyProbe, sessionProbe, wagerProbe, outcomeProbe, x402Probe, covenantProbe] = await Promise.all([
    probeJson(BYOS_API_BASE, "/api/v1/duel/leaderboard"),
    probeJson(BYOS_API_BASE, "/api/v1/duel/player/0x3a74772e925b54f7dad7fd95c9ba30825033f970/history"),
    probeJson(BYOS_API_BASE, "/api/v1/duel/session/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet_address: "0x3a74772e925b54f7dad7fd95c9ba30825033f970" }),
    }),
    probeJson(BYOS_API_BASE, "/api/v1/duel/wager", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
    probeJson(BYOS_API_BASE, "/api/v1/duel/outcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }),
    probeJson(BYOS_API_BASE, "/.well-known/x402.json"),
    probeJson(CAPI_RUNTIME_URL, "/api/state"),
  ]);

  const probes = [leaderboardProbe, historyProbe, sessionProbe, wagerProbe, outcomeProbe, x402Probe, covenantProbe].map(({ data, ...probe }) => probe);
  const endpointGaps = probes.filter((probe) => probe.state === "needs_endpoint").length;
  const proofGaps = probes.filter((probe) => probe.state === "needs_proof").length;
  const hardFailures = probes.filter((probe) => probe.state === "error").length;
  const leaderboard = leaderboardProbe.state === "verified" && Array.isArray(leaderboardProbe.data?.leaderboard)
    ? leaderboardProbe.data.leaderboard
    : [];
  const history = historyProbe.state === "verified" && Array.isArray(historyProbe.data?.wagers)
    ? historyProbe.data.wagers
    : [];

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: {
      byos: trimSlash(BYOS_API_BASE),
      covenant: trimSlash(CAPI_RUNTIME_URL),
    },
    proof: {
      state: hardFailures > 0 ? "error" : endpointGaps > 0 || proofGaps > 0 ? "partial" : "verified",
      reason:
        hardFailures > 0
          ? "One or more Agent Duel sources failed."
          : endpointGaps > 0
            ? "BYOS exposes duel read routes, but wager/session/outcome write endpoints need production implementation."
            : proofGaps > 0
              ? "Agent Duel routes require authenticated proof before live gameplay can be enabled."
              : "All Agent Duel sources returned live route-backed data.",
      probes,
    },
    capabilities: {
      readLeaderboard: leaderboardProbe.state,
      readHistory: historyProbe.state,
      createSession: sessionProbe.state,
      placeWager: wagerProbe.state,
      settleOutcome: outcomeProbe.state,
      x402Discovery: x402Probe.state,
      covenantState: covenantProbe.state,
    },
    liveGameplayEnabled:
      sessionProbe.state === "verified" &&
      wagerProbe.state === "verified" &&
      outcomeProbe.state === "verified",
    leaderboard,
    history,
  });
}
