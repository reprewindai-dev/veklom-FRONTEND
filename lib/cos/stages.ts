import { canonicalBackends } from "@/lib/canonical-backends";
import { CAPI_RUNTIME_LABEL, CAPI_RUNTIME_URL } from "@/lib/capi-runtime";

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
  | "terminal"
  | "registry"
  | "marketplace"
  | "harnesses"
  | "contracts"
  | "verification"
  | "settings";

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
    label: "Private Cloud",
    route: "/os/computeless",
    purpose: "Turn the hardware you already own into governed cloud infrastructure: your machines, capacity, placement, workloads, failover and data locality. Machines hold no authority; every workload runs under its own single-use grant.",
    owner: "COMPUTLESS owned-compute fabric (placement and routing) · CAPPO (authority)",
    endpoints: [
      { method: "GET", path: "/api/fabric/state", classification: "present", response: "enrolled machines, measured capacity, policy, workloads and placement decisions", baseUrl: backend("computless") },
      { method: "GET", path: "/api/fabric/jobs/{job_id}", classification: "present", response: "one workload: authority reference, placement reasons, outcome", baseUrl: backend("computless") },
      { method: "PUT", path: "/api/fabric/policy", classification: "present", response: "placement policy (owned only / owned first / cloud first; cloud enabled)", baseUrl: backend("computless") },
      { method: "POST", path: "/api/fabric/enrollment-keys", classification: "present", response: "one-time setup key for connecting a machine to your own workspace (grants no authority)", baseUrl: backend("computless") },
      { method: "GET", path: "/api/fabric/enrollment", classification: "present", response: "join command for connecting a machine (enrollment grants no authority)", baseUrl: backend("computless") },
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
    purpose: "Discover capability packages, see the target and actions each one binds, and prepare the scope you will ask for. Mounting grants nothing: the single-use grant is requested in Authority.",
    owner: `${CAPI_RUNTIME_LABEL} Interlink bridge`,
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "present", response: "capability package catalog", baseUrl: CAPI_RUNTIME_URL },
      { method: "POST", path: "/v1/capability/mounts", classification: "present", response: "mount decision, scope, and token descriptor", baseUrl: CAPI_RUNTIME_URL },
      { method: "GET", path: "/v1/capability/mounts/{mount_id}", classification: "present", response: "persisted mount lifecycle status", baseUrl: CAPI_RUNTIME_URL },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/actions", classification: "present", response: "action allow or deny decision", baseUrl: CAPI_RUNTIME_URL },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/terminate", classification: "present", response: "mount termination decision", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "blueprint",
    label: "Blueprint",
    route: "/os/blueprint",
    purpose: "Compile a requested outcome into a bounded capability contract before authority is requested. A contract is intent, never authority.",
    owner: "ABIDE blueprint/contract service (wiring W-06)",
    endpoints: [
      { method: "POST", path: "/api/abide/v1/blueprint/compile", classification: "needs_proof", qualification: "deterministic contract id (same intent + catalog = same hash), not persisted; grants nothing", response: "bounded contract: steps, lanes, risk, approvals, gated claims, canonical hash", },
      { method: "POST", path: "/api/abide/v1/contract/project", classification: "needs_proof", qualification: "refuses a tampered contract", response: "AGENTS.md / CLAUDE.md work order" },
      { method: "POST", path: "/api/pgl/ledger/events", classification: "needs_proof", qualification: "seals the contract hash under the operator's registered agent", response: "ledger event and hash" },
    ],
  },
  {
    id: "govern",
    label: "Govern",
    route: "/os/govern",
    purpose: "Lay a plan out as a governed pipeline, see what the catalog covers for every step, and compile it to code that can only act under a single-use permit.",
    owner: "ABIDE pipeline compiler; CAPPO authorization",
    endpoints: [
      { method: "POST", path: "/api/abide/v1/blueprint/compile", classification: "needs_proof", qualification: "deterministic plan id (same intent + catalog = same id), not persisted; grants nothing", response: "steps against the live catalog, verdict, pipeline graph, governed Python, proof hash" },
      { method: "POST", path: "/api/abide/v1/pipeline/compile", classification: "needs_proof", qualification: "compiles the edited canvas graph; grants nothing", response: "governed Python, execution order, parallel levels" },
      { method: "POST", path: "/api/v1/execution/authorize", classification: "needs_proof", qualification: "generated authorization id; local decision service", response: "decision and authorization hashes", baseUrl: backend("cappo") },
      { method: "POST", path: "/v1/governance/v2/assess", classification: "needs_proof", qualification: "in-memory, not durable", response: "governance assessment", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/governance/v2/quarantine", classification: "needs_proof", qualification: "in-memory, not durable", response: "quarantine queue", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "authority",
    label: "Authority",
    route: "/os/authority",
    purpose: "Request one bounded, single-use grant for a binding prepared in Mount, see exactly what was granted against what you asked for, hold it, and revoke it. Authority does not create permissions; it materializes what governance approved.",
    owner: "CAPPO consequence authority",
    endpoints: [
      { method: "POST", path: "/v1/capability/mounts", classification: "present", response: "grant decision, granted scope and grant descriptor", baseUrl: CAPI_RUNTIME_URL },
      { method: "GET", path: "/v1/capability/mounts/{mount_id}", classification: "present", response: "persisted grant lifecycle status", baseUrl: CAPI_RUNTIME_URL },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/actions", classification: "present", response: "action allow or deny decision", baseUrl: CAPI_RUNTIME_URL },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/terminate", classification: "present", response: "revocation decision", baseUrl: backend("cappo") },
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
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/execute", classification: "present", response: "governed consequence response and receipt", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/capability/targets/{target_ref}/state", classification: "present", response: "independent target state readback (no authority consumed)", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "evidence",
    label: "Evidence",
    route: "/os/evidence",
    purpose: "Look up signed execution receipts, trace each decision, and check the tamper-evident ledger record yourself.",
    owner: "CAPPO audit/PGL ledger routes",
    endpoints: [
      { method: "GET", path: "/v1/audit/ledger", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "audit ledger entries", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/audit/verify", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "ledger verification result", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/ledger/agents/{id}", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "agent ledger entries", baseUrl: backend("cappo") },
      { method: "GET", path: "/api/v1/ledger/agents/{id}/verify", classification: "needs_proof", qualification: "route is CAPPO-owned; PGL/Gnomledger owner pending", response: "agent chain verification result", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/capability/targets/{target_ref}/state", classification: "present", response: "independent target state readback (no authority consumed)", baseUrl: backend("cappo") },
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
      { method: "GET", path: "/v1/capability/packages", classification: "present", response: "current registry entry for the bound package", baseUrl: CAPI_RUNTIME_URL },
      { method: "GET", path: "/v1/audit/ledger", classification: "present", response: "composed evidence ledger", baseUrl: backend("cappo") },
      { method: "GET", path: "/v1/runs", classification: "present", response: "composed execution runs", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "terminal",
    label: "Terminal",
    route: "/os/terminal",
    purpose: "The operator console: type directives that run through the same governed tool server machines use. Consequential tools act only under your own credential and a single-use grant; a refusal is final and is never retried. Never an authority bypass.",
    owner: "Capability OS operator console (W-17) · MCP tool server",
    endpoints: [
      { method: "POST", path: "/api/mcp", classification: "present", response: "JSON-RPC tools/list and tools/call results" },
    ],
    crossCutting: true,
  },
  // Capability tools (docs/design-brief/02_NAVIGATION_MAP.md). Each consumes the owning service's
  // routes; none owns execution, governance or settlement.
  {
    id: "registry",
    label: "Registry",
    route: "/os/registry",
    purpose: "Every capability package the live registry serves, and the signed advertisements (beacons) that announce them, with their signatures checked. Discovery is not authority.",
    owner: "cAPI capability registry (W-03) · CAPPO signed beacons",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "present", response: "capability package catalog", baseUrl: CAPI_RUNTIME_URL },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    route: "/os/marketplace",
    purpose: "Find capabilities and install them into this workspace: the product's baseline capabilities and the live package catalog. Installing grants nothing; authority is requested per operation.",
    owner: "cAPI capability registry (W-03, W-04)",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "present", response: "capability package catalog", baseUrl: CAPI_RUNTIME_URL },
    ],
  },
  {
    id: "harnesses",
    label: "Harnesses",
    route: "/os/harnesses",
    purpose: "What each capability package binds to: its target, adapter family and allowed actions, the binding this session holds, and an independent readback of a target's state.",
    owner: "cAPI mounts (W-04) · execution substrate (W-08)",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "present", response: "capability package catalog", baseUrl: CAPI_RUNTIME_URL },
      { method: "GET", path: "/v1/capability/targets/{target_ref}/state", classification: "present", response: "independent target state readback (no authority consumed)", baseUrl: backend("cappo") },
    ],
  },
  {
    id: "contracts",
    label: "Contracts",
    route: "/os/contracts",
    purpose: "Bounded contracts compiled from intent in Blueprint. Check any contract against the compiler: a tampered contract is refused. A contract is intent, never authority.",
    owner: "ABIDE blueprint/contract service (W-06)",
    endpoints: [
      { method: "POST", path: "/api/abide/v1/contract/project", classification: "needs_proof", qualification: "refuses a tampered contract", response: "agent work order, or a refusal" },
    ],
  },
  {
    id: "verification",
    label: "Verification",
    route: "/os/verification",
    purpose: "Check evidence yourself instead of trusting a status: look up a ledger event by its hash and verify an agent's hash chain. Repository scanning is not connected yet.",
    owner: "GnomLedger / PGL (W-11) · RepoGate (W-13, not connected)",
    endpoints: [
      { method: "GET", path: "/api/pgl/ledger/proof/{event_hash}", classification: "present", response: "ledger event persistence and chain status" },
      { method: "GET", path: "/api/pgl/ledger/agents/{agent_id}/verify", classification: "present", response: "agent hash-chain verification" },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    route: "/os/settings",
    purpose: "Your account and wallet. Your workspace comes from your signed-in identity, never from a typed value. API keys and webhooks are not offered by any current service yet.",
    owner: "LockerPhycer identity and wallet (W-02)",
    endpoints: [
      { method: "GET", path: "/api/v1/auth/me", classification: "present", response: "signed-in account" },
      { method: "GET", path: "/api/v1/wallet/balance", classification: "present", response: "wallet balance" },
    ],
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
