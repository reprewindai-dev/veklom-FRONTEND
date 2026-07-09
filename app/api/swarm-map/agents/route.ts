import { NextRequest, NextResponse } from "next/server";
import type { AgentNode } from "../../../../components/terminal/types";

export const dynamic = "force-dynamic";

const BYOS_BACKEND_URL =
  process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";

type ProofState = "verified" | "empty" | "needs_proof" | "error";

interface SwarmMapProof {
  state: ProofState;
  source: string;
  reason: string;
  generated_at: string;
  routes: {
    registry: string;
    health: string;
    metrics: string;
  };
}

interface SwarmMapResponse {
  agents: AgentNode[];
  proof: SwarmMapProof;
  monitoring?: {
    health?: unknown;
    metrics?: unknown;
  };
}

const departments: AgentNode["department"][] = [
  "Engineering",
  "Ops",
  "Research",
  "Revenue",
  "Growth",
];

const roles: AgentNode["role"][] = [
  "Executor",
  "Validator",
  "Orchestrator",
  "Arbiter",
  "Router",
];

function authHeaders(req: NextRequest): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Veklom-Control-Plane": "swarm-map",
  };

  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) headers.Authorization = auth;

  return headers;
}

async function readJson<T>(req: NextRequest, path: string): Promise<{
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}> {
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
      data,
      error: res.ok ? undefined : errorFromResponse(res.status, data),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
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

function arrayFromRegistry(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (isRecord(data) && Array.isArray(data.items)) return data.items.filter(isRecord);
  if (isRecord(data) && Array.isArray(data.agents)) return data.agents.filter(isRecord);
  return [];
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

function numberValue(record: Record<string, unknown>, keys: string[], fallback: number) {
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

function statusValue(raw: string): AgentNode["status"] {
  const normalized = raw.toLowerCase();
  if (["active", "running", "live", "healthy", "online"].includes(normalized)) return "Active";
  if (["blocked", "isolated", "quarantined", "suspended"].includes(normalized)) return "Blocked";
  if (["degraded", "warning", "unhealthy", "error", "failed"].includes(normalized)) return "Degraded";
  return "Idle";
}

function roleValue(raw: string, index: number): AgentNode["role"] {
  const normalized = raw.toLowerCase();
  if (normalized.includes("orchestr")) return "Orchestrator";
  if (normalized.includes("valid")) return "Validator";
  if (normalized.includes("arbiter")) return "Arbiter";
  if (normalized.includes("router")) return "Router";
  if (normalized.includes("exec")) return "Executor";
  return roles[index % roles.length];
}

function departmentValue(raw: string, index: number): AgentNode["department"] {
  const normalized = raw.toLowerCase();
  const match = departments.find((dept) => normalized.includes(dept.toLowerCase()));
  return match || departments[index % departments.length];
}

function toolScopes(record: Record<string, unknown>) {
  const raw = record.toolScopes || record.tool_scopes || record.capabilities || record.skills;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => (typeof item === "string" ? item : isRecord(item) ? stringValue(item, ["id", "name"]) : ""))
      .filter(Boolean);
  }
  return [];
}

function telemetryLogs(record: Record<string, unknown>, generatedAt: string) {
  const raw = record.telemetryLogs || record.telemetry_logs || record.logs;
  if (Array.isArray(raw)) {
    return raw.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).slice(0, 15);
  }
  return [`[${generatedAt.substring(11, 19)}] Registry proof loaded from BYOS /api/v1/agents/registry.`];
}

