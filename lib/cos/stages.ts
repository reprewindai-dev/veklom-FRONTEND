import { canonicalBackends } from "@/lib/canonical-backends";
import { isCappoProxyPath } from "@/lib/cappo-proxy-paths";

export type StageEndpointClass = "live" | "proxy" | "absent";
export type StageId =
  | "computeless"
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

export const stages: StageDefinition[] = [
  {
    id: "computeless",
    label: "Compute-Less",
    route: "/os/computeless",
    purpose: "Execute distributed operations without underlying traditional compute infrastructure.",
    owner: "Veklom Compute-Less Cloud",
    endpoints: [
      { method: "GET", path: "/api/v1/computeless/telemetry", classification: "live", response: "telemetry stream" },
      { method: "GET", path: "/api/v1/computeless/evidence", classification: "live", response: "evidence payload" }
    ],
  },
  {
    id: "capabilities",
    label: "Capabilities",
    route: "/os",
    purpose: "Choose the capability that will carry the next governed action.",
    owner: "registry / catalog",
    endpoints: [
      { method: "GET", path: "/api/v1/agents", classification: "live", response: "agent registry payload", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "live", response: "benchmark provider array", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/v1/capability/beacons", classification: "live", response: "signed capability beacon set" },
      { method: "POST", path: "/v1/capability/beacons/verify", classification: "live", response: "beacon signature verification result" },
      { method: "GET", path: "/.well-known/capability-beacon-keys", classification: "live", response: "published beacon issuer keys" },
    ],
  },
  {
    id: "mount",
    label: "Mount",
    route: "/os/mount",
    purpose: "Bind a capability package to a scoped, expiring execution boundary.",
    owner: "CAPPO capability-mount",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "live", response: "capability package catalog", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "POST", path: "/v1/capability/mounts", classification: "live", response: "mount decision, scope, and token descriptor", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/v1/capability/mounts/{mount_id}", classification: "live", response: "persisted mount lifecycle status", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/actions", classification: "live", response: "action allow or deny decision", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/terminate", classification: "live", response: "mount termination decision", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
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
      { method: "POST", path: "/api/v1/execution/authorize", classification: "live", response: "decision and authorization hashes", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "POST", path: "/v1/governance/v2/assess", classification: "live", response: "governance assessment", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/v1/governance/v2/quarantine", classification: "live", response: "quarantine queue", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
    ],
  },
  {
    id: "execute",
    label: "Execute",
    route: "/os/execute",
    purpose: "Run one governed capability action and surface its transient trace.",
    owner: "CAPPO / BYOS",
    endpoints: [
      { method: "POST", path: "/v1/exec", classification: "live", response: "execution response and execution id", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    route: "/os/evidence",
    purpose: "Inspect the evidence produced by a governed capability action.",
    owner: "PGL / GnomLedger",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "live", response: "audit ledger entries", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/v1/audit/verify", classification: "live", response: "ledger verification result", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/ledger/agents/{id}", classification: "live", response: "agent ledger entries", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/ledger/agents/{id}/verify", classification: "live", response: "agent chain verification result", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
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
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "live", response: "benchmark provider array", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/platform/pulse", classification: "live", response: "platform pulse telemetry", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
    ],
  },
  {
    id: "settle",
    label: "Settle",
    route: "/os/settle",
    purpose: "Inspect payment requirements and settlement evidence for an action.",
    owner: "x402",
    endpoints: [
      { method: "GET", path: "/.well-known/x402", classification: "live", response: "payment discovery document", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/pricing", classification: "live", response: "pricing response", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "POST", path: "/api/v1/x402/verify", classification: "live", response: "x402 payment verification result", baseUrl: canonicalBackends().find((backend) => backend.id === "byos")?.baseUrl },
      { method: "GET", path: "/api/v1/x402/{receipt_id}/proof", classification: "live", response: "x402 receipt proof", baseUrl: canonicalBackends().find((backend) => backend.id === "byos")?.baseUrl },
    ],
  },
  {
    id: "authority",
    label: "Authority",
    route: "/os/authority",
    purpose: "Inspect grants, leases, revocations, and authorization context.",
    owner: "LockerPhycer",
    endpoints: [
      { method: "GET", path: "/lockerphycer/health", classification: "live", response: "Lockerphycer process health" },
      { method: "GET", path: "/lockerphycer/health/dependencies", classification: "live", response: "Lockerphycer dependency health" },
      { method: "GET", path: "/lockerphycer/protocol.json", classification: "live", response: "Lockerphycer capability manifest" },
      { method: "GET", path: "/api/v1/agents/{id}/certificate", classification: "live", response: "certificate metadata", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/agents/{id}/lifecycle", classification: "live", response: "lifecycle state", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/agents", classification: "live", response: "public agent certificate summaries", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/v1/runs", classification: "live", response: "run EI/EAT fields when returned", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "POST", path: "/v1/identities/{execution_id}/revoke", classification: "live", response: "revocation state", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
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
      { method: "GET", path: "/v1/audit/ledger", classification: "live", response: "composed evidence ledger", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/v1/runs", classification: "live", response: "composed execution runs", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
      { method: "GET", path: "/api/v1/platform/pulse", classification: "live", response: "composed runtime pulse", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
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
      { method: "POST", path: "/v1/exec", classification: "live", response: "execution response", baseUrl: canonicalBackends().find((backend) => backend.id === "cappo")?.baseUrl },
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
