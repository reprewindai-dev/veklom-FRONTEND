import { api } from "@/lib/api";

export interface GovernedConsequenceRequest {
  capabilityLease: {
    mountId: string;
    tokenId: string;
    nonce: string;
  };
  operation: string;
  prompt: string;
  workspaceId?: string;
  targetPrecondition?: {
    targetId: string;
    expectedStateHash: string;
    observedStateHash: string;
    observedAt: string;
    signature: string;
  };
}

export interface GovernedConsequenceResponse {
  response?: unknown;
  run_id?: string;
  execution_id?: string;
  links?: Record<string, { href: string; method: string }>;
  capability_lease?: {
    mount_id: string;
    decision: "allow";
    reason: string;
    anchor_id?: string | null;
  };
  _runtimeMeta?: unknown;
}

export function executeGovernedConsequence(
  request: GovernedConsequenceRequest,
): Promise<GovernedConsequenceResponse> {
  return api<GovernedConsequenceResponse>("/api/cappo/v1/exec", {
    method: "POST",
    body: {
      prompt: request.prompt,
      action: request.operation,
      directive: "ALLOW",
      workspace_id: request.workspaceId,
      scope: {
        tools: [request.operation],
        allowed_effects: [request.operation],
      },
      capability_lease: {
        mount_id: request.capabilityLease.mountId,
        token_id: request.capabilityLease.tokenId,
        nonce: request.capabilityLease.nonce,
      },
      target_precondition: request.targetPrecondition ? {
        target_id: request.targetPrecondition.targetId,
        expected_state_hash: request.targetPrecondition.expectedStateHash,
        observed_state_hash: request.targetPrecondition.observedStateHash,
        observed_at: request.targetPrecondition.observedAt,
        signature: request.targetPrecondition.signature,
      } : undefined,
    },
    handlePaymentRequired: false,
  });
}

export function fetchExecutionEvidence(executionId: string): Promise<unknown> {
  return api(`/api/cappo/v1/executions/${encodeURIComponent(executionId)}/evidence`, {
    method: "GET",
  });
}

export function fetchExecutionMeasurement(executionId: string): Promise<unknown> {
  return api(`/api/cappo/v1/executions/${encodeURIComponent(executionId)}/measurements`, {
    method: "GET",
  });
}
