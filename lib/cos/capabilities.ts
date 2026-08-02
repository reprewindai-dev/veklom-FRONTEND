export type ProofStatus =
  | "Verified"
  | "Needs proof"
  | "Present"
  | "Degraded"
  | "Not started"
  | "Manual step"
  | "Simulated";

export type Capability = {
  id: string;
  name: string;
  description: string;
  icon: string;
  lifecycleStage: string;
  kind: string;
  backendRoute: string;
  trustRequirement: string;
  mountState: "Mounted" | "Available";
  proofStatus: ProofStatus;
};

export const capabilities: Capability[] = [
  {
    id: "repogate-scan",
    name: "RepoGate Scan",
    description: "Inspect a repository for governed change and evidence readiness.",
    icon: "ScanSearch",
    lifecycleStage: "Mount",
    kind: "Verification",
    backendRoute: "/api/v1/repogate",
    trustRequirement: "Repository access",
    mountState: "Available",
    proofStatus: "Not started",
  },
  {
    id: "build-blueprint",
    name: "Build Blueprint",
    description: "Turn structured intent into a reviewable implementation blueprint.",
    icon: "Workflow",
    lifecycleStage: "Blueprint",
    kind: "Compiler",
    backendRoute: "/api/v1/gpc",
    trustRequirement: "Workspace identity",
    mountState: "Available",
    proofStatus: "Not started",
  },
  {
    id: "security-audit",
    name: "Security Audit",
    description: "Review security events, controls, and unresolved risk signals.",
    icon: "ShieldCheck",
    lifecycleStage: "Govern",
    kind: "Governance",
    backendRoute: "/api/v1/security/events",
    trustRequirement: "Governance authority",
    mountState: "Available",
    proofStatus: "Not started",
  },
  {
    id: "api-discovery",
    name: "API Discovery",
    description: "Discover capability contracts without treating discovery as proof.",
    icon: "Radar",
    lifecycleStage: "Mount",
    kind: "Discovery",
    backendRoute: "/api/v1/capabilities",
    trustRequirement: "Read access",
    mountState: "Available",
    proofStatus: "Not started",
  },
  {
    id: "mcp-publish",
    name: "MCP Publish",
    description: "Prepare a capability for governed MCP registry publication.",
    icon: "Send",
    lifecycleStage: "Mount",
    kind: "Registry",
    backendRoute: "/api/v1/plugins",
    trustRequirement: "Publisher authority",
    mountState: "Available",
    proofStatus: "Not started",
  },
  {
    id: "capability-mount",
    name: "Capability Mount",
    description: "Resolve a capability, harness, contract, and evidence boundary.",
    icon: "PlugZap",
    lifecycleStage: "Mount",
    kind: "Runtime",
    backendRoute: "/api/v1/agents",
    trustRequirement: "Mount authority",
    mountState: "Available",
    proofStatus: "Not started",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    description: "The mounted blueprint workspace for intent and plan review.",
    icon: "FileCode2",
    lifecycleStage: "Blueprint",
    kind: "Workspace",
    backendRoute: "/os/blueprint",
    trustRequirement: "Workspace identity",
    mountState: "Mounted",
    proofStatus: "Present",
  },
  {
    id: "harness",
    name: "Harness",
    description: "A governed adapter boundary for capability execution.",
    icon: "Cable",
    lifecycleStage: "Mount",
    kind: "Workspace",
    backendRoute: "/os/mount",
    trustRequirement: "Mount authority",
    mountState: "Mounted",
    proofStatus: "Present",
  },
  {
    id: "evidence",
    name: "Evidence",
    description: "Review lineage, hashes, signatures, and replayable proof.",
    icon: "FileCheck2",
    lifecycleStage: "Evidence",
    kind: "Workspace",
    backendRoute: "/api/v1/ledger/events",
    trustRequirement: "Evidence access",
    mountState: "Mounted",
    proofStatus: "Present",
  },
  {
    id: "settlement",
    name: "Settlement",
    description: "Review payment requirements and settlement evidence.",
    icon: "ReceiptText",
    lifecycleStage: "Settle",
    kind: "Workspace",
    backendRoute: "/api/v1/x402/payment-required",
    trustRequirement: "Settlement authority",
    mountState: "Mounted",
    proofStatus: "Present",
  },
  {
    id: "tracker",
    name: "Tracker",
    description: "Compare approved intent, artifacts, runtime, and evidence for drift.",
    icon: "Route",
    lifecycleStage: "Tracker",
    kind: "Workspace",
    backendRoute: "/os/tracker",
    trustRequirement: "Audit access",
    mountState: "Mounted",
    proofStatus: "Present",
  },
];
