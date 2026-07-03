export interface Agent {
  id: string;
  name: string;
  ownerId: string;
  trustScore: number;
  successRate: number;
  status: 'active' | 'deactivated' | 'suspended' | 'archived';
  budgetLimit: number;
  budgetUsed: number;
  publicKey: string;
  anomalyCount: number;
  consecutiveAnomalies: number;
  category: 'system' | 'user' | 'service';
  framework: string;
  bio?: string;
  technicalSummary?: string;
}

export interface Capability {
  id: string;
  name: string;
  category: 'tool' | 'service' | 'database' | 'action';
  endpoint: string;
  description: string;
  cost: number; // in credits
  minTrust: number;
  requiresApproval: boolean;
  rateLimit: number; // requests/min
  inputSchema: string;
}

export interface PolicyRule {
  id: string;
  effect: 'allow' | 'deny';
  principal: string; // agent-id or '*'
  action: string; // capability-id or '*'
  trustMinimum: number;
  rateLimit: number;
  requiresApproval: boolean;
  approvalPath?: string;
}

export interface Policy {
  id: string;
  name: string;
  type: 'system' | 'owner' | 'runtime' | 'temporal';
  active: boolean;
  version: string;
  rules: PolicyRule[];
}

export interface Evidence {
  evidenceId: string;
  connectionId: string;
  previousHash: string;
  pglHash: string;
  timestamp: string;
  who: {
    agentId: string;
    agentName: string;
    publicKey: string;
    ownerId: string;
  };
  what: {
    capabilityId: string;
    capabilityName: string;
    action: string;
  };
  why: {
    policyApplied: string;
    policyVersion: string;
    authorizationProof: string;
  };
  how: {
    method: 'mcp' | 'http' | 'local';
    endpoint: string;
  };
  result: {
    status: 'authorized' | 'denied' | 'quarantined' | 'error';
    outputHash: string;
    executionTimeMs: number;
    outputSummary: string;
  };
  compliance: {
    regulatoryCategory: string;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    retentionPolicy: string;
  };
}

export interface PipelineStep {
  phase: number;
  name: string;
  subtitle: string;
  status: 'pending' | 'active' | 'success' | 'warning' | 'error';
  details: string[];
}

export interface SimulationResult {
  connectionId: string;
  agentId: string;
  capabilityId: string;
  status: 'authorized' | 'denied' | 'quarantined' | 'error';
  evidence?: Evidence;
  steps: PipelineStep[];
  anomaliesDetected: { type: string; severity: 'low' | 'medium' | 'high' | 'critical'; desc: string }[];
  quarantinedTicket?: QuarantinedTicket;
}

export interface QuarantinedTicket {
  ticketId: string;
  connectionId: string;
  agentId: string;
  agentName: string;
  capabilityId: string;
  capabilityName: string;
  timestamp: string;
  anomalies: string[];
  approvalsCollected: string[]; // approver ids who signed
  status: 'pending' | 'approved' | 'denied';
  inputArgs: Record<string, any>;
}
