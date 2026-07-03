import { Agent, Capability, Policy, Evidence, PipelineStep, SimulationResult, QuarantinedTicket } from './types';

// Initial Mock Capabilities
export const INITIAL_CAPABILITIES: Capability[] = [
  {
    id: 'search',
    name: 'SearchTool',
    category: 'tool',
    endpoint: 'mcp://web-search-provider/search',
    description: 'Queries internet engines for vetted regulatory compliance documentation.',
    cost: 5,
    minTrust: 40,
    requiresApproval: false,
    rateLimit: 30,
    inputSchema: '{"query": "string"}'
  },
  {
    id: 'db-read',
    name: 'DatabaseReader',
    category: 'database',
    endpoint: 'mcp://core-db/read',
    description: 'Retrieves active patient record logs or policy conditions under strict encryption.',
    cost: 8,
    minTrust: 50,
    requiresApproval: false,
    rateLimit: 60,
    inputSchema: '{"table": "string", "filter": "object"}'
  },
  {
    id: 'db-delete',
    name: 'DatabaseDeleter',
    category: 'database',
    endpoint: 'mcp://core-db/delete',
    description: 'Performs cascading record truncation on obsolete operational datasets.',
    cost: 50,
    minTrust: 75,
    requiresApproval: true,
    rateLimit: 5,
    inputSchema: '{"recordId": "string", "confirm": "boolean"}'
  },
  {
    id: 'payout-trigger',
    name: 'PayoutDistributor',
    category: 'action',
    endpoint: 'http://payments.veklom.internal/payout',
    description: 'Authorizes financial credits or smart-contract dividends to end client wallets.',
    cost: 200,
    minTrust: 85,
    requiresApproval: true,
    rateLimit: 2,
    inputSchema: '{"amountUsd": "number", "recipientAddress": "string"}'
  }
];

// Initial Agents
export const INITIAL_AGENTS: Agent[] = [
  {
    id: 'agent-researcher',
    name: 'ComplianceResearcher',
    ownerId: 'owner-kate',
    trustScore: 85,
    successRate: 0.98,
    status: 'active',
    budgetLimit: 500,
    budgetUsed: 120,
    publicKey: 'ed25519_pub_e942f10283bd74efcda',
    anomalyCount: 0,
    consecutiveAnomalies: 0,
    category: 'service',
    framework: 'Veklom Frame v1.2'
  },
  {
    id: 'agent-db-sync',
    name: 'SynclonObsoleteAgent',
    ownerId: 'owner-system',
    trustScore: 62,
    successRate: 0.88,
    status: 'active',
    budgetLimit: 1000,
    budgetUsed: 980, // almost used up!
    publicKey: 'ed25519_pub_ff2084bce12040d9981',
    anomalyCount: 1,
    consecutiveAnomalies: 1,
    category: 'system',
    framework: 'Veklom Daemon v2.0'
  },
  {
    id: 'agent-untrusted',
    name: 'ExoExperimentAgent',
    ownerId: 'owner-thirdparty',
    trustScore: 35, // low trust
    successRate: 0.72,
    status: 'active',
    budgetLimit: 150,
    budgetUsed: 20,
    publicKey: 'ed25519_pub_ab0911fe7703e230a10',
    anomalyCount: 4,
    consecutiveAnomalies: 4,
    category: 'user',
    framework: 'LangChain-Native Bridge'
  }
];

