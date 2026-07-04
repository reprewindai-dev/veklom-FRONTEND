/**
 * Covenant Protocol — type definitions.
 *
 * Every connection through Covenant carries identity, policy, trust, and
 * evidence as first-class citizens. These types describe the full surface of
 * the protocol: core runtime, plus the Safety, Intelligence, and Governance
 * layers.
 */

// ============================================================================
// CORE
// ============================================================================

export type InferenceProvider =
  | "claude"
  | "gpt"
  | "gemini"
  | "llama"
  | "other";

export type GovernanceTier = "system" | "user" | "service";

export interface AgentIdentity {
  agent_id: string;
  agent_name: string;
  owner_id: string;
  public_key: string; // base64 (Ed25519 SPKI DER)
  capabilities_manifest: string;
  created_at: string;
  identity_proof: string;
  metadata: {
    version: string;
    framework: string;
    inference_provider: InferenceProvider;
    tier: GovernanceTier;
  };
}

export type CapabilityCategory =
  | "tool"
  | "service"
  | "agent"
  | "database"
  | "human"
  | "sensor";

export type CapabilityMethod = "mcp" | "http" | "https" | "local";

export type CostKind = "carbon" | "credits" | "payment" | "free";

export interface CapabilityIdentity {
  capability_id: string;
  capability_name: string;
  provider_id: string;
  endpoint: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  public_key: string;
  created_at: string;
  version: string;
  identity_proof: string;
  metadata: {
    category: CapabilityCategory;
    requires_approval: boolean;
    cost: CostKind;
    rate_limit: number;
  };
}

export type PolicyEffect = "allow" | "deny";

export interface PolicyConditions {
  time_window?: [string, string];
  rate_limit?: number;
  requires_approval?: boolean;
  approval_path?: string;
  context_required?: string[];
  trust_minimum?: number;
}

export interface PolicyRule {
  rule_id: string;
  effect: PolicyEffect;
  principal: string;
  action: string;
  conditions: PolicyConditions;
}

export type EnforcementMode = "strict" | "warn" | "audit-only";

export type PolicyTier = "system" | "owner" | "runtime";

export interface Policy {
  policy_id: string;
  policy_name: string;
  version: string;
  tier: PolicyTier;
  created_by: string;
  created_at: string;
  rules: PolicyRule[];
  metadata: {
    enforcement_mode: EnforcementMode;
    escalation_threshold: number;
    audit_trail: boolean;
  };
}

export interface CovenantRequest {
  connection_id: string;
  agent_id: string;
  agent_signature: string;
  capability_id: string;
  action: string;
  input: Record<string, unknown>;
  context: {
    trace_id?: string;
    user_context?: Record<string, unknown>;
    audit_tags?: string[];
  };
  timestamp: string;
}

export type Decision = "authorized" | "denied" | "error" | "quarantined";

export type DataClassification =
  | "public"
  | "internal"
  | "confidential"
  | "restricted";

export type LedgerForwardStatus = "pending" | "sealed" | "failed" | "disabled";

/** Outcome of mirroring an evidence record into the external PGL (gnomledger). */
export interface LedgerForward {
  status: LedgerForwardStatus;
  event_id?: string;
  event_hash?: string;
  prev_event_hash?: string;
  forwarded_at?: string;
  error?: string;
}

export interface Evidence {
  evidence_id: string;
  connection_id: string;
  pgl_hash: string;
  timestamp: string;
  who: { agent_id: string; agent_public_key: string; owner_id: string };
  what: { capability_id: string; capability_name: string; action: string };
  when: { requested_at: string; executed_at: string; completed_at: string };
  why: {
    policy_applied: string;
    policy_version: string;
    authorization_proof: string;
    request_context: string;
  };
  how: { method: CapabilityMethod; endpoint: string; retry_count: number };
  result: {
    status: Decision;
    output_hash: string;
    output_size: number;
    execution_time_ms: number;
  };
  compliance: {
    audit_logged: boolean;
    regulatory_category: string;
    data_classification: DataClassification;
    retention_policy: string;
  };
  previous_hash?: string;
  /** External PGL (gnomledger) mirror status; set after Phase 7 sealing. */
  external_ledger?: LedgerForward;
}

/** Filters accepted by the queryable audit-trail endpoint. */
export interface AuditQuery {
  agent_id?: string;
  capability_id?: string;
  status?: Decision;
  /** ISO-8601 lower bound on the evidence seal timestamp. */
  since?: string;
  forwarded?: LedgerForwardStatus;
  limit?: number;
}

export interface TrustScore {
  agent_id: string;
  score: number; // 0-100
  success_rate: number;
  policy_adherence: number;
  denial_frequency: number;
  escalation_events: number;
  total_requests: number;
  last_updated: string;
}

export interface CovenantResponse {
  connection_id: string;
  status: Decision;
  evidence_hash?: string;
  result?: {
    output: Record<string, unknown>;
    output_hash: string;
    execution_time_ms: number;
  };
  error?: {
    code: string;
    message: string;
    remediation?: Record<string, unknown>;
  };
  metadata: {
    trust_delta: number;
    new_trust_score: number;
    audit_logged: boolean;
  };
  /** Per-phase execution trace — powers the live console visualization. */
  trace: PhaseTrace[];
}

