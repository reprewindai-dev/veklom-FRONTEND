import { NextResponse } from "next/server";

const BYOS_BACKEND_URL = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";

const SOURCES = [
  ["metrics", "/api/v1/vnp/metrics"],
  ["beacon", "/api/v1/vnp/beacon"],
  ["directory", "/api/v1/vnp/directory/realtime"],
  ["staking", "/api/v1/x402/staking/state"],
] as const;

type SourceName = typeof SOURCES[number][0];
type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function positive(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function sourceHasEvidence(name: SourceName, value: JsonRecord | null): boolean {
  if (!value) return false;
  if (name === "metrics") {
    return positive(value.total_physical_measurements) || positive(value.total_probes_recorded) ||
      positive(value.signed_probe_events) || positive(value.blockAnchored);
  }
  if (name === "beacon") return Array.isArray(value.routes) && value.routes.length > 0;
  if (name === "directory") {
    const entries = Array.isArray(value.apis) ? value.apis : Array.isArray(value.entries) ? value.entries : [];
    return entries.length > 0;
  }
  const stats = record(value.protocolStats);
  return (Array.isArray(value.providers) && value.providers.length > 0) ||
    (stats !== null && Object.values(stats).some(positive));
}

function cardsFrom(staking: JsonRecord | null): JsonRecord[] {
  if (!Array.isArray(staking?.providers)) return [];
  return staking.providers.flatMap((candidate) => {
    const provider = record(candidate);
    if (!provider || typeof provider.apiId !== "string") return [];
    return [{
      id: provider.apiId,
      name: typeof provider.name === "string" ? provider.name : provider.apiId,
      provider: typeof provider.provider === "string" ? provider.provider : "Unknown provider",
      score: typeof provider.score === "number" ? provider.score : 0,
      grade: typeof provider.grade === "string" ? provider.grade : "UNMEASURED",
      status: typeof provider.status === "string" ? provider.status : "no_data",
      targetP95Ms: typeof provider.targetP95Ms === "number" ? provider.targetP95Ms : null,
      observedP95Ms: typeof provider.observedP95Ms === "number" ? provider.observedP95Ms : null,
      bondAmountUsdc: typeof provider.bondAmountUsdc === "number" ? provider.bondAmountUsdc : null,
      slashedTotalUsdc: typeof provider.slashedTotalUsdc === "number" ? provider.slashedTotalUsdc : null,
      measurementCount: typeof provider.probe_count_24h === "number" ? provider.probe_count_24h : 0,
      dimensions: [],
    }];
  });
}

export async function GET() {
  const results = await Promise.all(SOURCES.map(async ([name, path]) => {
    try {
      const response = await fetch(`${BYOS_BACKEND_URL.replace(/\/+$/, "")}${path}`, {
        headers: { accept: "application/json" },
        cache: "no-store",
      });
      const value = response.ok ? record(await response.json()) : null;
      return { name, path, value, ok: response.ok };
    } catch {
      return { name, path, value: null, ok: false };
    }
  }));

  const probes = results.map(({ name, path, value, ok }) => ({
    route: path,
    state: !ok ? "error" : sourceHasEvidence(name, value) ? "verified" : "needs_proof",
  }));
  const verified = probes.filter((probe) => probe.state === "verified").length;
  const failed = probes.filter((probe) => probe.state === "error").length;
  const values = Object.fromEntries(results.map((result) => [result.name, result.value])) as Record<SourceName, JsonRecord | null>;
  const directoryNodes = Array.isArray(values.directory?.nodes) ? values.directory.nodes.filter((node) => record(node)) : [];

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    sources: { byos: BYOS_BACKEND_URL },
    proof: {
      state: verified === probes.length ? "verified" : verified > 0 ? "partial" : failed === probes.length ? "error" : "none",
      reason: verified > 0 ? `${verified} of ${probes.length} canonical BYOS sources returned evidence.` : "Canonical BYOS routes returned no evidence-backed Nexus state.",
      probes,
    },
    metrics: values.metrics,
    staking: values.staking,
    cards: cardsFrom(values.staking),
    nodes: directoryNodes,
    anchoring: {
      merkle: values.metrics?.trustBeaconMerkle ?? null,
      merkle_status: values.metrics?.trustBeaconStatus ?? "Needs proof",
      block_anchored: values.metrics?.blockAnchored ?? 0,
      block_status: values.metrics?.blockAnchoredStatus ?? "Needs proof",
    },
  }, { headers: { "cache-control": "no-store" } });
}
