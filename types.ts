export interface AgentTrustScore {
  performance: number; // 0-1
  behavioral: number;  // 0-1
  semantic: number;    // 0-1
  governance: number;  // 0-1
  social: number;      // 0-1
  totalScore: number;  // 0-5
}

export type TrustTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface RARAInvariant {
  class: 'structural' | 'semantic' | 'temporal';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface SpeculativePath {
  id: string;
  label: string;
  probability: number;
  status: 'active' | 'pruned';
  insight: string;
}

export interface QuantumTelemetry {
  zeno_cycles: number;
  leakage_rate: number;
  fidelity: number;
  vibration_1x?: number;
  vibration_2x?: number;
  carpet_noise?: number;
  timestamp?: string;
}

export interface MELTSignal {
  type: 'metric' | 'event' | 'log' | 'trace';
  layer: 'behavioral' | 'operational' | 'decision' | 'governance';
  message: string;
  metadata?: any;
}

export interface MCPConfigTool {
  enabled: boolean;
  params?: Record<string, any>;
}

export type MCPConfig = Record<string, MCPConfigTool>;

export interface OrchestrationResponse {
  plan_summary: string;
  speculative_paths: SpeculativePath[];
  quantum_telemetry: QuantumTelemetry;
  suggested_actions: string[];
  mcp_trace?: { tool: string; result: string }[];
}

export interface PGLGenome {
  hash: string;
  layers: {
    model: string;
    prompt: string;
    policy: string;
    watchtower: string;
    task_profile: string;
  };
  timestamp: string;
}

export interface PGLCertificate {
  id: string;
  genome_hash: string;
  issued_at: string;
  status: 'valid' | 'revoked' | 'expired';
}

export interface PGLNode {
  id: string;
  type: 'genome' | 'output' | 'delegation';
  label: string;
  relation?: 'DERIVED_FROM' | 'PRODUCED_BY' | 'DELEGATED_FROM';
  parentId?: string;
}

export interface EmissionPoint {
  year: number;
  value: number;
  label?: string;
}

export interface RegionalEmitter {
  name: string;
  volume: number; // MtCO2e
  percentage: number;
  perCapita?: number;
}

export type SEKEDDirective = 'HALT' | 'WAIT' | 'STABILIZE' | 'GRIND' | 'CLARIFY' | 'FORTIFY' | 'EXECUTE' | 'EXPAND' | 'SCALE BACK';

export interface SEKEDState {
  energy: number;       // E
  resilience: number;   // R
  confidence: number;   // C
  diversity: number;    // D
  stability: number;     // S
  directive: SEKEDDirective;
}

export interface UACPLayerStatus {
  layer: 'cognitive' | 'context' | 'execution' | 'hitl';
  status: 'active' | 'isolated' | 'idempotent' | 'pending';
  latency: number;
}

export interface BoundedMetrics {
  phi_ratio: number;
  carbon_intensity: number;
  utilization: number;
  water_risk: 'low' | 'moderate' | 'high';
}

export interface SecuritySurface {
  name: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  containment: number; // 0-1
  description: string;
}

export interface GatewayStatus {
  sanitization: 'active' | 'idle';
  redaction: 'active' | 'idle';
  auditing: 'active' | 'idle';
  egress_control: 'active' | 'idle';
  last_scan_result: 'clear' | 'threat_detected';
}

export interface IdentityGovernance {
  xaa_status: 'enforced' | 'pending' | 'bypass';
  jit_access: 'active' | 'inactive';
  secretless_mode: boolean;
  active_agents: number;
  shadow_ai_detected: number;
}

export interface RoadmapPhase {
  id: number;
  label: string;
  status: 'completed' | 'in-progress' | 'planned';
  description: string;
  target_threat: string;
}

export interface SSRNSignal {
  node: string;
  match_strength: number;
}

export interface ObservabilitySignal {
  name: string;
  state: 'RISING' | 'STABLE' | 'FALLING';
  value: number;
}

export interface OperationalHubMetrics {
  determinism_ratio: number;
  certainty_index: number;
  acceptable_noise: number;
  deterministic_entropy: number;
  latency: number;
  coherence: number;
  operational_plane_locked: boolean;
  active_agents_consensus: number;
  gopher_policy_status: 'ACTIVE' | 'VIOLATION' | 'PENDING';
  system_progress: number;
}

export type LLMProvider = 'google' | 'openai' | 'anthropic' | 'groq' | 'deepseek' | 'huggingface' | 'ollama' | 'serp';

export interface ProviderConfig {
  id: LLMProvider;
  name: string;
  enabled: boolean;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AgentWorkerStatus {
  id: number;
  role: string;
  status: 'idle' | 'assigned' | 'executing' | 'blocked';
  progress: number;
}

export interface AppState {
  isOrchestrating: boolean;
  currentTask: string | null;
  agentTaskForce: AgentWorkerStatus[];
  selectedProvider: LLMProvider;
  providerConfigs: ProviderConfig[];
  results: OrchestrationResponse | null;
  telemetry?: QuantumTelemetry;
  telemetryHistory: QuantumTelemetry[];
  orchestrationHistory: { id: string; timestamp: string; prompt: string; result: OrchestrationResponse }[];
  pglLedger: PGLNode[];
  currentGenome?: PGLGenome;
  emissionsData: EmissionPoint[];
  regionalEmitters: RegionalEmitter[];
  seked: SEKEDState;
  uacpLayers: UACPLayerStatus[];
  boundedScaling: BoundedMetrics;
  securitySurfaces: SecuritySurface[];
  mcpGateway: GatewayStatus;
  identityGov: IdentityGovernance;
  roadmap: RoadmapPhase[];
  hubMetrics: OperationalHubMetrics;
  ssrnSignals: SSRNSignal[];
  obsSignals: ObservabilitySignal[];
  logs: MELTSignal[];
  connectionStatus: 'idle' | 'linking' | 'connected' | 'error';
  lastError: string | null;
}

// ── RealTerminal types ──────────────────────────────────────────────────────
export type AgentStatus = 'Idle' | 'Active' | 'Blocked';

export interface AgentNode {
  id: string;
  name: string;
  role: 'Executor' | 'Validator' | 'Orchestrator' | 'Arbiter' | 'Router';
  department: 'Engineering' | 'Growth' | 'Ops' | 'Research' | 'Revenue';
  status: AgentStatus;
  mission: string;
  toolScopes: string[];
  metrics: { cpu: number; memory: number; latency: number; requestCount: number; };
  telemetryLogs: string[];
  x: number;
  y: number;
}

export type RunStatus = 'completed' | 'running' | 'failed' | 'queued';
export type SpineStep = 'Intent' | 'Plan' | 'ArbiterOS' | 'Redis Lua' | 'Attestation';

export interface VeklomRun {
  id: string;
  intent: string;
  status: RunStatus;
  timestamp: string;
  duration: string;
  currentStep: SpineStep;
  steps: { name: SpineStep; status: 'pending' | 'active' | 'completed' | 'failed'; hash?: string; details: string; }[];
  attestation: { seked: 'pending' | 'passed' | 'failed'; arbiter: 'pending' | 'passed' | 'failed'; converge: 'pending' | 'passed' | 'failed'; };
  evidenceCount: number;
  policyRule: string;
  policyStatus: 'passed' | 'warning' | 'violated';
  policyDetails: string;
  hash: string;
}

export interface Delegate {
  id: string;
  name: string;
  department: 'Engineering' | 'Growth' | 'Ops' | 'Research' | 'Revenue';
  weight: number;
  vote: 'yea' | 'nay' | 'abstain' | 'pending';
  lastAttestation: string;
  influence: number;
}

export interface TelemetryTick {
  timestamp: string;
  source: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}
export type HarnessProvider = 'ollama' | 'gemini' | 'claude' | 'codex' | 'cursor' | 'opencode' | 'devin' | 'antigravity';

export type SystemMode = 'production' | 'demo';

export type UserRole = 'admin' | 'architect' | 'auditor' | 'operator';

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
}

export interface SkillSpec {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'system' | 'code-gen' | 'security' | 'data-pipeline' | 'orchestration' | 'mcp-tool';
  author: string;
  hash: string; // SHA-256
  signature: string;
  provenanceSigner: string;
  permissions: string[];
  parameters: SkillParameter[];
  eucCompatible: boolean;
  eccCompatible?: boolean;
  reputationScore: number; // 0 - 100
  codeSnippet?: string;
  updatedAt: string;
}

export interface CAPIInvocationRequest {
  skillId: string;
  harness: HarnessProvider;
  parameters: Record<string, any>;
  humanRequester: string;
  mode: SystemMode;
  byokKey?: string;
  customModel?: string;
  ollamaEndpoint?: string;
  containsPii?: boolean;
  quebecLaw25Compliance?: boolean;
  x402Token?: string;
}

export interface X402Offer {
  status: 402;
  message: 'Payment Required for Capability Execution';
  skillId: string;
  priceUsdc: number;
  priceMicros: number;
  destinationWallet: string;
  ttlSeconds: number;
  rarScopes: {
    actions: string[];
    resources: string[];
    leaseType: 'EVAPORATING_TIME_LEASE' | 'COUNT_BOUND_LEASE';
    maxInvocations: number;
  };
  bondingCurveMetrics: {
    basePrice: number;
    concurrentAgentsDemand: number;
    resourceLoadPercent: number;
    calculatedPriceUsdc: number;
  };
  revenueSplitUsdc: {
    nodeOperatorAlpha: number; // 70%
    veklomProtocolBeta: number; // 15%
    eccCreatorRoyaltyGamma: number; // 15%
  };
  settlementOptions: {
    solanaPayUrl: string;
    basePayUrl: string;
    httpSignatureSupport: boolean;
  };
  timestamp: string;
}

export interface EvaporatingCapabilityLease {
  leaseId: string;
  skillId: string;
  token: string;
  agentIdentity: string;
  humanOwner: string;
  issuedAt: string;
  expiresAt: string;
  remainingSeconds: number;
  invocationsRemaining: number;
  maxInvocations: number;
  pricePaidUsdc: number;
  rarGrantScope: string;
  status: 'ACTIVE' | 'EXPIRED_EVAPORATED' | 'EVICTED';
}

export interface PGLCertificate {
  certId: string;
  merkleRoot: string;
  blockIndex: number;
  prevBlockHash: string;
  signerPublicKey: string;
  humanRequester: string;
  executionIdentityToken: string;
  nonRepudiableHash: string;
  timestamp: string;
  verifierSignature: string;
}

export interface VNPMetrics {
  latencyMs: number;
  throughputTps: number;
  ttftMs: number;
  cpuUsagePct: number;
  memUsageMb: number;
  costMicros: number;
  region: string;
  vnpNodeId: string;
}

export interface CAPIInvocationResponse {
  executionId: string;
  skillId: string;
  harness: HarnessProvider;
  status: 'SUCCESS' | 'FAILED' | 'SANDBOX_BLOCKED';
  eiToken: string;
  pglCertificate: PGLCertificate;
  vnpMetrics: VNPMetrics;
  rawPromptTranslation: string;
  adapterBridgeLogs: string[];
  semanticDeviationIndex: number; // e.g., 0.04 (4% divergence, well within < 0.15 gate threshold)
  sdiThreshold: number; // e.g., 0.15
  output: any;
  timestamp: string;
  isDemo: boolean;
}

export interface AbideStep {
  stepId: string;
  title: string;
  capabilityRequired: string;
  harnessRecommendation: HarnessProvider;
  dependencies: string[];
  confidenceScore: number;
  subtasks: string[];
}

export interface AbideBlueprint {
  blueprintId: string;
  rawIntent: string;
  compiledSteps: AbideStep[];
  einsteinProbabilityScore: number; // e.g. 0.984 (98.4%)
  ssrnAcademicValidator: {
    paperRef: string;
    doi: string;
    validationStatus: 'VERIFIED_ACADEMIC_PROOF' | 'EMPIRICAL_STRONG';
  };
  x402Settlement: {
    settlementTx: string;
    amountMicroTokens: number;
    currency: string;
    status: 'SETTLED' | 'PENDING';
  };
  timestamp: string;
}

export interface OllamaStatus {
  connected: boolean;
  endpoint: string;
  availableModels: string[];
  activeModel?: string;
  latencyMs: number;
  error?: string;
}

export interface ContainerNodeHealth {
  nodeId: string;
  nodeName: string;
  containerId: string;
  serviceName: string;
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  cpuPercent: number;
  memoryUsedMb: number;
  memoryLimitMb: number;
  uptimeSec: number;
  region: string;
  ipAddress: string;
  lastPing: string;
}

export interface RBACPolicy {
  role: UserRole;
  allowedCapabilities: string[];
  canExecuteDemo: boolean;
  canExecuteProduction: boolean;
  canManageKeys: boolean;
  canApproveBlueprints: boolean;
  maxDailyInvocations: number;
}

export interface SecurityScanResult {
  skillId: string;
  passed: boolean;
  threatLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  astVulnerabilities: string[];
  secretLeaksFound: number;
  sandboxedExecutionOk: boolean;
  repoGateSignature: string;
  timestamp: string;
}
