export type SubstrateNodeType = 'local_k8s' | 'aws_edge' | 'azure_sovereign' | 'rf_microcontroller';

export interface SubstrateNode {
  id: string;
  name: string;
  type: SubstrateNodeType;
  region: string;
  localityBoundary: string; // e.g. 'Enclave Alpha (US-East)', 'National Data Center', 'Factory Edge RF'
  status: 'online' | 'degraded' | 'offline';
  latencyMs: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  activeWorkloads: number;
  isSovereign: boolean;
  mcpEnabled: boolean;
  supportedCapabilities: string[];
}

export interface CAPPOGrant {
  grantId: string;
  subject: string;
  allowedCapabilities: string[];
  expiresAt: number;
  signature: string;
  isRevoked: boolean;
}

export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  category: 'compute' | 'data_persistence' | 'edge_rf' | 'agent_recursion' | 'mcp_bridge';
  requiredRole: string;
  schemaJson: string;
}

export interface HRMRRouteRequest {
  capabilityId: string;
  cappoGrantId?: string;
  preferredNodeId?: string;
  payload: Record<string, unknown>;
  force503NodeId?: string; // Simulator helper to trigger 503 on a specific node
  invalidCappo?: boolean; // Simulator helper to trigger 403 terminal
}

export interface RouteTraceStep {
  step: number;
  timestamp: string;
  layer: string;
  nodeId?: string;
  nodeName?: string;
  status: 'PENDING' | 'SUCCESS' | 'TERMINAL_403' | 'FALLBACK_503' | 'EXECUTED';
  detail: string;
}

export interface HRMRRouteResult {
  transactionId: string;
  capabilityId: string;
  requestedNodeId: string;
  executedNodeId?: string;
  finalHttpStatus: 200 | 403 | 503 | 500;
  authorityDecision: 'GRANTED' | 'DENIED_TERMINAL';
  executionStatus: 'SUCCESS' | 'REROUTED_FALLBACK' | 'FAILED';
  executionTimeMs: number;
  pglProofHash?: string;
  x402SettlementGas?: number;
  trace: RouteTraceStep[];
  outputData?: Record<string, unknown>;
}

export interface PGLRecord {
  id: string;
  timestamp: string;
  transactionId: string;
  capabilityId: string;
  cappoGrantId: string;
  executedNodeId: string;
  requestPayloadHash: string;
  responseHash: string;
  pglSignature: string;
  x402GasSettled: number;
  verifiable: boolean;
}

export interface AgentTask {
  id: string;
  name: string;
  status: 'IDLE' | 'EVALUATING' | 'EXECUTING' | 'RECURSING' | 'COMPLETED';
  capabilitiesUsed: string[];
  recursionDepth: number;
  maxRecursionDepth: number;
  lastOptimizedAt?: string;
  logs: string[];
  metrics: {
    opsPerSec: number;
    tasksDriven: number;
    successRatePct: number;
  };
}

export interface PluginModule {
  id: string;
  name: string;
  category: 'Cloud Adapter' | 'Protocol Extension' | 'Security / Audit' | 'Hardware Connector';
  version: string;
  enabled: boolean;
  description: string;
  author: string;
  downloads: number;
  activeCapabilityId: string;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  capabilityBinding: string;
}

// Federation Provider Interface (FPI) Types
export type FPIProviderStatus = 'active' | 'degraded' | 'suspended' | 'registering';

export interface FPIProviderPricing {
  pricePerComputeUnitVEK: number;
  spotDiscountPct: number;
  currency: 'VEK';
}

export interface FPIProviderQuota {
  totalAllocatedUnits: number;
  usedUnits: number;
  maxCapacityUnits: number;
}

export interface FPIProvider {
  id: string;
  providerName: string;
  providerType: 'hyperscaler' | 'sovereign_enclave' | 'decentralized_mesh' | 'edge_telecom';
  endpointUrl: string;
  authKeyHash: string;
  regions: string[];
  status: FPIProviderStatus;
  slaUptimePct: number;
  maxLatencyMs: number;
  isSovereignEnclave: boolean;
  supportedCapabilities: string[];
  pricing: FPIProviderPricing;
  quota: FPIProviderQuota;
  registeredAt: string;
  lastHeartbeatAt: string;
}

export interface FPIResourceAllocation {
  id: string;
  providerId: string;
  providerName: string;
  granteeSubject: string;
  computeUnits: number;
  memoryGb: number;
  gpuCores: number;
  allocationType: 'reserved' | 'spot' | 'on_demand';
  status: 'active' | 'expired' | 'deallocated';
  leaseDurationMinutes: number;
  createdAt: string;
  expiresAt: string;
  x402TotalLeaseCostVEK: number;
}

export interface FPIExecutionJob {
  id: string;
  providerId: string;
  providerName: string;
  capabilityId: string;
  cappoGrantId: string;
  status: 'queued' | 'executing' | 'completed' | 'failed' | 'fallback_rerouted';
  executionTimeMs: number;
  x402GasSettled: number;
  pglProofSignature: string;
  submittedAt: string;
  completedAt?: string;
  outputSummary: string;
  logs: string[];
}

export interface FPIBillingSettlement {
  id: string;
  providerId: string;
  providerName: string;
  period: string;
  jobsExecuted: number;
  totalComputeUnitsUsed: number;
  totalx402EarnedVEK: number;
  payoutStatus: 'settled' | 'pending' | 'processing';
  payoutTxHash: string;
  timestamp: string;
}

export interface FPIDiscoveryQuery {
  capabilityId?: string;
  region?: string;
  maxLatencyMs?: number;
  isSovereignRequired?: boolean;
  maxPricePerUnitVEK?: number;
  minUptimePct?: number;
}

