import { NextResponse } from "next/server";

type VerificationStackItem = {
  section: string;
  status: string;
  backend?: string;
};

type MethodologyResponse = {
  methodology?: string;
  tagline?: string;
  verification_stack?: VerificationStackItem[];
  backends?: unknown;
};

type TopologyResponse = {
  topology?: {
    activeNodes?: number;
    expectedNodes?: number;
    registeredNodes?: number;
    partiallyImplementedNodes?: number;
    configIncompleteNodes?: number;
    nodes?: Array<{
      region?: string;
      status_str?: string;
      activeKeyCount?: number;
      lastHeartbeat?: string;
      lastObservation?: string;
      observationCount?: number;
      version?: string;
    }>;
  };
};

const BYOS_BACKEND_URL =
  process.env.VBB_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "https://api.veklom.com";

const CAPPO_BACKEND_URL =
  process.env.CAPPO_BACKEND_URL ||
  process.env.CAPI_RUNTIME_URL ||
  "https://capi.veklom.com";

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

async function readJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

const fallbackStack: VerificationStackItem[] = [
  { section: "Physical measurements", status: "Disconnected" },
  { section: "Signed telemetry", status: "Disconnected" },
  { section: "Route beacons", status: "Disconnected" },
  { section: "Robust scoring", status: "Disconnected" },
  { section: "x402 settlement evidence", status: "Disconnected" },
  { section: "PGL audit trails", status: "Disconnected" },
  { section: "Agent/runtime enforcement", status: "Auth Required", backend: "cappo-backend" },
];

export async function GET() {
  const byosBase = trimTrailingSlash(BYOS_BACKEND_URL);
  const cappoBase = trimTrailingSlash(CAPPO_BACKEND_URL);
  const methodologyUrl = `${byosBase}/api/v1/vnp/methodology`;
  const topologyUrl = `${byosBase}/api/v1/beacon/topology`;

  const [methodology, topology] = await Promise.all([
    readJson<MethodologyResponse>(methodologyUrl),
    readJson<TopologyResponse>(topologyUrl),
  ]);

  const verificationStack = methodology?.verification_stack?.length
    ? methodology.verification_stack
    : fallbackStack;

  const x402Status =
    verificationStack.find((item) => item.section === "x402 settlement evidence")?.status ||
    "Disconnected";

  const topologyState = topology?.topology;
  const connectedNodes =
    topologyState?.nodes?.map((node) => ({
      region: node.region,
      status: node.status_str || "Disconnected",
      active_key_count: node.activeKeyCount ?? 0,
      last_heartbeat: node.lastHeartbeat ?? null,
      last_observation: node.lastObservation ?? null,
      observation_count: node.observationCount ?? 0,
      version: node.version ?? null,
    })) || [];

  const vnpData = {
    methodology_version: methodology?.methodology || "VNP Methodology v1.0",
    methodology_url: "https://veklom.com/vnp/methodology",
    license: "VNP Open Standard (CC BY-ND 4.0)",
    data_mode: methodology && topology ? "live" : "partially_connected",
    tagline:
      methodology?.tagline ||
      "Cryptographic API telemetry for the machine-to-machine economy",
    verification_stack: verificationStack,
    backends: {
      byos: byosBase,
      cappo: `${cappoBase}/v1/exec`,
    },
    evidence_endpoints: {
      methodology: methodologyUrl,
      topology: topologyUrl,
      cappo_exec: `${cappoBase}/v1/exec`,
    },
    topology: {
      active_nodes: topologyState?.activeNodes ?? 0,
      expected_nodes: topologyState?.expectedNodes ?? 0,
      registered_nodes: topologyState?.registeredNodes ?? 0,
      partially_implemented_nodes: topologyState?.partiallyImplementedNodes ?? 0,
      config_incomplete_nodes: topologyState?.configIncompleteNodes ?? 0,
      nodes: connectedNodes,
    },
    merkle_root: null,
    merkle_root_status: "Not Yet Wired",
    x402_settlement_enabled: x402Status,
    tracked_apis_count: null,
    api_feed_status: "Use /api/vnp/leaderboard for backend-scored API entries.",
    api_feed: [],
    generated_at: new Date().toISOString(),
  };

  return NextResponse.json(vnpData, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      "X-VNP-Methodology": "VNP Methodology v1.0",
    },
  });
}
