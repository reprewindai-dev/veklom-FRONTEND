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
  const [health, lobbies, leaderboard, x402] = await Promise.all([
    probe(""),
    probe("/api/lobbies"),
    probe("/api/leaderboard"),
    probe("/.well-known/x402.json"),
  ]);

  const probes = [health, lobbies, leaderboard, x402];
  const hardFailures = probes.filter((item) => item.state === "error").length;
  const x402Discovery = x402.x402Manifest ? "verified" : "needs_endpoint";

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: trimSlash(BINGO_API_BASE),
    proof: {
      state: hardFailures > 0 ? "error" : x402Discovery === "verified" ? "verified" : "partial",
      reason:
        hardFailures > 0
          ? "One or more Bingo backend routes failed."
          : x402Discovery === "verified"
            ? "Bingo backend, lobbies, leaderboard, and x402 manifest are live."
            : "Bingo backend, lobbies, and leaderboard are live; x402 discovery/payment proof endpoint still needs a real manifest.",
      probes,
    },
    capabilities: {
      lobbies: lobbies.state,
      leaderboard: leaderboard.state,
      x402Discovery,
      frontendBaseAccountSend: "needs_endpoint",
      paymentProofIngest: "needs_endpoint",
      autonomousPaidPlay: "disabled_until_wallet_proof",
    },
  });
}
