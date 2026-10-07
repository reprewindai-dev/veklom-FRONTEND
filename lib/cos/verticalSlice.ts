import { api } from "@/lib/api";
import { pglLedgerEventPath, type PglLedgerEvent } from "@/lib/cos/readback";

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
  // Real PGL ledger identifiers CAPPO recorded for this run. Used to retrieve and
  // verify the persisted evidence event against the canonical ledger.
  pgl?: {
    pre_execution_certificate_id?: string | null;
    post_execution_certificate_id?: string | null;
    capi_evidence_event_id?: string | null;
    persisted?: boolean;
  } | null;
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
  });
}

/**
 * Retrieve a persisted PGL ledger event by its id from the canonical ledger.
 *
 * CAPPO does not expose a per-execution evidence route; the real anchored evidence
 * lives in the PGL ledger. The governed execution response carries the ledger event
 * ids CAPPO recorded, and this fetches the event itself (hash, chain link, payload)
 * so the browser can surface genuine, independently retrievable evidence.
 */
export function fetchPglLedgerEvent(eventId: string): Promise<PglLedgerEvent> {
  return api<PglLedgerEvent>(pglLedgerEventPath(eventId), { method: "GET" });
}
