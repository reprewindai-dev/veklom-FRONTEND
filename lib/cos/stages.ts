import { canonicalBackends } from "@/lib/canonical-backends";

export type StageEndpointClass = "live" | "proxy" | "absent";
export type StageId =
  | "computeless"
  | "infrastructure"
  | "capabilities"
  | "mount"
  | "blueprint"
  | "govern"
  | "execute"
  | "evidence"
  | "measure"
  | "settle"
  | "authority"
  | "tracker"
  | "terminal"
  | "settings";

export interface StageEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  classification: StageEndpointClass;
  response: string;
  baseUrl?: string;
}

export interface StageDefinition {
  id: StageId;
  label: string;
  route: string;
  purpose: string;
  owner: string;
  endpoints: StageEndpoint[];
  crossCutting?: boolean;
}

const backend = (id: string) => canonicalBackends().find((item) => item.id === id)?.baseUrl;

export const stages: StageDefinition[] = [
  {
    id: "computeless",
    label: "Compute-less",
    route: "/os/computeless",
    purpose: "Inspect connected compute supply and the bounded environments available for governed execution.",
    owner: "Governed Compute / connected providers",
    endpoints: [
      { method: "GET", path: "/api/v1/computeless/telemetry", classification: "live", response: "compute telemetry" },
      { method: "GET", path: "/api/v1/computeless/evidence", classification: "live", response: "compute evidence payload" },
    ],
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    route: "/os/infrastructure",
    purpose: "Inspect the physical hosts, networking topologies, and core runtimes backing the operating system.",
    owner: "Governed Compute / Core Infrastructure",
    endpoints: [
      { method: "GET", path: "/api/v1/infrastructure/host", classification: "absent", response: "host metrics" },
      { method: "GET", path: "/api/v1/infrastructure/runtime", classification: "absent", response: "runtime metrics" },
      { method: "GET", path: "/api/v1/infrastructure/topology", classification: "absent", response: "network topology" },
      { method: "GET", path: "/api/v1/infrastructure/connectivity", classification: "absent", response: "connectivity status" },
    ],
  },
  {
    id: "capabilities",
    label: "Capabilities",
    route: "/os",
    purpose: "Discover what connected systems can do through Veklom without confusing discovery with authority.",
    owner: "cAPI / capability registry",
    endpoints: [
      { method: "GET", path: "/api/v1/agents", classification: "live", response: "capability/agent registry payload", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "live", response: "benchmark provider array", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/capability/beacons", classification: "live", response: "signed capability beacon set" },
      { method: "POST", path: "/v1/capability/beacons/verify", classification: "live", response: "beacon signature verification result" },
      { method: "GET", path: "/.well-known/capability-beacon-keys", classification: "live", response: "published beacon issuer keys" },
    ],
  },
  {
    id: "mount",
    label: "Mount",
    route: "/os/mount",
    purpose: "Compatibility surface for binding a capability package to a scoped, expiring execution boundary.",
    owner: "CAPPO consequence authority",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "live", response: "capability package catalog", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/capability/mounts", classification: "live", response: "mount decision, scope, and token descriptor", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/capability/mounts/{mount_id}", classification: "live", response: "persisted mount lifecycle status", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/actions", classification: "live", response: "action allow or deny decision", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/terminate", classification: "live", response: "mount termination decision", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "blueprint",
    label: "Workflows",
    route: "/os/blueprint",
    purpose: "Compose capabilities and compile intent into a reviewable workflow before authority is requested.",
    owner: "GPC / ABIDE",
    endpoints: [
      { method: "POST", path: "/api/v1/gpc/compile", classification: "live", response: "plan graph and proof hash" },
      { method: "GET", path: "/api/v1/gpc/stats", classification: "live", response: "plan/run decision totals" },
    ],
  },
  {
    id: "govern",
    label: "Govern",
    route: "/os/govern",
    purpose: "Compatibility surface for policy and approval evaluation before consequence authority is issued.",
    owner: "SEKED policy input / CAPPO authority",
    endpoints: [
      { method: "POST", path: "/api/v1/execution/authorize", classification: "live", response: "decision and authorization hashes", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/governance/v2/assess", classification: "live", response: "governance assessment", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/governance/v2/quarantine", classification: "live", response: "quarantine queue", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "execute",
    label: "Executions",
    route: "/os/execute",
    purpose: "Inspect actual governed work, execution state, and consequence results.",
    owner: "CAPPO authority / Governed Compute execution",
    endpoints: [
      { method: "POST", path: "/v1/exec", classification: "live", response: "execution response and execution id", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    route: "/os/evidence",
    purpose: "Inspect EEE execution receipts and durable PGL/GnomLedger provenance.",
    owner: "EEE / PGL / GnomLedger",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "live", response: "audit ledger entries", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/audit/verify", classification: "live", response: "ledger verification result", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/ledger/agents/{id}", classification: "live", response: "agent ledger entries", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/ledger/agents/{id}/verify", classification: "live", response: "agent chain verification result", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "measure",
    label: "Measure",
    route: "/os/measure",
    purpose: "Measure performance, reliability, economics and routing evidence without turning metrics into authority.",
    owner: "VNP",
    endpoints: [
      { method: "GET", path: "/v1/vnp/metrics", classification: "live", response: "measurement payload" },
      { method: "GET", path: "/v1/vnp/leaderboard", classification: "live", response: "VNP rankings" },
      { method: "GET", path: "/v1/vnp/validators", classification: "live", response: "validator registry" },
      { method: "GET", path: "/v1/vnp/incidents", classification: "live", response: "protocol incidents" },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "live", response: "benchmark provider array", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/platform/pulse", classification: "live", response: "platform pulse telemetry", baseUrl: backend("byos") },
    ],
  },
  {
    id: "settle",
    label: "Settle",
    route: "/os/settle",
    purpose: "Compatibility surface for payment requirements and settlement evidence.",
    owner: "x402 settlement",
    endpoints: [
      { method: "GET", path: "/.well-known/x402", classification: "live", response: "payment discovery document", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/pricing", classification: "live", response: "pricing response", baseUrl: backend("cappo") },
      { method: "POST", path: "/api/v1/x402/verify", classification: "live", response: "x402 payment verification result", baseUrl: backend("byos") },
      { method: "GET", path: "/api/v1/x402/{receipt_id}/proof", classification: "live", response: "x402 receipt proof", baseUrl: backend("byos") },
    ],
  },
  {
    id: "authority",
    label: "Authority",
    route: "/os/authority",
    purpose: "Inspect operation-specific CapabilityLeases, scope, expiry, revocation and target-state authority.",
    owner: "CAPPO consequence authority",
    endpoints: [
      { method: "GET", path: "/api/v1/agents/{id}/certificate", classification: "live", response: "certificate metadata", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/agents/{id}/lifecycle", classification: "live", response: "lifecycle state", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/agents", classification: "live", response: "public agent certificate summaries", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/runs", classification: "live", response: "run EI/EAT fields when returned", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/identities/{execution_id}/revoke", classification: "live", response: "revocation state", baseUrl: backend("cappo") },
    ],
    crossCutting: true,
  },
  {
    id: "tracker",
    label: "Command",
    route: "/os/tracker",
    purpose: "Show what needs attention now by composing authority, execution, evidence and measurement truth.",
    owner: "Capability OS composed view",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "live", response: "composed evidence ledger", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/runs", classification: "live", response: "composed execution runs", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/platform/pulse", classification: "live", response: "composed runtime pulse", baseUrl: backend("byos") },
    ],
    crossCutting: true,
  },
  {
    id: "terminal",
    label: "Terminal",
    route: "/os/terminal",
    purpose: "Expert alternate interface over the same governed paths; never an authority bypass.",
    owner: "Capability OS",
    endpoints: [
      { method: "POST", path: "/v1/exec", classification: "live", response: "execution response", baseUrl: backend("cappo") },
    ],
    crossCutting: true,
  },
];

const navOrder: StageId[] = [
  "tracker",
  "capabilities",
  "blueprint",
  "execute",
  "authority",
  "evidence",
  "measure",
  "computeless",
  "infrastructure",
];

export const spineStages = navOrder.map((id) => stages.find((stage) => stage.id === id)!).filter(Boolean);
export const crossCuttingStages = stages.filter((stage) => stage.crossCutting && !navOrder.includes(stage.id));

export function getStage(id: StageId): StageDefinition {
  const stage = stages.find((candidate) => candidate.id === id);
  if (!stage) throw new Error(`Unknown Capability OS stage: ${id}`);
  return stage;
}
