import type { ProofStatus } from "./capabilities";

const SUCCESSFUL_EXECUTION_STATES = new Set(["completed", "succeeded", "success"]);
const FAILED_EXECUTION_STATES = new Set(["failed", "security_blocked", "cancelled", "denied"]);

export function executionProofStatus({
  status,
  executionId,
  hasResponse,
  leaseAllowed,
  sandbox,
}: {
  status?: string;
  executionId?: string;
  hasResponse: boolean;
  leaseAllowed: boolean;
  sandbox: boolean;
}): ProofStatus {
  const normalized = status?.toLowerCase();
  if (normalized && FAILED_EXECUTION_STATES.has(normalized)) return "Degraded";
  if (!normalized || !SUCCESSFUL_EXECUTION_STATES.has(normalized) || !executionId || !hasResponse || !leaseAllowed) {
    return "Needs proof";
  }
  return sandbox ? "Simulated" : "Verified";
}

export function proofRecordStatus({
  verified,
  degraded = false,
  sandbox,
}: {
  verified: boolean;
  degraded?: boolean;
  sandbox: boolean;
}): ProofStatus {
  if (degraded) return "Degraded";
  if (!verified) return "Needs proof";
  return sandbox ? "Simulated" : "Verified";
}

export function requestStillCurrent(
  requestedExecutionId: string,
  currentExecutionId: string,
  requestSequence: number,
  currentSequence: number,
): boolean {
  return requestedExecutionId === currentExecutionId && requestSequence === currentSequence;
}

export function formatObservedCount(observations: unknown[] | undefined): string {
  return observations === undefined ? "unavailable" : String(observations.length);
}
