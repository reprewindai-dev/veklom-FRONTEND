import { NextRequest, NextResponse } from "next/server";
import type { VeklomRun } from "../../../../components/terminal/types";

export const dynamic = "force-dynamic";

const BYOS_BACKEND_URL =
  process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";

type SourceState = "verified" | "partial" | "empty" | "needs_proof" | "error";

interface SourceProbe<T = unknown> {
  ok: boolean;
  status: number;
  route: string;
  data?: T;
  error?: string;
}

interface PipelinesGpcResponse {
  runs: VeklomRun[];
  proof: {
    state: SourceState;
    source: string;
    reason: string;
    generated_at: string;
    routes: Record<string, string>;
    probes: SourceProbe[];
  };
  pipelines: unknown[];
  gpc: {
    events?: unknown;
    signals?: unknown;
    stats?: unknown;
  };
}

function authHeaders(req: NextRequest): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Veklom-Control-Plane": "pipelines-gpc",
  };

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) headers.Authorization = auth;

  return headers;
}

async function readJson<T>(req: NextRequest, path: string): Promise<SourceProbe<T>> {
  try {
    const res = await fetch(`${BYOS_BACKEND_URL.replace(/\/+$/, "")}${path}`, {
      method: "GET",
      headers: authHeaders(req),
      cache: "no-store",
    });
    const contentType = res.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? ((await res.json()) as T)
      : undefined;
    return {
      ok: res.ok,
      status: res.status,
      route: path,
      data,
      error: res.ok ? undefined : errorFromResponse(res.status, data),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      route: path,
      error: error instanceof Error ? error.message : "Backend request failed",
    };
  }
}

