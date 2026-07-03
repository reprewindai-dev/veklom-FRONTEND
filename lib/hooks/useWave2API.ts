// lib/hooks/useGovernance.ts
import { useCallback } from 'react';
import { useVeklomAPI } from './useVeklomAPI';

export interface OperatorIdentity {
  id: string;
  wallet_address: string;
  operator_name: string;
  trust_score: number;
  rank: string;
  rank_badge_color: string;
  security_level: string;
  events_total: number;
  events_critical: number;
  events_resolved: number;
  joined_at: string;
  verified_at?: string;
  verification_status: 'unverified' | 'pending' | 'verified';
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  event_type: string;
  threat_type?: string;
  ai_confidence: number;
  description: string;
  evidence_hash: string;
  status: 'open' | 'resolved';
  resolution_notes?: string;
}

export interface SecurityStats {
  total: number;
  open: number;
  resolved: number;
  critical: number;
  last_24h: number;
  by_type: Record<string, number>;
  security_score: number;
}

export function useGovernance() {
  const { request, loading, error } = useVeklomAPI();

  const getCurrentIdentity = useCallback(async () => {
    return request<OperatorIdentity>('/api/v1/identity/me');
  }, [request]);

  const getIdentity = useCallback(
    async (address: string) => {
      return request<OperatorIdentity>(
        `/api/v1/identity/score/${address}`,
        { useAuth: false }
      );
    },
    [request]
  );

  const getSecurityStats = useCallback(async () => {
    return request<SecurityStats>('/api/v1/security/stats');
  }, [request]);

  const getSecurityEvents = useCallback(
    async (options?: { threat_type?: string; status?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (options?.threat_type) params.append('threat_type', options.threat_type);
      if (options?.status) params.append('status', options.status);
      if (options?.limit) params.append('limit', options.limit.toString());

      return request<SecurityEvent[]>(
        `/api/v1/security/events?${params.toString()}`
      );
    },
    [request]
  );

  const resolveSecurityEvent = useCallback(
    async (eventId: string, notes: string) => {
      return request(`/api/v1/security/events/${eventId}/resolve`, {
        method: 'POST',
        body: { resolution_notes: notes },
      });
    },
    [request]
  );

  const logSecurityEvent = useCallback(
    async (payload: {
      event_type: string;
      threat_type: string;
      security_level: string;
      description: string;
      ip_address?: string;
      ai_confidence: number;
      ai_recommendations?: Record<string, unknown>;
    }) => {
      return request('/api/v1/security/events', {
        method: 'POST',
        body: payload,
      });
    },
    [request]
  );

  const linkWallet = useCallback(
    async (address: string, signature: string) => {
      return request('/api/v1/identity/link-wallet', {
        method: 'POST',
        body: { wallet_address: address, signature },
      });
    },
    [request]
  );

  return {
    getCurrentIdentity,
    getIdentity,
    getSecurityStats,
    getSecurityEvents,
    resolveSecurityEvent,
    logSecurityEvent,
    linkWallet,
    loading,
    error,
  };
}

// lib/hooks/useRuntime.ts
export interface ExecutionRequest {
  operation_id?: string;
  agent_id: string;
  scenario_id: string;
  parameters?: Record<string, unknown>;
}

export interface ExecutionStep {
  step_number: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration_ms: number;
  evidence_hash: string;
  timestamp: string;
}

export interface ExecutionResult {
  execution_id: string;
  status: 'success' | 'failed';
  steps: ExecutionStep[];
  total_duration_ms: number;
  evidence_hash: string;
  execution_auth_token?: string;
  error_message?: string;
}

export interface ExecutionAuthorizationToken {
  token: string;
  issued_at: string;
  signature: string;
  valid_until: string;
  authorized_by: string;
}

export function useRuntime() {
  const { request, loading, error } = useVeklomAPI();

  const executeScenario = useCallback(
    async (payload: ExecutionRequest) => {
      return request<ExecutionResult>('/v1/exec', {
        method: 'POST',
        body: payload as any,
      });
    },
    [request]
  );

  const getExecutionTrace = useCallback(
    async (executionId: string) => {
      return request<ExecutionResult>(
        `/api/v1/audit/${executionId}`
      );
    },
    [request]
  );

  const getComplianceCheck = useCallback(async () => {
    return request('/api/v1/compliance/check');
  }, [request]);

  const triggerKillSwitch = useCallback(async () => {
    return request('/api/v1/kill-switch/trigger', {
      method: 'POST',
      body: { reason: 'Manual kill switch activation' },
    });
  }, [request]);

  const getKillSwitchStatus = useCallback(async () => {
    return request('/api/v1/kill-switch/status');
  }, [request]);

  return {
    executeScenario,
    getExecutionTrace,
    getComplianceCheck,
    triggerKillSwitch,
    getKillSwitchStatus,
    loading,
    error,
  };
}

// lib/hooks/useEvidenceLedger.ts
export interface EvidenceRecord {
  id: string;
  operation_id: string;
  step_name: string;
  timestamp: string;
  evidence_hash: string;
  data_hash: string;
  signature: string;
  operator_id: string;
}

export function useEvidenceLedger() {
  const { request, loading, error } = useVeklomAPI();

  const getEvidenceLedger = useCallback(
    async (executionId: string) => {
      return request<EvidenceRecord[]>(
        `/api/v1/audit/${executionId}/evidence`
      );
    },
    [request]
  );

  const verifyEvidence = useCallback(
    async (recordId: string) => {
      return request(`/api/v1/evidence/${recordId}/verify`, {
        method: 'POST',
      });
    },
    [request]
  );

  const getEvidenceHash = useCallback(
    async (executionId: string) => {
      return request<{ hash: string }>(
        `/api/v1/audit/${executionId}/hash`
      );
    },
    [request]
  );

  return {
    getEvidenceLedger,
    verifyEvidence,
    getEvidenceHash,
    loading,
    error,
  };
}

// lib/hooks/useComplianceReporting.ts
export interface ComplianceReport {
  regulation: string;
  period: string;
  compliance_score: number;
  findings: string[];
  recommendations: string[];
  generated_at: string;
}

export function useComplianceReporting() {
  const { request, loading, error } = useVeklomAPI();

  const generateReport = useCallback(
    async (regulation: 'gdpr' | 'ccpa' | 'soc2', startDate: string, endDate: string) => {
      return request<ComplianceReport>(
        '/api/v1/compliance/report',
        {
          method: 'POST',
          body: {
            regulation,
            start_date: startDate,
            end_date: endDate,
          },
        }
      );
    },
    [request]
  );

  const explainRoutingDecision = useCallback(
    async (decisionId: string) => {
      return request(`/api/v1/explain/routing/${decisionId}`);
    },
    [request]
  );

  const explainCostPrediction = useCallback(
    async (predictionId: string) => {
      return request(`/api/v1/explain/cost/${predictionId}`);
    },
    [request]
  );

  const getQualityScore = useCallback(
    async (logId: string) => {
      return request<{
        relevance: number;
        accuracy: number;
        coherence: number;
        completeness: number;
        overall: number;
      }>(`/api/v1/audit/${logId}/quality`);
    },
    [request]
  );

  return {
    generateReport,
    explainRoutingDecision,
    explainCostPrediction,
    getQualityScore,
    loading,
    error,
  };
}

// lib/hooks/usePrivacy.ts
export interface PIIDetectionResult {
  has_pii: boolean;
  pii_types: string[];
  count: number;
}

export interface PIIMaskingResult {
  masked_text: string;
  pii_found: string[];
}

export function usePrivacy() {
  const { request, loading, error } = useVeklomAPI();

  const detectPII = useCallback(
    async (text: string) => {
      return request<PIIDetectionResult>(
        '/api/v1/privacy/detect-pii',
        {
          method: 'POST',
          body: { text },
        }
      );
    },
    [request]
  );

  const maskPII = useCallback(
    async (
      text: string,
      strategy: 'redact' | 'hash' | 'replace' | 'partial'
    ) => {
      return request<PIIMaskingResult>(
        '/api/v1/privacy/mask-pii',
        {
          method: 'POST',
          body: { text, strategy },
        }
      );
    },
    [request]
  );

  const exportData = useCallback(async () => {
    return request('/api/v1/privacy/export');
  }, [request]);

  const deleteAccount = useCallback(
    async () => {
      return request('/api/v1/privacy/delete-account', {
        method: 'DELETE',
        body: { confirmation: 'DELETE MY ACCOUNT' },
      });
    },
    [request]
  );

  return {
    detectPII,
    maskPII,
    exportData,
    deleteAccount,
    loading,
    error,
  };
}
