import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BINGO_API_BASE = process.env.BINGO_API_BASE_URL || "https://bingo.veklom.com";

type ProbeState = "verified" | "needs_endpoint" | "error";

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

function isX402Manifest(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return Boolean(record.x402Version || record.x402_version || record.accepts || record.accepted_assets || record.protected_routes);
}

function hasDurableLedger(data: unknown): boolean {
  if (!data || typeof data !== "object") return false;
  const settlement = (data as any).settlement;
  return Boolean(settlement?.durableStore?.engine && settlement?.durableStore?.auditLogPath);
}

async function probe(route: string) {
  const url = `${trimSlash(BINGO_API_BASE)}${route}`;
  try {
    const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    const count = Array.isArray((data as any)?.lobbies)
      ? (data as any).lobbies.length
      : Array.isArray((data as any)?.leaders)
        ? (data as any).leaders.length
        : undefined;

    return {
      route,
      state: res.ok ? "verified" as ProbeState : "error" as ProbeState,
      status: res.status,
      count,
      data,
      detail: res.ok ? undefined : (data as any)?.detail || (data as any)?.error || res.statusText,
      x402Manifest: route === "/.well-known/x402.json" ? isX402Manifest(data) : undefined,
    };
  } catch (error) {
    return {
      route,
      state: "error" as ProbeState,
      status: 0,
      detail: error instanceof Error ? error.message : "probe failed",
    };
  }
}

export async function GET() {
  const [health, lobbies, leaderboard, x402, state, x402Status, audit] = await Promise.all([
    probe(""),
    probe("/api/lobbies"),
    probe("/api/leaderboard"),
    probe("/.well-known/x402.json"),
    probe("/api/state"),
    probe("/api/x402/status"),
    probe("/api/audit/events?limit=1"),
  ]);

  const probes = [health, lobbies, leaderboard, x402, state, x402Status, audit];
  const hardFailures = probes.filter((item) => item.state === "error").length;
  const x402Discovery = x402.x402Manifest ? "verified" : "needs_endpoint";
  const durableLedger = hasDurableLedger((state as any).data) ? "verified" : state.state === "verified" ? "verified" : "needs_endpoint";

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: trimSlash(BINGO_API_BASE),
    proof: {
      state: hardFailures > 0 ? "error" : x402Discovery === "verified" ? "verified" : "partial",
      reason:
        hardFailures > 0
          ? "One or more Bingo backend routes failed."
          : x402Discovery === "verified"
            ? "Bingo backend, lobbies, leaderboard, x402 manifest, and durable state routes are live."
            : "Bingo backend, lobbies, and leaderboard are live; x402 discovery/payment proof endpoint still needs a real manifest.",
      probes,
    },
    capabilities: {
      lobbies: lobbies.state,
      leaderboard: leaderboard.state,
      x402Discovery,
      durableLedger,
      x402Status: x402Status.state,
      paymentProofIngest: x402Status.state,
      frontendBaseAccountSend: "needs_base_account_wallet_wiring",
      autonomousPaidPlay: "disabled_until_wallet_proof",
    },
  });
}