function errorFromResponse(status: number, data: unknown) {
  if (isRecord(data)) {
    const detail = data.detail;
    if (typeof detail === "string" && detail) return detail;
    if (isRecord(detail)) {
      return stringValue(detail, ["message", "error", "detail"], `HTTP ${status}`);
    }
    return stringValue(data, ["message", "error", "detail"], `HTTP ${status}`);
  }
  return `HTTP ${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(record: Record<string, unknown>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return fallback;
}

function numberValue(record: Record<string, unknown>, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function arrayFrom(value: unknown, key?: string): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (key && isRecord(value) && Array.isArray(value[key])) return value[key].filter(isRecord);
  return [];
}

function runStatus(row: Record<string, unknown>): VeklomRun["status"] {
  const policy = stringValue(row, ["policy", "status"], "").toLowerCase();
  if (policy.includes("fail") || policy.includes("error") || policy.includes("block")) return "failed";
  if (policy.includes("queued") || policy.includes("pending")) return "queued";
  if (policy.includes("running") || policy.includes("active")) return "running";
  return "completed";
}

function runFromRecent(row: Record<string, unknown>, generatedAt: string): VeklomRun {
  const id = stringValue(row, ["id", "run_id"], `run-${generatedAt}`);
  const model = stringValue(row, ["model", "name"], "Governed pipeline run");
  const route = stringValue(row, ["route", "provider"], "unknown-route");
  const latency = numberValue(row, ["latency", "latency_ms"], 0);
  const cost = numberValue(row, ["cost", "cost_usd"], 0);
  const tokens = numberValue(row, ["tokens", "total_tokens"], 0);
  const status = runStatus(row);
  const policy = stringValue(row, ["policy"], "needs_proof");
  const hash = stringValue(row, ["hash", "pgl_hash", "evidence_hash"], `unverified:${id}`);
  const timestamp = stringValue(row, ["timestamp", "created_at", "ts"], generatedAt);

  return {
    id,
    intent: `${model} via ${route}`,
    status,
    timestamp: timestamp.includes("T") ? timestamp : generatedAt,
    duration: latency ? `${latency}ms` : "0ms",
    currentStep: status === "failed" ? "ArbiterOS" : "Attestation",
    steps: [
      {
        name: "Intent",
        status: "completed",
        details: `Workspace overview recorded run ${id}.`,
      },
      {
        name: "Plan",
        status: "completed",
        details: `Route selected by BYOS: ${route}.`,
      },
      {
        name: "cAPI Gateway",
        status: "completed",
        details: "Run was reported through the BYOS workspace overview feed.",
      },
      {
        name: "ArbiterOS",
        status: status === "failed" ? "failed" : "completed",
        details: `Policy verdict from backend: ${policy}.`,
      },
      {
        name: "Redis Lua",
        status: status === "running" ? "active" : status === "failed" ? "failed" : "completed",
        details: `Metering observed ${tokens} tokens at $${cost.toFixed(4)}.`,
      },
      {
        name: "Attestation",
        status: hash.startsWith("unverified:") ? "pending" : "completed",
        hash: hash.startsWith("unverified:") ? undefined : hash,
        details: hash.startsWith("unverified:")
          ? "Backend did not emit a cryptographic evidence hash for this row."
          : "Backend emitted an evidence hash for this run.",
      },
    ],
    attestation: {
      seked: hash.startsWith("unverified:") ? "pending" : "passed",
      arbiter: status === "failed" ? "failed" : "passed",
      converge: hash.startsWith("unverified:") ? "pending" : "passed",
    },
    evidenceCount: hash.startsWith("unverified:") ? 0 : 1,
    policyRule: "workspace.overview.recent_runs",
    policyStatus: status === "failed" ? "violated" : policy === "passed" ? "passed" : "warning",
    policyDetails: `Source route /api/v1/workspace/overview reported policy=${policy}.`,
    hash,
  };
}

function summarizeProof(
  probes: SourceProbe[],
  runs: VeklomRun[],
  generatedAt: string,
): PipelinesGpcResponse["proof"] {
  const failed = probes.filter((probe) => !probe.ok);
  const publicOverviewOk = probes.some((probe) => probe.route === "/api/v1/workspace/overview/live" && probe.ok);
  const authBlocked = failed.find((probe) => {
    if (publicOverviewOk && probe.route === "/api/v1/workspace/overview") return false;
    return probe.status === 401 || probe.status === 403 || probe.status === 402;
  });
  const hardErrors = failed.filter((probe) => ![401, 402, 403].includes(probe.status));

  let state: SourceState = "verified";
  let reason = "Workspace overview, pipelines, and GPC telemetry returned from BYOS.";
  if (authBlocked) {
    state = "needs_proof";
    reason = `${authBlocked.route} requires authorization or payment proof: ${authBlocked.error}${
      publicOverviewOk ? "; public workspace overview is verified" : ""
    }.`;
  } else if (hardErrors.length > 0) {
    state = runs.length > 0 ? "partial" : "error";
    reason = hardErrors.map((probe) => `${probe.route}: ${probe.error}`).join("; ");
  } else if (runs.length === 0) {
    state = "empty";
    reason = "BYOS returned no recent governed pipeline runs for this workspace.";
  }

  return {
    state,
    source: "byos-pipelines-gpc",
    reason,
    generated_at: generatedAt,
    routes: {
      overview: "/api/v1/workspace/overview",
      overview_live: "/api/v1/workspace/overview/live",
      pipelines: "/api/v1/pipelines",
      gpc_events: "/api/v1/gpc/events",
      gpc_signals: "/api/v1/gpc/observability/signals",
      gpc_stats: "/api/v1/gpc/stats",
    },
    probes,
  };
}

export async function GET(req: NextRequest) {
  const generatedAt = new Date().toISOString();
  const [overview, overviewLive, pipelines, gpcEvents, gpcSignals, gpcStats] = await Promise.all([
    readJson(req, "/api/v1/workspace/overview"),
    readJson(req, "/api/v1/workspace/overview/live"),
    readJson(req, "/api/v1/pipelines"),
    readJson(req, "/api/v1/gpc/events"),
    readJson(req, "/api/v1/gpc/observability/signals"),
    readJson(req, "/api/v1/gpc/stats"),
  ]);

  const overviewSource = overview.ok ? overview : overviewLive;
  const overviewData = isRecord(overviewSource.data) ? overviewSource.data : {};
  const recentRuns = arrayFrom(overviewData, "recent_runs");
  const runs = recentRuns.map((row) => runFromRecent(row, generatedAt));
  const pipelineRows = arrayFrom(pipelines.data);
  const probes = [overview, overviewLive, pipelines, gpcEvents, gpcSignals, gpcStats];

  return NextResponse.json(
    {
      runs,
      proof: summarizeProof(probes, runs, generatedAt),
      pipelines: pipelineRows,
      gpc: {
        events: gpcEvents.data,
        signals: gpcSignals.data,
        stats: gpcStats.data,
      },
    } satisfies PipelinesGpcResponse,
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