function mapAgent(record: Record<string, unknown>, index: number, generatedAt: string): AgentNode {
  const id = stringValue(record, ["id", "agent_id", "agentId", "number"], `agent-${index + 1}`);
  const name = stringValue(record, ["name", "display_name", "title"], id);
  const rawRole = stringValue(record, ["role", "type", "agent_type"], "");
  const rawDepartment = stringValue(record, ["department", "cluster", "team", "group"], "");
  const rawStatus = stringValue(record, ["status", "state", "health_status"], "idle");
  const angle = (Math.PI * 2 * index) / Math.max(1, 12);
  const radius = 260 + (index % 3) * 95;
  const scopes = toolScopes(record);

  return {
    id,
    name,
    role: roleValue(rawRole, index),
    department: departmentValue(rawDepartment, index),
    status: statusValue(rawStatus),
    mission: stringValue(
      record,
      ["mission", "description", "purpose"],
      "Registered BYOS agent. No mission text was provided by the authoritative registry.",
    ),
    currentTask: stringValue(record, ["current_task", "currentTask"], ""),
    lastAction: stringValue(record, ["last_action", "lastAction"], ""),
    provider: stringValue(record, ["provider", "route", "model_provider"], ""),
    pgl_hash: stringValue(record, ["pgl_hash", "pglHash", "evidence_hash"], ""),
    pgl_status: stringValue(record, ["pgl_status", "pglStatus"], "") === "revoked" ? "revoked" : stringValue(record, ["pgl_hash", "pglHash", "evidence_hash"], "") ? "verified" : "unverified",
    warnings: [],
    toolScopes: scopes.length ? scopes : ["registry.read"],
    metrics: {
      cpu: Math.max(0, Math.min(100, numberValue(record, ["cpu", "cpu_load", "cpu_percent"], 0))),
      memory: Math.max(0, Math.min(100, numberValue(record, ["memory", "memory_percent", "mem"], 0))),
      latency: Math.max(0, numberValue(record, ["latency", "latency_ms", "p95"], 0)),
      requestCount: Math.max(0, numberValue(record, ["request_count", "requestCount", "runs", "executions"], 0)),
    },
    telemetryLogs: telemetryLogs(record, generatedAt),
    x: 400 + Math.round(Math.cos(angle) * radius),
    y: 300 + Math.round(Math.sin(angle) * radius),
  };
}

export async function GET(req: NextRequest) {
  const generatedAt = new Date().toISOString();
  const [registry, health, metrics] = await Promise.all([
    readJson(req, "/api/v1/agents/registry"),
    readJson(req, "/api/v1/workspace/monitoring/health"),
    readJson(req, "/api/v1/workspace/monitoring/metrics"),
  ]);

  if (!registry.ok) {
    const isPaymentRequired = registry.status === 402;
    const status = registry.status === 401 || registry.status === 403 ? registry.status : 502;
    return NextResponse.json(
      {
        agents: [],
        proof: {
          state: "needs_proof",
          source: "byos-agents-registry",
          reason: isPaymentRequired
            ? `BYOS registry requires x402 payment proof: ${registry.error || "payment_required"}`
            : registry.error || "BYOS agent registry unavailable",
          generated_at: generatedAt,
          routes: {
            registry: "/api/v1/agents/registry",
            health: "/api/v1/workspace/monitoring/health",
            metrics: "/api/v1/workspace/monitoring/metrics",
          },
        },
      } satisfies SwarmMapResponse,
      { status: isPaymentRequired ? 200 : status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const registryRows = arrayFromRegistry(registry.data);
  const agents = registryRows.map((row, index) => mapAgent(row, index, generatedAt));
  const registryData = isRecord(registry.data) ? registry.data : {};
  const source = stringValue(registryData, ["source"], agents.length ? "byos" : "empty");
  const reason = stringValue(
    registryData,
    ["reason", "message", "detail"],
    agents.length ? "BYOS agent registry returned live records." : "No BYOS agent records returned.",
  );

  return NextResponse.json(
    {
      agents,
      proof: {
        state: agents.length > 0 ? "verified" : "empty",
        source,
        reason,
        generated_at: generatedAt,
        routes: {
          registry: "/api/v1/agents/registry",
          health: "/api/v1/workspace/monitoring/health",
          metrics: "/api/v1/workspace/monitoring/metrics",
        },
      },
      monitoring: {
        health: health.data,
        metrics: metrics.data,
      },
    } satisfies SwarmMapResponse,
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