// Composed governance policies (Evaluation hierarchy: System -> Owner -> Runtime)
export const INITIAL_POLICIES: Policy[] = [
  {
    id: 'sys-policy-01',
    name: 'Veklom Sovereign System Protection Policy',
    type: 'system',
    version: '2.0.0',
    active: true,
    rules: [
      {
        id: 'rule-sys-payout',
        effect: 'allow',
        principal: 'agent-researcher',
        action: 'payout-trigger',
        trustMinimum: 80,
        rateLimit: 2,
        requiresApproval: true,
        approvalPath: 'Quorum Governance Board'
      },
      {
        id: 'rule-sys-anti-destruction',
        effect: 'deny',
        principal: 'agent-untrusted',
        action: 'db-delete',
        trustMinimum: 90,
        rateLimit: 0,
        requiresApproval: true
      }
    ]
  },
  {
    id: 'owner-policy-kate',
    name: 'Owner Policy (Kate - Research Division)',
    type: 'owner',
    version: '1.2.5',
    active: true,
    rules: [
      {
        id: 'rule-own-allow-search',
        effect: 'allow',
        principal: 'agent-researcher',
        action: 'search',
        trustMinimum: 40,
        rateLimit: 50,
        requiresApproval: false
      },
      {
        id: 'rule-own-allow-db',
        effect: 'allow',
        principal: 'agent-researcher',
        action: 'db-read',
        trustMinimum: 50,
        rateLimit: 20,
        requiresApproval: false
      }
    ]
  },
  {
    id: 'runtime-policy-ops',
    name: 'Veklom Operations General Policy',
    type: 'runtime',
    version: '2.0.0',
    active: true,
    rules: [
      {
        id: 'rule-run-generic',
        effect: 'allow',
        principal: '*',
        action: 'search',
        trustMinimum: 45,
        rateLimit: 10,
        requiresApproval: false
      }
    ]
  }
];

// Helper to simulate short cryptographic hashing
export function calculateSHA256(content: string): string {
  // Simple deterministic pseudo-hash for UI display
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return 'pgl_sha256_' + Math.abs(hash).toString(16).padEnd(8, '45f3') + '_ec4';
}

// Initial Immutable Ledger History (3 initial chained blocks)
export const INITIAL_LEDGER: Evidence[] = [
  {
    evidenceId: 'ev-initial-01',
    connectionId: 'conn-fb52-001',
    previousHash: 'pgl_genesis_block_000000000000_ec4',
    pglHash: 'pgl_sha256_e109dfbc8820_ec4',
    timestamp: '2026-06-16T12:00:00-07:00',
    who: {
      agentId: 'agent-researcher',
      agentName: 'ComplianceResearcher',
      publicKey: 'ed25519_pub_e942f10283bd74efcda',
      ownerId: 'owner-kate'
    },
    what: {
      capabilityId: 'search',
      capabilityName: 'SearchTool',
      action: 'execute'
    },
    why: {
      policyApplied: 'owner-policy-kate',
      policyVersion: '1.2.5',
      authorizationProof: 'signature_ok_verifiable'
    },
    how: {
      method: 'mcp',
      endpoint: 'mcp://web-search-provider/search'
    },
    result: {
      status: 'authorized',
      outputHash: 'hash_result_9921ef45',
      executionTimeMs: 45,
      outputSummary: 'Successfully completed searching EU AI Act enforcement directives.'
    },
    compliance: {
      regulatoryCategory: 'EU AI Act Compliance (Art 23)',
      dataClassification: 'public',
      retentionPolicy: 'Retention level: 7 Years'
    }
  },
  {
    evidenceId: 'ev-initial-02',
    connectionId: 'conn-cc10-002',
    previousHash: 'pgl_sha256_e109dfbc8820_ec4',
    pglHash: 'pgl_sha256_c23a1099fe42_ec4',
    timestamp: '2026-06-16T13:45:00-07:00',
    who: {
      agentId: 'agent-researcher',
      agentName: 'ComplianceResearcher',
      publicKey: 'ed25519_pub_e942f10283bd74efcda',
      ownerId: 'owner-kate'
    },
    what: {
      capabilityId: 'db-read',
      capabilityName: 'DatabaseReader',
      action: 'read_logs'
    },
    why: {
      policyApplied: 'owner-policy-kate',
      policyVersion: '1.2.5',
      authorizationProof: 'signature_ok_verifiable'
    },
    how: {
      method: 'mcp',
      endpoint: 'mcp://core-db/read'
    },
    result: {
      status: 'authorized',
      outputHash: 'hash_result_14b22f99',
      executionTimeMs: 82,
      outputSummary: 'Scanned obss_data_table for regulatory validation hashes.'
    },
    compliance: {
      regulatoryCategory: 'HIPAA Auditable Scope',
      dataClassification: 'internal',
      retentionPolicy: 'Retention level: 7 Years'
    }
  }
];

