import { api } from "@/lib/api";

export interface GovernedConsequenceRequest {
  capabilityLease: {
    mountId: string;
    tokenId: string;
    nonce: string;
    executionId: string;
  };
  operation: string;
  prompt: string;
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
    execution_id: string;
    receipt_id: string;
    decision: "allow";
    nonce_consumed: true;
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
      scope: {
        tools: [request.operation],
        allowed_effects: [request.operation],
      },
      capability_lease: {
        mount_id: request.capabilityLease.mountId,
        token_id: request.capabilityLease.tokenId,
        nonce: request.capabilityLease.nonce,
        execution_id: request.capabilityLease.executionId,
      },
      target_precondition: request.targetPrecondition
        ? {
            target_id: request.targetPrecondition.targetId,
            expected_state_hash: request.targetPrecondition.expectedStateHash,
            observed_state_hash: request.targetPrecondition.observedStateHash,
            observed_at: request.targetPrecondition.observedAt,
            signature: request.targetPrecondition.signature,
          }
        : undefined,
    },
  });
}

export function fetchExecutionEvidence(executionId: string): Promise<unknown> {
  return api(
    `/api/cappo/v1/executions/${encodeURIComponent(executionId)}/evidence`,
    { method: "GET" },
  );
}

export function fetchExecutionMeasurement(executionId: string): Promise<unknown> {
  return api(
    `/api/cappo/v1/executions/${encodeURIComponent(executionId)}/measurements`,
    { method: "GET" },
  );
}

export function fetchExecutionTargetObservation(executionId: string): Promise<unknown> {
  return api(
    `/api/cappo/v1/executions/${encodeURIComponent(executionId)}/target-observation`,
    { method: "GET" },
  );
}