export type PhaseStatus = "pass" | "warn" | "fail" | "skipped";

export interface PhaseTrace {
  phase: number;
  name: string;
  status: PhaseStatus;
  duration_ms: number;
  summary: string;
  detail: Record<string, unknown>;
}

// ============================================================================
// SAFETY LAYER
// ============================================================================

export interface BehavioralBaseline {
  agent_id: string;
  observation_window_days: number;
  avg_requests_per_hour: number;
  std_dev_requests_per_hour: number;
  avg_failure_rate: number;
  typical_capabilities: Record<string, number>;
  typical_time_windows: number[];
  confidence_score: number;
  last_updated: string;
  is_locked: boolean;
}

export type AnomalyType =
  | "request_spike"
  | "failure_spike"
  | "new_capability_access"
  | "off_hours_activity"
  | "unusual_pattern"
  | "capability_mutation"
  | "delegation_chain_exploit";

export type Severity = "low" | "medium" | "high" | "critical";

export type RecommendedAction = "log" | "alert" | "quarantine" | "block";

export interface AnomalyDetection {
  detection_id: string;
  agent_id: string;
  detected_at: string;
  anomaly_type: AnomalyType;
  deviation_score: number;
  anomaly_score: number; // 0-100
  severity: Severity;
  recommended_action: RecommendedAction;
  summary: string;
  evidence_hash: string;
}

export type QuarantineStatus =
  | "quarantined"
  | "approved"
  | "denied"
  | "auto_released";

export interface QuarantinedRequest {
  quarantine_id: string;
  connection_id: string;
  agent_id: string;
  capability_id: string;
  quarantine_reason: string;
  anomalies_detected: AnomalyDetection[];
  suppressed_trust_score: number;
  approvers_required: number;
  approvals_received: string[];
  approval_deadline: string;
  status: QuarantineStatus;
  created_at: string;
  resolution_timestamp?: string;
}

// ============================================================================
// INTELLIGENCE LAYER
// ============================================================================

export type Currency = "credits" | "carbon" | "usd" | "mixed";

export type OveragePolicy = "deny" | "escalate" | "auto-approve-charge";

export interface CostModel {
  capability_id: string;
  cost_per_call: number;
  currency: Currency;
  budget_per_agent: number;
  overage_policy: OveragePolicy;
}

export interface CostAllocation {
  agent_id: string;
  capability_id: string;
  used: number;
  budget: number;
  remaining: number;
  last_reset: string;
}

export interface CostAllocationRecord {
  record_id: string;
  agent_id: string;
  capability_id: string;
  timestamp: string;
  cost: number;
  currency: Currency;
  budget_after: number;
  budget_exceeded: boolean;
  action_taken: "allowed" | "escalated" | "denied" | "auto_charged";
}

export type ThreatLevel = "green" | "yellow" | "orange" | "red";

export interface RiskFactor {
  factor_name: string;
  contribution: number; // 0-100
  severity: Severity;
}

export interface RiskProfile {
  agent_id: string;
  overall_risk_score: number; // 0-100
  threat_level: ThreatLevel;
  risk_factors: RiskFactor[];
  last_assessed: string;
  recommended_actions: string[];
}

// ============================================================================
// GOVERNANCE LAYER
// ============================================================================

export type ConflictType =
  | "allow-deny"
  | "rate-limit-mismatch"
  | "trust-requirement-mismatch"
  | "time-window-overlap"
  | "approval-conflict";

export interface PolicyConflict {
  conflict_id: string;
  conflict_type: ConflictType;
  source1: string;
  source2: string;
  conflicting_field: string;
  severity: Severity;
  resolution: string;
  requires_admin_review: boolean;
}

export type ResolutionMethod =
  | "system-wins"
  | "owner-wins"
  | "most-restrictive"
  | "union"
  | "intersection";

export interface PolicyComposition {
  composition_id: string;
  agent_id: string;
  capability_id: string;
  timestamp: string;
  contributing_policies: string[];
  conflicts_detected: PolicyConflict[];
  resolution_method: ResolutionMethod;
  is_valid: boolean;
}

export interface EffectivePermissions {
  agent_id: string;
  capability_id: string;
  calculated_at: string;
  can_execute: boolean;
  requires_approval: boolean;
  approval_path: string[];
  rate_limit?: number;
  trust_required: number;
  trust_current: number;
  time_restricted: boolean;
  cost_limit?: number;
  delegation_depth: number;
  confidence_score: number;
}

export interface DelegationChain {
  delegation_id: string;
  source_agent: string;
  target_agent: string;
  capability_id: string;
  timestamp: string;
  depth: number;
  max_depth: number;
  trust_multiplier: number;
  evidence_chain: string[];
  is_valid: boolean;
  is_revoked: boolean;
  can_further_delegate: boolean;
}
