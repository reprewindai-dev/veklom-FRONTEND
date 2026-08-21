// Shared, truth-locked helpers for the canonical VNP beacon topology.
//
// Source of truth: GET /api/v1/beacon/topology (same-origin proxy to the
// canonical backend / vnp.veklom.com). The response is nested under a
// top-level `topology` key. The UI must render ONLY what the backend returns
// and must NEVER infer "Live"/"Connected" from object existence or a nonzero
// observation count.

export const TOPOLOGY_ENDPOINT = "/api/v1/beacon/topology";
export const CANONICAL_TOPOLOGY_URL = "https://vnp.veklom.com/api/v1/beacon/topology";

// The five canonical physical VNP nodes (all Hetzner). These are the only
// valid sites; they are NOT hardcoded as "Live".
export const CANONICAL_NODE_REGIONS = [
  "us-ashburn",
  "us-hillsboro",
  "de-nuremberg",
  "de-falkenstein",
  "sg-singapore",
] as const;

export interface VnpTopologyNode {
  id: string;
  name: string;
  region: string;
  physicalLocation?: string;
  macroRegion?: string;
  jurisdiction?: string;
  gdprZone?: boolean;
  status?: string;
  status_str?: string;
  x?: number;
  y?: number;
  stakeUsd?: number;
  cpuMs?: number;
  poolUtilization?: number;
  version?: string;
  tenantLock?: string;
  registrationStatus?: string;
  activeKeyCount?: number;
  heartbeatFreshnessSeconds?: number | null;
  lastHeartbeat?: string | null;
  observationCount?: number;
  lastObservation?: string | null;
}

export interface VnpTopology {
  nodes?: VnpTopologyNode[];
  eventsLog?: string[];
  ledgerFeed?: unknown[];
  totalSettledUsd?: number;
  activeNodes?: number;
  expectedNodes?: number;
  registeredNodes?: number;
  partiallyImplementedNodes?: number;
  configIncompleteNodes?: number;
  isActiveStorm?: boolean;
  safetyGuardActive?: boolean;
}

export interface VnpTopologyResponse {
  status?: string;
  topology?: VnpTopology;
}

// The only allowed status vocabulary where evidence is absent or partial.
export type ProofState =
  | "Verified"
  | "Present"
  | "Needs proof"
  | "Insufficient Evidence"
  | "Not started"
  | "Simulated"
  | "Unknown";

// A heartbeat only counts as "recent" if it arrived within this window.
export const HEARTBEAT_FRESH_SECONDS = 120;

export function isHeartbeatFresh(node: VnpTopologyNode): boolean {
  return (
    typeof node.heartbeatFreshnessSeconds === "number" &&
    node.heartbeatFreshnessSeconds >= 0 &&
    node.heartbeatFreshnessSeconds <= HEARTBEAT_FRESH_SECONDS
  );
}

// Honest connectivity state derived strictly from returned telemetry.
// We never label a node "Verified" for connectivity (a fresh heartbeat is
// evidence of presence, not a cryptographic proof of correctness).
export function nodeConnectivityState(node: VnpTopologyNode): {
  state: ProofState;
  reason: string;
} {
  const registered = node.registrationStatus === "registered";
  const connected = (node.status_str ?? "").toLowerCase() === "connected";
  const fresh = isHeartbeatFresh(node);
  const freshnessLabel = formatFreshness(node.heartbeatFreshnessSeconds);
  const backendStatus = node.status_str || node.status || "unknown";

  if (connected && fresh) {
    return {
      state: "Present",
      reason: `Backend reports "${backendStatus}"; heartbeat ${freshnessLabel}.`,
    };
  }
  if (registered) {
    return {
      state: "Needs proof",
      reason: `Registered but backend reports "${backendStatus}"; last heartbeat ${freshnessLabel}.`,
    };
  }
  if (!node.registrationStatus) {
    return { state: "Not started", reason: "Node is not registered with the beacon." };
  }
  return {
    state: "Unknown",
    reason: `Backend reports "${backendStatus}" with registrationStatus "${node.registrationStatus}".`,
  };
}

export function formatFreshness(seconds?: number | null): string {
  if (typeof seconds !== "number" || seconds < 0) return "unknown";
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h ago`;
}

export function formatTimestamp(ts?: string | null): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");
}

// Tailwind classes for a proof-state pill. Color is reserved for status only.
export function proofStateClasses(state: ProofState): string {
  switch (state) {
    case "Present":
    case "Verified":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/30";
    case "Needs proof":
    case "Insufficient Evidence":
      return "text-amber-300 bg-amber-500/10 border-amber-500/30";
    case "Simulated":
      return "text-indigo-300 bg-indigo-500/10 border-indigo-500/30";
    case "Not started":
    case "Unknown":
    default:
      return "text-slate-300 bg-slate-500/10 border-slate-500/30";
  }
}
