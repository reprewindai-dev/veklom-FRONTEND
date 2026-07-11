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

function walletFromRequest(request: Request): string {
  const url = new URL(request.url);
  const wallet = url.searchParams.get("wallet") || "0x3a74772e925b54f7dad7fd95c9ba30825033f970";
  return /^0x[a-fA-F0-9]{40}$/.test(wallet) ? wallet.toLowerCase() : "0x3a74772e925b54f7dad7fd95c9ba30825033f970";
}

export async function GET(request: Request) {
  const walletAddress = walletFromRequest(request);
  const [proofProbe, settlementProbe, leaderboardProbe, historyProbe, lobbiesProbe, wagerProbe, outcomeProbe, x402Probe, covenantProbe] = await Promise.all([
    probeJson(BYOS_API_BASE, "/api/v1/duel/proof"),
    probeJson(BYOS_API_BASE, "/api/v1/duel/settlement/summary"),
    probeJson(BYOS_API_BASE, "/api/v1/duel/leaderboard"),
    probeJson(BYOS_API_BASE, `/api/v1/duel/player/${walletAddress}/history`),
    probeJson(BYOS_API_BASE, "/api/v1/duel/lobbies?status=open"),
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

  const proofCapabilities = proofProbe.state === "verified" ? proofProbe.data?.capabilities || {} : {};
  const settlementProofs = settlementProbe.state === "verified" ? settlementProbe.data?.proofs || {} : {};
  const probeResults: ProbeResult[] = [
    proofProbe,
    settlementProbe,
    leaderboardProbe,
    historyProbe,
    {
      route: "/api/v1/duel/session/create",
      state: proofCapabilities.session_create === "verified" ? "verified" : proofProbe.state === "verified" ? "needs_proof" : proofProbe.state,
      status: proofProbe.status,
      detail: proofCapabilities.session_auth === "siwe" ? "SIWE wallet signature required before session token issue" : proofCapabilities.session_create === "verified" ? "Postgres-backed session endpoint present" : "Session persistence not proven",
    },
    {
      route: "/api/v1/duel/lobbies",
      state: proofCapabilities.multiplayer_lobbies === "verified" ? "verified" : lobbiesProbe.state,
      status: lobbiesProbe.status,
      detail: proofCapabilities.multiplayer_lobbies === "verified" ? "BYOS multiplayer lobby discovery is route-backed" : lobbiesProbe.detail,
    },
    {
      route: "/api/v1/duel/wager",
      state: proofCapabilities.wager_persist === "verified" ? "verified" : wagerProbe.state,
      status: wagerProbe.status,
      detail: proofCapabilities.wager_persist === "verified" ? "Legacy signed wager persistence endpoint present" : wagerProbe.detail,
    },
    {
      route: "/api/v1/duel/wager/prepare",
      state: proofCapabilities.wager_prepare === "verified" ? "verified" : "needs_proof",
      status: proofProbe.status,
      detail: proofCapabilities.wager_prepare === "verified" ? "BYOS prepares idempotent Base Account payment jobs" : "BYOS has not proven idempotent wager preparation",
    },
    {
      route: "/api/v1/duel/outcome",
      state: proofCapabilities.outcome_persist === "verified" ? "verified" : outcomeProbe.state,
      status: outcomeProbe.status,
      detail: proofCapabilities.outcome_persist === "verified" ? "Outcome persistence endpoint present" : outcomeProbe.detail,
    },
    {
      route: "agent_duel_wagers.settlement_tx_hash",
      state: proofCapabilities.settlement === "verified" || settlementProofs.settlement_history === "verified" ? "verified" : "needs_proof",
      status: proofProbe.status,
      detail: proofCapabilities.settlement === "verified" || settlementProofs.settlement_history === "verified" ? "At least one wager has verified Base receipt proof" : "No on-chain settlement tx hash has been recorded yet",
    },
    {
      route: "/api/v1/duel/wagers/{wager_id}/settlement-proof",
      state: proofCapabilities.settlement_proof_ingest === "verified" ? "verified" : "needs_proof",
      status: proofProbe.status,
      detail: proofCapabilities.settlement_proof_ingest === "verified" ? "BYOS verifies Base receipts before accepting settlement proof" : "Settlement proof ingest has not been proven",
    },
    {
      route: "/api/v1/duel/settlement/summary.base_block",
      state: settlementProofs.base_block_height === "verified" ? "verified" : settlementProbe.state === "verified" ? "needs_proof" : settlementProbe.state,
      status: settlementProbe.status,
      detail: settlementProofs.base_block_height === "verified" ? "Base block height returned by Base RPC through BYOS" : "BYOS did not return Base block height proof",
    },
    {
      route: "/api/v1/duel/settlement/summary.pool_liquidity",
      state: settlementProofs.pool_liquidity === "verified" ? "verified" : settlementProbe.state === "verified" ? "needs_proof" : settlementProbe.state,
      status: settlementProbe.status,
      detail: settlementProofs.pool_liquidity === "verified" ? "Treasury USDC balance returned by Base RPC balanceOf" : "BYOS did not return pool liquidity proof",
    },
    {
      route: "/api/v1/duel/settlement/summary.gas_telemetry",
      state: settlementProofs.gas_telemetry === "verified" ? "verified" : settlementProbe.state === "verified" ? "needs_proof" : settlementProbe.state,
      status: settlementProbe.status,
      detail: settlementProofs.gas_telemetry === "verified" ? "Latest wager receipt includes gas telemetry" : "No verified settlement receipt with gas telemetry has been persisted",
    },
    x402Probe,
    covenantProbe,
  ];
  const probes = probeResults.map(({ data, ...probe }) => probe);
  const endpointGaps = probes.filter((probe) => probe.state === "needs_endpoint").length;
  const proofGaps = probes.filter((probe) => probe.state === "needs_proof").length;
  const hardFailures = probes.filter((probe) => probe.state === "error").length;
  const leaderboard = leaderboardProbe.state === "verified" && Array.isArray(leaderboardProbe.data?.leaderboard)
    ? leaderboardProbe.data.leaderboard
    : [];
  const history = historyProbe.state === "verified" && Array.isArray(historyProbe.data?.wagers)
    ? historyProbe.data.wagers
    : [];
  const persistenceVerified =
    proofCapabilities.session_create === "verified" &&
    proofCapabilities.wager_persist === "verified" &&
    proofCapabilities.outcome_persist === "verified";

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: {
      byos: trimSlash(BYOS_API_BASE),
      covenant: trimSlash(CAPI_RUNTIME_URL),
    },
    wallet: walletAddress,
    proof: {
      state: hardFailures > 0 ? "error" : endpointGaps > 0 || proofGaps > 0 ? "partial" : "verified",
      reason:
        hardFailures > 0
          ? "One or more Agent Duel sources failed."
          : endpointGaps > 0
            ? "BYOS exposes duel read routes, but wager/session/outcome write endpoints need production implementation."
            : persistenceVerified
              ? "Agent Duel sessions, wager preparation, and outcome persistence are route-backed; frontend Base Account sends and settlement receipt proof stay separately marked until a real tx hash is recorded."
              : proofGaps > 0
                ? "Agent Duel routes require authenticated proof before live gameplay can be enabled."
                : "All Agent Duel sources returned live route-backed data.",
      probes,
    },
    capabilities: {
      readLeaderboard: leaderboardProbe.state,
      readHistory: historyProbe.state,
      createSession: proofCapabilities.session_create === "verified" ? "verified" : proofProbe.state,
      sessionAuth: proofCapabilities.session_auth === "siwe" ? "siwe" : "needs_proof",
      multiplayerLobby: proofCapabilities.multiplayer_lobbies === "verified" ? "verified" : lobbiesProbe.state,
      placeWager: proofCapabilities.wager_persist === "verified" ? "verified" : wagerProbe.state,
      wagerPrepare: proofCapabilities.wager_prepare === "verified" ? "verified" : "needs_proof",
      frontendBaseAccountSend: proofCapabilities.frontend_base_account_send === "verified" ? "verified" : "needs_proof",
      settleOutcome: proofCapabilities.outcome_persist === "verified" ? "verified" : outcomeProbe.state,
      settlementProofIngest: proofCapabilities.settlement_proof_ingest === "verified" ? "verified" : "needs_proof",
      settlement: proofCapabilities.settlement === "verified" || settlementProofs.settlement_history === "verified" ? "verified" : "needs_proof",
      settlementSummary: settlementProbe.state,
      baseBlockHeight: settlementProofs.base_block_height === "verified" ? "verified" : "needs_proof",
      poolLiquidity: settlementProofs.pool_liquidity === "verified" ? "verified" : "needs_proof",
      gasTelemetry: settlementProofs.gas_telemetry === "verified" ? "verified" : "needs_proof",
      callData: settlementProofs.call_data === "verified" ? "verified" : "needs_proof",
      x402Discovery: x402Probe.state,
      covenantState: covenantProbe.state,
    },
    liveGameplayEnabled: persistenceVerified,
    leaderboard,
    history,
    settlementSummary: settlementProbe.state === "verified" ? settlementProbe.data : proofProbe.data?.settlement_summary || null,
    proofSource: proofProbe.state === "verified" ? proofProbe.data : null,
  });
}
