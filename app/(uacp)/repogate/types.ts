export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SAFE';

export type PolicyResult = 
  | 'read_blocked' 
  | 'human_approval_required' 
  | 'escalate_to_security' 
  | 'blocked_env_boundary' 
  | 'review_required';

export interface PolicyRule {
  id: string;
  pattern: string;
  name: string;
  policyResult: PolicyResult;
  riskLevel: RiskLevel;
  reason: string;
}

export interface TerminalEvent {
  id: string;
  run_id: string;
  agent_id: string;
  event_type: string;
  target: string;
  policy_result: PolicyResult | 'none';
  message: string;
  timestamp: string;
  hash: string;
  sequence_no: number;
  log_level?: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
}

export interface VerifiedFinding {
  id: string;
  run_id: string;
  path: string;
  matched_rule: string;
  policy_result: PolicyResult;
  risk_level: RiskLevel;
  reason: string;
  created_at: string;
}

export interface RiskGateScan {
  run_id: string;
  agent_id: string;
  status: 'idle' | 'fetching' | 'scanning' | 'awaiting_decision' | 'completed' | 'failed';
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  default_branch: string;
  risk_level: RiskLevel;
  tree_truncated: boolean;
  files_seen: number;
  created_at: string;
  decision?: 'APPROVED' | 'ESCALATED' | 'BLOCKED';
  decision_note?: string;
  decision_at?: string;
}
