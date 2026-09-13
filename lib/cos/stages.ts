import { canonicalBackends } from "@/lib/canonical-backends";

/**
 * present = handler found in owning service source at the pinned SHA; needs_proof = declared but unverified/qualified; absent = no handler found.
 * Runtime truth (Verified/Live/Degraded) is never static — it comes from probes only.
 */
export type StageEndpointClass = "present" | "needs_proof" | "absent";
export type StageId =
  | "computeless"
  | "capabilities"
  | "mount"
  | "blueprint"
  | "govern"
  | "authority"
  | "execute"
  | "evidence"
  | "measure"
  | "settle"
  | "tracker"
  | "terminal";

export interface StageEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  classification: StageEndpointClass;
  response: string;
  baseUrl?: string;
  qualification?: string;
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
    label: "Runtime diagnostics",
    route: "/os/computeless",
    purpose: "Inspect source-declared compute diagnostics; no matching backend handlers were found at the audited SHAs.",
    owner: "COMPUTLESS diagnostics (route handlers pending)",
    endpoints: [
      { method: "GET", path: "/api/v1/computeless/telemetry", classification: "absent", response: "compute telemetry" },
      { method: "GET", path: "/api/v1/computeless/evidence", classification: "absent", response: "compute evidence payload" },
      { method: "POST", path: "/api/v1/computeless/execute", classification: "absent", response: "execute action" },
    ],
    crossCutting: true,
  },
  {
    id: "capabilities",
    label: "Capabilities",
    route: "/os",
    purpose: "Discover what connected systems can do through Veklom without confusing discovery with authority.",
    owner: "CAPPO capability registry (beacons) — cAPI discovery pending",
    endpoints: [
      { method: "GET", path: "/api/v1/agents", classification: "needs_proof", qualification: "route is CAPPO-owned; registry owner says cAPI", response: "capability/agent registry payload", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "needs_proof", qualification: "seeded fallback when empty; route is CAPPO-owned", response: "benchmark provider array", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/capability/beacons", classification: "needs_proof", qualification: "route is CAPPO-owned; registry owner says cAPI", response: "signed capability beacon set", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/capability/beacons/verify", classification: "needs_proof", qualification: "route is CAPPO-owned; registry owner says cAPI", response: "beacon signature verification result", baseUrl: backend("cappo") },
      { method: "GET", path: "/.well-known/capability-beacon-keys", classification: "needs_proof", qualification: "configured published keys; route is CAPPO-owned", response: "published beacon issuer keys", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "mount",
    label: "Mount",
    route: "/os/mount",
    purpose: "Compatibility surface for binding a capability package to a scoped, expiring execution boundary.",
    owner: "CAPPO consequence authority",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "present", response: "capability package catalog", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/capability/mounts", classification: "present", response: "mount decision, scope, and token descriptor", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/capability/mounts/{mount_id}", classification: "present", response: "persisted mount lifecycle status", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/actions", classification: "present", response: "action allow or deny decision", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/terminate", classification: "present", response: "mount termination decision", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "blueprint",
    label: "Blueprint",
    route: "/os/blueprint",
    purpose: "Compose capabilities and compile intent into a reviewable blueprint before authority is requested.",
    owner: "CAPPO GPC router",
    endpoints: [
      { method: "POST", path: "/api/v1/gpc/compile", classification: "needs_proof", qualification: "generated plan id, not persisted", response: "plan graph and proof hash", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/gpc/stats", classification: "needs_proof", qualification: "route is CAPPO-owned; registry owner says GPC/ABIDE", response: "plan/run decision totals", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "govern",
    label: "Govern",
    route: "/os/govern",
    purpose: "Compatibility surface for policy and approval evaluation before consequence authority is issued.",
    owner: "CAPPO authorization / governance v2",
    endpoints: [
      { method: "POST", path: "/api/v1/execution/authorize", classification: "needs_proof", qualification: "generated authorization id; local decision service", response: "decision and authorization hashes", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/governance/v2/assess", classification: "needs_proof", qualification: "in-memory, not durable", response: "governance assessment", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/governance/v2/quarantine", classification: "needs_proof", qualification: "in-memory, not durable", response: "quarantine queue", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "authority",
    label: "Authority",
    route: "/os/authority",
    purpose: "Inspect operation-specific CapabilityLeases, scope, expiry, revocation and target-state authority.",
    owner: "CAPPO consequence authority",
    endpoints: [
      { method: "GET", path: "/api/v1/agents/{id}/certificate", classification: "present", response: "certificate metadata", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/agents/{id}/lifecycle", classification: "present", response: "lifecycle state", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/agents", classification: "present", response: "public agent certificate summaries", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/runs", classification: "needs_proof", qualification: "admin authz not enforced in route", response: "run EI/EAT fields when returned", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/identities/{execution_id}/revoke", classification: "needs_proof", qualification: "admin authz not enforced in route", response: "revocation state", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "execute",
    label: "Execute",
    route: "/os/execute",
    purpose: "Inspect actual governed work, execution state, and consequence results.",
    owner: "CAPPO authority / Governed Compute execution",
    endpoints: [
      { method: "POST", path: "/v1/exec", classification: "present", response: "execution response and execution id", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    route: "/os/evidence",
    purpose: "Inspect EEE execution receipts and durable PGL/GnomLedger provenance.",
    owner: "CAPPO audit/PGL ledger routes",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "audit ledger entries", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/audit/verify", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "ledger verification result", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/ledger/agents/{id}", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "agent ledger entries", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/ledger/agents/{id}/verify", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "agent chain verification result", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "measure",
    label: "Measure",
    route: "/os/measure",
    purpose: "Measure performance, reliability, economics and routing evidence without turning metrics into authority.",
    owner: "CAPPO VNP router",
    endpoints: [
      { method: "GET", path: "/v1/vnp/metrics", classification: "needs_proof", qualification: "public route; route is CAPPO-owned", response: "measurement payload", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/vnp/leaderboard", classification: "needs_proof", qualification: "route is CAPPO-owned; VNP ownership pending", response: "VNP rankings", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/vnp/validators", classification: "needs_proof", qualification: "route is CAPPO-owned; VNP ownership pending", response: "validator registry", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/vnp/incidents", classification: "needs_proof", qualification: "route is CAPPO-owned; VNP ownership pending", response: "protocol incidents", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "needs_proof", qualification: "seeded fallback when empty; route is CAPPO-owned", response: "benchmark provider array", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "settle",
    label: "Settle",
    route: "/os/settle",
    purpose: "Compatibility surface for payment requirements and settlement evidence.",
    owner: "CAPPO x402 router (ecobe-mvp is payment owner)",
    endpoints: [
      { method: "GET", path: "/.well-known/x402", classification: "needs_proof", qualification: "configured/disabled fallback", response: "payment discovery document", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/pricing", classification: "needs_proof", qualification: "configured/disabled fallback", response: "pricing response", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "tracker",
    label: "Tracker",
    route: "/os/tracker",
    purpose: "Show what needs attention now by composing authority, execution, evidence and measurement truth.",
    owner: "Capability OS composed view",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "present", response: "composed evidence ledger", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/runs", classification: "present", response: "composed execution runs", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "terminal",
    label: "Terminal",
    route: "/os/terminal",
    purpose: "Expert alternate interface over the same governed paths; never an authority bypass.",
    owner: "Capability OS",
    endpoints: [
      { method: "POST", path: "/v1/exec", classification: "present", response: "execution response", baseUrl: backend("cappo") },
    ],
    crossCutting: true,
  },
];

const navOrder: StageId[] = [
  "capabilities",
  "mount",
  "blueprint",
  "govern",
  "authority",
  "execute",
  "evidence",
  "measure",
  "settle",
  "tracker",
];

export const spineStages = navOrder.map((id) => getStage(id));
export const crossCuttingStages = stages.filter((stage) => stage.crossCutting && !navOrder.includes(stage.id));

export function getStage(id: StageId): StageDefinition {
  const stage = stages.find((candidate) => candidate.id === id);
  if (!stage) throw new Error(`Unknown Capability OS stage: ${id}`);
  return stage;
}
