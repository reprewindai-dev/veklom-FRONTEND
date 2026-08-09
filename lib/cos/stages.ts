export type StageEndpointClass = "live" | "proxy" | "absent";
export type StageId =
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
  | "terminal";

export interface StageEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  classification: StageEndpointClass;
  response: string;
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

export const stages: StageDefinition[] = [
  {
    id: "capabilities",
    label: "Capabilities",
    route: "/os",
    purpose: "Choose the capability that will carry the next governed action.",
    owner: "registry / catalog",
    endpoints: [
      { method: "GET", path: "/api/v1/agents", classification: "live", response: "agent registry payload" },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "live", response: "benchmark provider array" },
    ],
  },
  {
    id: "mount",
    label: "Mount",
    route: "/os/mount",
    purpose: "Bind a capability package to a scoped, expiring execution boundary.",
    owner: "CAPPO capability-mount",
    endpoints: [
      { method: "POST", path: "/api/v1/capability/mount", classification: "absent", response: "no registered route" },
    ],
  },
  {
    id: "blueprint",
    label: "Blueprint",
    route: "/os/blueprint",
    purpose: "Turn intent into a reviewable governed plan before execution.",
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
    purpose: "Evaluate authority, policy, and approval boundaries before an action.",
    owner: "CAPPO",
    endpoints: [
      { method: "POST", path: "/api/v1/execution/authorize", classification: "live", response: "decision and authorization hashes" },
      { method: "POST", path: "/v1/governance/v2/assess", classification: "live", response: "governance assessment" },
      { method: "GET", path: "/v1/governance/v2/quarantine", classification: "live", response: "quarantine queue" },
    ],
  },
  {
    id: "execute",
    label: "Execute",
    route: "/os/execute",
    purpose: "Run one governed capability action and surface its transient trace.",
    owner: "CAPPO / BYOS",
    endpoints: [
      { method: "POST", path: "/v1/exec", classification: "live", response: "execution response and execution id" },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    route: "/os/evidence",
    purpose: "Inspect the evidence produced by a governed capability action.",
    owner: "PGL / GnomLedger",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "live", response: "audit ledger entries" },
      { method: "GET", path: "/v1/audit/verify", classification: "live", response: "ledger verification result" },
      { method: "GET", path: "/api/v1/ledger/agents/{id}", classification: "live", response: "agent ledger entries" },
      { method: "GET", path: "/api/v1/ledger/agents/{id}/verify", classification: "live", response: "agent chain verification result" },
    ],
  },
  {
    id: "measure",
    label: "Measure",
    route: "/os/measure",
    purpose: "Measure capability behavior without turning a metric into proof.",
    owner: "VNP",
    endpoints: [
      { method: "GET", path: "/v1/vnp/metrics", classification: "live", response: "measurement payload" },
      { method: "GET", path: "/v1/vnp/leaderboard", classification: "live", response: "VNP rankings" },
      { method: "GET", path: "/v1/vnp/validators", classification: "live", response: "validator registry" },
      { method: "GET", path: "/v1/vnp/incidents", classification: "live", response: "protocol incidents" },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "live", response: "benchmark provider array" },
      { method: "GET", path: "/api/v1/platform/pulse", classification: "live", response: "platform pulse telemetry" },
    ],
  },
  {
    id: "settle",
    label: "Settle",
    route: "/os/settle",
    purpose: "Inspect payment requirements and settlement evidence for an action.",
    owner: "x402",
    endpoints: [
      { method: "GET", path: "/.well-known/x402", classification: "live", response: "payment discovery document" },
      { method: "GET", path: "/api/v1/pricing", classification: "live", response: "pricing response" },
    ],
  },
  {
    id: "authority",
    label: "Authority",
    route: "/os/authority",
    purpose: "Inspect grants, leases, revocations, and authorization context.",
    owner: "LockerPhycer",
    endpoints: [
      { method: "GET", path: "/api/v1/agents/{id}/certificate", classification: "live", response: "certificate metadata" },
      { method: "GET", path: "/api/v1/agents/{id}/lifecycle", classification: "live", response: "lifecycle state" },
      { method: "GET", path: "/api/v1/agents", classification: "live", response: "public agent certificate summaries" },
      { method: "GET", path: "/v1/runs", classification: "live", response: "run EI/EAT fields when returned" },
      { method: "POST", path: "/v1/identities/{execution_id}/revoke", classification: "live", response: "revocation state" },
    ],
    crossCutting: true,
  },
  {
    id: "tracker",
    label: "Tracker",
    route: "/os/tracker",
    purpose: "Compare approved intent, runtime state, and evidence for drift.",
    owner: "composed",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "live", response: "composed evidence ledger" },
      { method: "GET", path: "/v1/runs", classification: "live", response: "composed execution runs" },
      { method: "GET", path: "/api/v1/platform/pulse", classification: "live", response: "composed runtime pulse" },
    ],
    crossCutting: true,
  },
  {
    id: "terminal",
    label: "Terminal",
    route: "/os/terminal",
    purpose: "Inspect transient runtime activity without implying persistent identity.",
    owner: "execution surfaces",
    endpoints: [
      { method: "POST", path: "/v1/exec", classification: "live", response: "execution response" },
    ],
    crossCutting: true,
  },
];

export const spineStages = stages.filter((stage) => !stage.crossCutting);
export const crossCuttingStages = stages.filter((stage) => stage.crossCutting);

export function getStage(id: StageId): StageDefinition {
  const stage = stages.find((candidate) => candidate.id === id);
  if (!stage) throw new Error(`Unknown Capability OS stage: ${id}`);
  return stage;
}
