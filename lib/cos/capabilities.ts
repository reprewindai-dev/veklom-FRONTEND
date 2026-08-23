export type ProofStatus =
  | "Verified"
  | "Live"
  | "Needs proof"
  | "Degraded"
  | "Not started"
  | "Manual step"
  | "Simulated";

export type AuthRequirement = "jwt" | "api-key" | "none";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type CapabilityContract = {
  id: string;
  name: string;
  description: string;
  icon: string;
  lifecycleStage: string;
  kind: string;
  route: string;
  method: HttpMethod;
  auth: AuthRequirement;
  authority: { mount: string; execute: string; settle: string };
  trustRequirement: string;
  evidence: { proofState: ProofStatus; pglRequired: boolean };
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  mountState: "Mounted" | "Available";
  workspace: string;
};

export type Capability = CapabilityContract;

export const capabilities: CapabilityContract[] = [
  { id: "repogate-scan", name: "RepoGate Scan", description: "Inspect a repository for governed change and evidence readiness.", icon: "ScanSearch", lifecycleStage: "Mount", kind: "Verification", route: "/api/v1/repogate", method: "POST", auth: "jwt", authority: { mount: "Repository access", execute: "Repository access", settle: "None" }, trustRequirement: "Repository access", evidence: { proofState: "Not started", pglRequired: true }, inputs: { repository: "string", commit: "string" }, outputs: { scanId: "string", status: "string", issues: "array" }, mountState: "Available", workspace: "/os/mount" },
  { id: "build-blueprint", name: "Build Blueprint", description: "Turn structured intent into a reviewable implementation blueprint.", icon: "Workflow", lifecycleStage: "Blueprint", kind: "Compiler", route: "/api/v1/gpc", method: "POST", auth: "jwt", authority: { mount: "Workspace identity", execute: "Workspace identity", settle: "None" }, trustRequirement: "Workspace identity", evidence: { proofState: "Not started", pglRequired: true }, inputs: { intent: "string", requirements: "object" }, outputs: { blueprintId: "string", plan: "object" }, mountState: "Available", workspace: "/os/blueprint" },
  { id: "security-audit", name: "Security Audit", description: "Review security events, controls, and unresolved risk signals.", icon: "ShieldCheck", lifecycleStage: "Govern", kind: "Governance", route: "/api/v1/security/events", method: "GET", auth: "jwt", authority: { mount: "Governance authority", execute: "Governance authority", settle: "None" }, trustRequirement: "Governance authority", evidence: { proofState: "Not started", pglRequired: true }, inputs: { timeframe: "string", severity: "string" }, outputs: { events: "array", summary: "object" }, mountState: "Available", workspace: "/os/govern" },
  { id: "api-discovery", name: "API Discovery", description: "Discover capability contracts without treating discovery as proof.", icon: "Radar", lifecycleStage: "Mount", kind: "Discovery", route: "/api/v1/capabilities", method: "GET", auth: "jwt", authority: { mount: "Read access", execute: "Read access", settle: "None" }, trustRequirement: "Read access", evidence: { proofState: "Not started", pglRequired: false }, inputs: { query: "string" }, outputs: { capabilities: "array" }, mountState: "Available", workspace: "/os/mount" },
  { id: "mcp-publish", name: "MCP Publish", description: "Prepare a capability for governed MCP registry publication.", icon: "Send", lifecycleStage: "Mount", kind: "Registry", route: "/api/v1/plugins", method: "POST", auth: "jwt", authority: { mount: "Publisher authority", execute: "Publisher authority", settle: "None" }, trustRequirement: "Publisher authority", evidence: { proofState: "Not started", pglRequired: true }, inputs: { pluginManifest: "object" }, outputs: { pluginId: "string", status: "string" }, mountState: "Available", workspace: "/os/mount" },
  { id: "capability-mount", name: "Capability Mount", description: "Resolve a capability, harness, contract, and evidence boundary.", icon: "PlugZap", lifecycleStage: "Mount", kind: "Runtime", route: "/api/v1/agents", method: "POST", auth: "jwt", authority: { mount: "Mount authority", execute: "Mount authority", settle: "None" }, trustRequirement: "Mount authority", evidence: { proofState: "Not started", pglRequired: true }, inputs: { capabilityId: "string", configuration: "object" }, outputs: { mountId: "string", status: "string" }, mountState: "Available", workspace: "/os/mount" },
  { id: "blueprint", name: "Blueprint", description: "The mounted blueprint workspace for intent and plan review.", icon: "FileCode2", lifecycleStage: "Blueprint", kind: "Workspace", route: "/os/blueprint", method: "GET", auth: "none", authority: { mount: "Workspace identity", execute: "Workspace identity", settle: "None" }, trustRequirement: "Workspace identity", evidence: { proofState: "Needs proof", pglRequired: false }, inputs: {}, outputs: {}, mountState: "Mounted", workspace: "/os/blueprint" },
  { id: "harness", name: "Harness", description: "A governed adapter boundary for capability execution.", icon: "Cable", lifecycleStage: "Mount", kind: "Workspace", route: "/os/mount", method: "GET", auth: "none", authority: { mount: "Mount authority", execute: "Mount authority", settle: "None" }, trustRequirement: "Mount authority", evidence: { proofState: "Needs proof", pglRequired: false }, inputs: {}, outputs: {}, mountState: "Mounted", workspace: "/os/mount" },
  { id: "evidence", name: "Evidence", description: "Review lineage, hashes, signatures, and replayable proof.", icon: "FileCheck2", lifecycleStage: "Evidence", kind: "Workspace", route: "/api/v1/ledger/events", method: "GET", auth: "jwt", authority: { mount: "Evidence access", execute: "Evidence access", settle: "Evidence access" }, trustRequirement: "Evidence access", evidence: { proofState: "Needs proof", pglRequired: true }, inputs: { filter: "object" }, outputs: { events: "array" }, mountState: "Mounted", workspace: "/os/evidence" },
  { id: "settlement", name: "Settlement", description: "Review payment requirements and settlement evidence.", icon: "ReceiptText", lifecycleStage: "Settle", kind: "Workspace", route: "/api/v1/x402/payment-required", method: "GET", auth: "jwt", authority: { mount: "Settlement authority", execute: "Settlement authority", settle: "Settlement authority" }, trustRequirement: "Settlement authority", evidence: { proofState: "Needs proof", pglRequired: true }, inputs: {}, outputs: { required: "boolean", options: "array" }, mountState: "Mounted", workspace: "/os/settle" },
  { id: "tracker", name: "Tracker", description: "Compare approved intent, artifacts, runtime, and evidence for drift.", icon: "Route", lifecycleStage: "Tracker", kind: "Workspace", route: "/os/tracker", method: "GET", auth: "jwt", authority: { mount: "Audit access", execute: "Audit access", settle: "None" }, trustRequirement: "Audit access", evidence: { proofState: "Needs proof", pglRequired: true }, inputs: {}, outputs: { driftReport: "object" }, mountState: "Mounted", workspace: "/os/tracker" },
];