export interface ScenarioProfile {
  id: string;
  name: string;
  description: string;
  tags: string[];
  agentId: string;
  capabilityId: string;
  input: Record<string, any>;
  customCheck?: (req: any, prevLedgerHash: string) => SimulationResult;
}

// Preset interactive demonstration profiles mapping to 5 compliance vectors
export const PRESET_SCENARIOS: ScenarioProfile[] = [
  {
    id: 'scen-standard',
    name: '1. Compliant Regulatory Query',
    description: 'High-trust Researcher agent requests basic internet query using standard parameters.',
    tags: ['Compliant', 'Auto-Approve', 'Zero-Anomaly'],
    agentId: 'agent-researcher',
    capabilityId: 'search',
    input: { query: 'EU AI Act Article 56 governance audit checklist' },
    customCheck: (req, prevLedgerHash) => {
      const connId = 'conn_scen_' + Math.floor(Math.random() * 1000000);
      const evId = 'ev_' + Math.floor(Math.random() * 89999 + 10000);
      const curTime = new Date().toISOString();
      const outputTxt = 'Extracted 12 mandatory rules from Section 56 of EU AI Act.';
      const outputHash = calculateSHA256(outputTxt);

      const generatedEvidence: Evidence = {
        evidenceId: evId,
        connectionId: connId,
        previousHash: prevLedgerHash,
        pglHash: '', // computed in live processor
        timestamp: curTime,
        who: {
          agentId: 'agent-researcher',
          agentName: 'ComplianceResearcher',
          publicKey: 'ed25519_pub_e942f10283bd74efcda',
          ownerId: 'owner-kate'
        },
        what: {
          capabilityId: 'search',
          capabilityName: 'SearchTool',
          action: 'execute'
        },
        why: {
          policyApplied: 'owner-policy-kate',
          policyVersion: '1.2.5',
          authorizationProof: 'signed_by_kate_cert'
        },
        how: {
          method: 'mcp',
          endpoint: 'mcp://web-search-provider/search'
        },
        result: {
          status: 'authorized',
          outputHash: outputHash,
          executionTimeMs: 140,
          outputSummary: outputTxt
        },
        compliance: {
          regulatoryCategory: 'General AI Audit Protocol',
          dataClassification: 'public',
          retentionPolicy: 'Standard Governance Track: 7 Years'
        }
      };
      generatedEvidence.pglHash = calculateSHA256(JSON.stringify(generatedEvidence));

      const steps: PipelineStep[] = [
        {
          phase: 1,
          name: 'Identity & Security',
          subtitle: 'Active credential verification',
          status: 'success',
          details: [
            'Verifying Agent ID [agent-researcher] against Veklom directory registry.',
            'Signature verified autonomously via cryptographic active key: verified Ed25519.',
            'No replay attack indicators detected. Unique nonce challenge matches cache.'
          ]
        },
        {
          phase: 2,
          name: 'Capability & Policy Composition',
          subtitle: 'Evaluate multi-policy hierarchies',
          status: 'success',
          details: [
            'Loaded capability: [search] (SearchTool, mcp endpoint).',
            'Sovereign policies scanned across 3 layers: System -> Owner (Kate Group) -> Runtime Operations.',
            'Identified matching policy rule: rule-own-allow-search.',
            'Computed Effective Permissions: ALLOW request with 0 restrictions.'
          ]
        },
        {
          phase: 3,
          name: 'Safety & Anomaly Detection',
          subtitle: 'Predict and mitigate behaviors',
          status: 'success',
          details: [
            'Compared transaction with 30-day baseline tracker (Query type frequency: 12 req/day - very baseline).',
            'Threat anomaly score checked: deviation rating at 0.12 (Extremely normal).',
            'Result: Green (Passed - No quarantine or containment needed).'
          ]
        },
        {
          phase: 4,
          name: 'Cost & Budget Verification',
          subtitle: 'Verify financial footprint limits',
          status: 'success',
          details: [
            'Search credit expense: 5 credits.',
            'Checking balance: agent budget is 500. Currently used: 120. Remaining capacity is 380.',
            'Credits approved safely.'
          ]
        },
        {
          phase: 5,
          name: 'Approval Workflows',
          subtitle: 'Quorum signatures gatekeeper',
          status: 'success',
          details: [
            'Requires human intervention flag is set to [FALSE].',
            'No secondary verification triggered. Forwarding package to execution queue.'
          ]
        },
        {
          phase: 6,
          name: 'Execution',
          subtitle: 'Connect capability layer',
          status: 'success',
          details: [
            'Routing payload to: mcp://web-search-provider/search.',
            'Vite-reverse proxy routed packet on Port 3000.',
            'Execution response status: OK.',
            'Time payload duration: 140ms.'
          ]
        },
        {
          phase: 7,
          name: 'Evidence & Proof Generator',
          subtitle: 'Build PGL block integrity',
          status: 'success',
          details: [
            'Compiling immutable interaction snapshot.',
            `Chaining previous hash index: [${prevLedgerHash.substring(0, 15)}...]`,
            `Autonomously computed evidence block proof hash: [${generatedEvidence.pglHash.substring(0, 15)}...]`
          ]
        },
        {
          phase: 8,
          name: 'Audit & Compliance Registration',
          subtitle: 'Ledger publication pipelines',
          status: 'success',
          details: [
            'Committing evidence package safely to external PGL Endpoint.',
            'Registering transaction to Gnom ledger registry.',
            'Updating Agent Trust Score: added +2 reward points to trust rating.'
          ]
        },
        {
          phase: 9,
          name: 'Response Packaging',
          subtitle: 'Produce secure output',
          status: 'success',
          details: [
            'Formulating full compliance envelope.',
            `Success payload verified. Evidence verification hash: ${generatedEvidence.pglHash}`
          ]
        }
      ];

      return {
        connectionId: connId,
        agentId: 'agent-researcher',
        capabilityId: 'search',
        status: 'authorized',
        evidence: generatedEvidence,
        steps: steps,
        anomaliesDetected: []
      };
    }
  },
  {
    id: 'scen-quarantine',
    name: '2. Suspicious DB Delete (Quarantined)',
    description: 'An obsolete sync daemon executes cascading truncations at 3:00 AM, triggering budget pressure and anomaly containment.',
    tags: ['Anomalous', 'Off-Hours', 'Requires-Quorum'],
    agentId: 'agent-db-sync',
    capabilityId: 'db-delete',
    input: { recordId: 'audit_archive_2020', confirm: true },
    customCheck: (req, prevLedgerHash) => {
      const connId = 'conn_scen_' + Math.floor(Math.random() * 1000000);
      const curTime = new Date().toISOString();

      const ticket: QuarantinedTicket = {
        ticketId: 'ticket_' + Math.floor(Math.random() * 899 + 100),
        connectionId: connId,
        agentId: 'agent-db-sync',
        agentName: 'SynclonObsoleteAgent',
        capabilityId: 'db-delete',
        capabilityName: 'DatabaseDeleter',
        timestamp: curTime,
        anomalies: [
          'High Sensitivity Action (DB cascading truncation requested)',
          'Temporary anomaly: Triggered outside core standard operating timeframe (3:00 AM)',
          'Budget alert: Daemon has depleted 98% of credit allocations (Used 980 of 1000 credits)'
        ],
        approvalsCollected: [],
        status: 'pending',
        inputArgs: { recordId: 'audit_archive_2020', confirm: true }
      };

      const steps: PipelineStep[] = [
        {
          phase: 1,
          name: 'Identity & Security',
          subtitle: 'Active credential verification',
          status: 'success',
          details: [
            'Verifying Agent ID [agent-db-sync] on Veklom directory.',
            'Ed25519 signature verified successfully (Verification Key checked: valid).',
            'No transaction replay detected.'
          ]
        },
        {
          phase: 2,
          name: 'Capability & Policy Composition',
          subtitle: 'Evaluate multi-policy hierarchies',
          status: 'warning',
          details: [
            'Loaded capability: [db-delete] (Cascaing Truncation, requires elevated authorization).',
            'Scan results: System Policies matched general allowance with restriction rule-sys-anti-destruction.',
            'Policy restriction found: Action requires human QUORUM (RequiresApproval marked TRUE during off-hours).'
          ]
        },
        {
          phase: 3,
          name: 'Safety & Anomaly Detection',
          subtitle: 'Predict and mitigate behaviors',
          status: 'error',
          details: [
            'Anomalies Detected: Request execution occurs outside learned time constraints (3:00 AM standard local).',
            'Behavioral baseline alert: DB write/delete constitutes less than 1% of this agent\'s past active logs.',
            'Anomaly Threat Score: 4.8 / 10.0 (High Risk).',
            'CRITICAL PROTOCOL TRIGGER: Auto-suppressed Agent Trust rating by -15 points.',
            'CRITICAL PROTOCOL TRIGGER: Request QUARANTINED. Holding execution for secondary human quorum evaluation.'
          ]
        },
        {
          phase: 4,
          name: 'Cost & Budget Verification',
          subtitle: 'Verify financial footprint limits',
          status: 'warning',
          details: [
            'Cascading delete computational charge: 50 credits.',
            'Remaining balance warning: Agent budget status is critical (Used: 980, Maximum: 1000).',
            'Budget overflow flagged: Adding this transaction pushes daemon budget into overdraft (1030 credits total).',
            'Budget status: Overdraft allowed purely on secure quorum approval.'
          ]
        },
        {
          phase: 5,
          name: 'Approval Workflows',
          subtitle: 'Quorum signatures gatekeeper',
          status: 'warning',
          details: [
            'Compiling Quarantine Ticket: Created ticket ID: ' + ticket.ticketId,
            'Quorum policy triggers: Requires two independent human authorization signatures (2-of-3 approvers needed).',
            'Escalation path directed to: Board Approvers [Admin Kate, System Root, Admin Dave].',
            'Execution Pipeline State: SUSPENDED. Halting pipeline execution until quorum consensus is formed.'
          ]
        },
        {
          phase: 6,
          name: 'Execution',
          subtitle: 'Connect capability layer',
          status: 'pending',
          details: [
            'State: Held in Quarantine Queue.',
            'Awaiting approval signatures before physical tool invocation is spawned.'
          ]
        },
        {
          phase: 7,
          name: 'Evidence & Proof Generator',
          subtitle: 'Build PGL block integrity',
          status: 'pending',
          details: [
            'Chaining suspended. Partial transaction snapshot registered under quarantine status.'
          ]
        },
        {
          phase: 8,
          name: 'Audit & Compliance Registration',
          subtitle: 'Ledger publication pipelines',
          status: 'pending',
          details: [
            'Flagged ongoing quarantine ticket to monitoring services.',
            'Trust score decay trigger issued.'
          ]
        },
        {
          phase: 9,
          name: 'Response Packaging',
          subtitle: 'Produce secure output',
          status: 'warning',
          details: [
            'Sending Response status: [403 QUARANTINED - Verification Required].',
            'Containment active. System and data buffers protected safely.'
          ]
        }
      ];

      return {
        connectionId: connId,
        agentId: 'agent-db-sync',
        capabilityId: 'db-delete',
        status: 'quarantined',
        steps: steps,
        anomaliesDetected: [
          { type: 'Action Anomaly', severity: 'high', desc: 'Cascading deletion is highly unusual for Synclon daemon' },
          { type: 'Temporal Anomaly', severity: 'medium', desc: 'Active transactional instruction received at 3:00 AM' },
          { type: 'Budget Threat', severity: 'medium', desc: 'Exceeds standard 1000 credit boundary limit' }
        ],
        quarantinedTicket: ticket
      };
    }
  },
  {
    id: 'scen-replay',
    name: '3. Cryptographic Replay Attack Blocked',
    description: 'A malicious interceptor attempts to replay a previously registered authentic signature to bypass safety layers.',
    tags: ['Security-Threat', 'Replay-Blocked', 'Auto-Deny'],
    agentId: 'agent-untrusted',
    capabilityId: 'search',
    input: { query: 'Obtain critical payload records' },
    customCheck: (req, prevLedgerHash) => {
      const connId = 'conn_replay_' + Math.floor(Math.random() * 1000000);

      const steps: PipelineStep[] = [
        {
          phase: 1,
          name: 'Identity & Security',
          subtitle: 'Active credential verification',
          status: 'error',
          details: [
            'Verifying Agent ID [agent-untrusted] on directory: found.',
            'Verifying cryptononce signature challenge...',
            'CRITICAL SECURITY EXPLOIT KNOWN: Unique transaction nonce [once_used_9a8cfb4e231] is already locked in historical index.',
            'CRITICAL CONSTRAINTS: Signature timestamp skew: payload delay of 1800s exceeded core 60s tolerance window.',
            'EXPLOIT STATUS: Replay Attack confirmed. Intercepted session reuse blocked.',
            'DEACTIVATED THREAT PROCESS: Trust score suppressed immediately by -20 points.'
          ]
        },
        {
          phase: 2,
          name: 'Capability & Policy Composition',
          subtitle: 'Evaluate multi-policy hierarchies',
          status: 'pending',
          details: [
            'Pipeline terminated during security verification checks.'
          ]
        }
      ];

      // Fill remaining steps as pending/blocked
      for (let p = 3; p <= 9; p++) {
        steps.push({
          phase: p,
          name: INITIAL_CAPABILITIES[0] ? 'Phase ' + p : 'Step',
          subtitle: 'Pipeline Blocked',
          status: 'pending',
          details: ['Execution blocked due to security failure in Phase 1.']
        });
      }

      return {
        connectionId: connId,
        agentId: 'agent-untrusted',
        capabilityId: 'search',
        status: 'denied',
        steps: steps,
        anomaliesDetected: [
          { type: 'Replay Attempt', severity: 'critical', desc: 'Reused cryptographic once-nonce challenge of active block' },
          { type: 'Identity Distortion', severity: 'high', desc: 'Skewed timestamp signature validation error' }
        ]
      };
    }
  },
  {
    id: 'scen-budget',
    name: '4. Budget Constraint Denied',
    description: 'An active query agent attempts to request expensive resources that strictly overflow remaining allocated quota.',
    tags: ['Budget-Exceeded', 'Blocked'],
    agentId: 'agent-db-sync',
    capabilityId: 'payout-trigger',
    input: { amountUsd: 1500, recipientAddress: '0x992ff' },
    customCheck: (req, prevLedgerHash) => {
      const connId = 'conn_budget_' + Math.floor(Math.random() * 1000000);

      const steps: PipelineStep[] = [
        {
          phase: 1,
          name: 'Identity & Security',
          subtitle: 'Active credential verification',
          status: 'success',
          details: [
            'Verifying Agent ID [agent-db-sync] on Veklom directory: Found.',
            'Ed25519 signature validated successfully.',
            'Nonce challenge: verified.'
          ]
        },
        {
          phase: 2,
          name: 'Capability & Policy Composition',
          subtitle: 'Evaluate multi-policy hierarchies',
          status: 'success',
          details: [
            'Loaded capability: [payout-trigger] (Financial distribution action).',
            'Evaluating allowance policies: found system rules [rule-sys-payout]. Policy states payout is ALLOWED under strict quorum criteria.'
          ]
        },
        {
          phase: 3,
          name: 'Safety & Anomaly Detection',
          subtitle: 'Predict and mitigate behaviors',
          status: 'success',
          details: [
            'Financial transfer baseline reviewed: normal transaction for system sync daemons.'
          ]
        },
        {
          phase: 4,
          name: 'Cost & Budget Verification',
          subtitle: 'Verify financial footprint limits',
          status: 'error',
          details: [
            'Required transactional charge: 200 expense credits.',
            'Checking balance status of SynclonDaemon:',
            'Allocation: Limit: 1000. Used to date: 980. Remaining quota balance is 20 credits.',
            'INSUFFICIENT FUNDS STATUS: Requested operation cost is 200, but only 20 remaining credits are uncommitted.',
            'POLICIES BLOCK: Zero-overdraft tolerance enforced. Hard block triggered on Phase 4.',
            'Agent trust rating penalized by -5 penalty points.'
          ]
        },
        {
          phase: 5,
          name: 'Approval Workflows',
          subtitle: 'Quorum signatures gatekeeper',
          status: 'pending',
          details: [
            'System budget block terminates workflow.'
          ]
        }
      ];

      for (let p = 6; p <= 9; p++) {
        steps.push({
          phase: p,
          name: 'Pipeline Phase ' + p,
          subtitle: 'Blocked',
          status: 'pending',
          details: ['Workflow halted at Phase 4 due to insufficient budget limits.']
        });
      }

      return {
        connectionId: connId,
        agentId: 'agent-db-sync',
        capabilityId: 'payout-trigger',
        status: 'denied',
        steps: steps,
        anomaliesDetected: [
          { type: 'Resource Exhaustion', severity: 'medium', desc: 'Exceeded maximum allowable monthly operating credit capacity.' }
        ]
      };
    }
  },
  {
    id: 'scen-delegated',
    name: '5. Governed Multi-Hop Delegation',
    description: 'Verify delegation chains to prove lineage and prevent unauthorized authorization escalations.',
    tags: ['Multi-Hop', 'Lineage-Check', 'Compliant'],
    agentId: 'agent-researcher',
    capabilityId: 'db-read',
    input: { table: 'obss_regulatory_compliance', filter: { country: 'IE' } },
    customCheck: (req, prevLedgerHash) => {
      const connId = 'conn_scen_' + Math.floor(Math.random() * 1000000);
      const evId = 'ev_' + Math.floor(Math.random() * 89999 + 10000);
      const curTime = new Date().toISOString();
      const outputTxt = 'Retrieved 8 regulatory hashes with Ireland jurisdiction (IE).';
      const outputHash = calculateSHA256(outputTxt);

      const generatedEvidence: Evidence = {
        evidenceId: evId,
        connectionId: connId,
        previousHash: prevLedgerHash,
        pglHash: '',
        timestamp: curTime,
        who: {
          agentId: 'agent-researcher',
          agentName: 'ComplianceResearcher',
          publicKey: 'ed25519_pub_e942f10283bd74efcda',
          ownerId: 'owner-kate-delegate'
        },
        what: {
          capabilityId: 'db-read',
          capabilityName: 'DatabaseReader',
          action: 'read'
        },
        why: {
          policyApplied: 'owner-policy-kate',
          policyVersion: '1.2.5',
          authorizationProof: 'delegated_chain_kate_to_subagent_authorized'
        },
        how: {
          method: 'mcp',
          endpoint: 'mcp://core-db/read'
        },
        result: {
          status: 'authorized',
          outputHash: outputHash,
          executionTimeMs: 195,
          outputSummary: outputTxt
        },
        compliance: {
          regulatoryCategory: 'Delegated Audit Lineage Verification',
          dataClassification: 'confidential',
          retentionPolicy: 'Regulated Data: 7 Years'
        }
      };
      generatedEvidence.pglHash = calculateSHA256(JSON.stringify(generatedEvidence));

      const steps: PipelineStep[] = [
        {
          phase: 1,
          name: 'Identity & Security',
          subtitle: 'Active credential verification',
          status: 'success',
          details: [
            'Verifying Agent ID [agent-researcher] on Veklom directory: Found.',
            'Analyzing Authorization Chain Lineage:',
            '  Hop 1: Owner [owner-kate] delegated operational key context to Principal Researcher.',
            '  Hop 2: Principal delegated instruction set to ComplianceSubagent (Active delegation confirmed).',
            'Chain depth calculated: 2 levels (Securely under limit of 3 max depth levels).',
            'Cryptographic signatures validated for all delegators in chain.'
          ]
        },
        {
          phase: 2,
          name: 'Capability & Policy Composition',
          subtitle: 'Evaluate multi-policy hierarchies',
          status: 'success',
          details: [
            'Loaded capability: [db-read] (DatabaseReader, mcp core endpoint).',
            'Scan results: rule-own-allow-db is valid and active.',
            'Delegation policy compliance match: Authorized delegator holds parental clearance.'
          ]
        },
        {
          phase: 3,
          name: 'Safety & Anomaly Detection',
          subtitle: 'Predict and mitigate behaviors',
          status: 'success',
          details: [
            'Behavioral pattern evaluation: Agent has 12 previous delegated read logs registered.',
            'No delegation leaks or privilege escalations detected. Threat Score: 0.18 (Green).'
          ]
        },
        {
          phase: 4,
          name: 'Cost & Budget Verification',
          subtitle: 'Verify financial footprint limits',
          status: 'success',
          details: [
            'Computational charge: 8 credits context.',
            'Budget safe status verified.'
          ]
        },
        {
          phase: 5,
          name: 'Approval Workflows',
          subtitle: 'Quorum signatures gatekeeper',
          status: 'success',
          details: [
            'Delegated access was pre-approved under Kate Master Key policy. Flowing to execution.'
          ]
        },
        {
          phase: 6,
          name: 'Execution',
          subtitle: 'Connect capability layer',
          status: 'success',
          details: [
            'Routing transaction to: mcp://core-db/read.',
            'Completed read pipeline processing duration: 195ms.'
          ]
        },
        {
          phase: 7,
          name: 'Evidence & Proof Generator',
          subtitle: 'Build PGL block integrity',
          status: 'success',
          details: [
            'Compiling immutable lineage proof into evidence structure.',
            `Linked to previous Block Hash: ${prevLedgerHash.substring(0, 18)}...`,
            `Generated block hash: ${generatedEvidence.pglHash}`
          ]
        },
        {
          phase: 8,
          name: 'Audit & Compliance Registration',
          subtitle: 'Ledger publication pipelines',
          status: 'success',
          details: [
            'Commited delegation proof chains to PGL ledger pipeline.',
            'Added +2 reward points to researcher trust.'
          ]
        },
        {
          phase: 9,
          name: 'Response Packaging',
          subtitle: 'Produce secure output',
          status: 'success',
          details: [
            'Compliance package sealed. Forwarding payload to sub-agent caller.'
          ]
        }
      ];

      return {
        connectionId: connId,
        agentId: 'agent-researcher',
        capabilityId: 'db-read',
        status: 'authorized',
        evidence: generatedEvidence,
        steps: steps,
        anomaliesDetected: []
      };
    }
  }
];
