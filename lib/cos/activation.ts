import { api, ApiError } from "@/lib/api";
import {
  executeGovernedConsequence,
  fetchExecutionEvidence,
  fetchExecutionMeasurement,
  fetchExecutionTargetObservation,
  type GovernedConsequenceResponse,
} from "@/lib/cos/verticalSlice";

export const ACTIVATION_PACKAGE_ID = "veklom.activation@v1";
export const ACTIVATION_WRITE_ACTION = "activation.marker.write";
export const ACTIVATION_BLOCKED_ACTION = "activation.marker.delete";

export interface ActivationPackage {
  id: string;
  family: string;
  title: string;
  purpose: string;
  reads?: string[];
  writes?: string[];
  blocked?: string[];
}

export interface ActivationLease {
  mountId: string;
  tokenId: string;
  nonce: string;
  executionId: string;
  packageRef: string;
  workspaceId: string;
  projectId: string;
  allowedAction: string;
  deniedAction: string;
  anchorId?: string | null;
}

export interface ActivationDenial {
  decision: "deny";
  reason: string;
  mountId: string;
  action: string;
  anchorStatus?: string;
  anchorId?: string | null;
}

export interface ActivationReplayDenial {
  decision: "deny";
  status: 403;
  executionId: string;
  reason: string;
  body?: unknown;
}

export interface ActivationAllowedExecution {
  executionId: string;
  runId?: string;
  operation: string;
  response: GovernedConsequenceResponse;
}

export interface ActivationTargetObservation {
  execution_id: string;
  workspace_id: string;
  consequence_count: number;
  consequence_id?: string | null;
  operation_id?: string | null;
  mount_id?: string | null;
  receipt_id?: string | null;
  content_hash?: string | null;
  created_at?: string | null;
  observation_source: "activation_consequences";
  persisted: boolean;
}

export interface ActivationEvidence {
  execution_id: string;
  proof_state: "verified" | "verified_with_unresolved_refs";
  verification_reasons: string[];
  authorization: {
    receipt_id: string;
    mount_id: string;
    token_id: string;
    action: string;
    decision: "allow";
    content_hash: string;
    pgl_anchor_id?: string | null;
    authorized_at: string;
  };
  execution_identity: {
    execution_id: string;
    authority_bundle_hash: string;
    policy_hash: string;
    pgl_pre_certificate_id?: string | null;
    pgl_post_certificate_id?: string | null;
  };
  eee: Record<string, unknown> & { envelope_hash?: string };
  pgl: {
    event_id: string;
    certificate_id?: string | null;
    event_hash?: string | null;
    previous_event_hash?: string | null;
    persisted: true;
    external?: boolean;
    created_at: string;
  };
}

export interface ActivationMeasurements {
  execution_id: string;
  run_id: string;
  proof_state: "verified" | "verified_with_unresolved_refs";
  run_state: string;
  provider?: string | null;
  model?: string | null;
  tokens?: number | null;
  cached?: boolean | null;
  cache_tier?: string | null;
  runtime_elapsed_ms: number;
  started_at: string;
  ended_at: string;
  authorization_count: number;
  consequence: {
    operation_count: number;
    successful_count: number;
    failed_count: number;
    outcome_unknown_count: number;
    events: Array<{
      event_id: string;
      operation_id: string;
      state: string;
      version: number;
      action: string;
      resource?: string | null;
      receipt_id?: string | null;
      completion_proof_type?: string | null;
      completion_proof_ref?: string | null;
      created_at: string;
    }>;
  };
  target_observation?: ActivationTargetObservation | null;
  pgl_event_id: string;
  pgl_event_hash?: string | null;
  eee_envelope_hash: string;
}

type MountResponse = {
  decision: "allow" | "deny";
  reason: string;
  anchoring?: { status?: string; anchor_id?: string | null };
  mount?: { id?: string };
  token?: {
    token_id?: string;
    nonce?: string;
    mount_id?: string;
    execution_id?: string;
  };
};

type ActionResponse = {
  decision: "allow" | "deny";
  reason: string;
  anchoring?: { status?: string; anchor_id?: string | null };
  mount_id: string;
  action: string;
};

export class ActivationUnavailableError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ActivationUnavailableError";
  }
}

function nonEmpty(values?: string[]): string[] {
  return (values ?? []).filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export async function discoverActivationPackage(): Promise<ActivationPackage> {
  const packages = await api<ActivationPackage[]>(
    "/api/cappo/v1/capability/packages",
    { method: "GET" },
  );
  const candidate = packages.find((item) => item.id === ACTIVATION_PACKAGE_ID);
  if (!candidate) {
    throw new ActivationUnavailableError(
      `The built-in ${ACTIVATION_PACKAGE_ID} capability is not live in CAPPO.`,
    );
  }
  if (
    !nonEmpty(candidate.writes).includes(ACTIVATION_WRITE_ACTION) ||
    !nonEmpty(candidate.blocked).includes(ACTIVATION_BLOCKED_ACTION)
  ) {
    throw new ActivationUnavailableError(
      "The live Veklom Activation package does not expose its canonical governed-write and blocked challenge actions.",
    );
  }
  return candidate;
}

export async function requestActivationLease(
  capability: ActivationPackage,
  workspaceId: string,
  projectId: string,
): Promise<ActivationLease> {
  if (capability.id !== ACTIVATION_PACKAGE_ID) {
    throw new ActivationUnavailableError(
      "Activation v1 only accepts the reserved first-party Veklom Activation package.",
    );
  }
  const allowedAction = ACTIVATION_WRITE_ACTION;
  const deniedAction = ACTIVATION_BLOCKED_ACTION;

  const result = await api<MountResponse>("/api/cappo/v1/capability/mounts", {
    method: "POST",
    body: {
      package_ref: capability.id,
      execution_scope: { workspace: workspaceId, project: projectId },
      requested_action_scope: {
        reads: [],
        writes: [allowedAction],
        blocked: [deniedAction],
      },
      role: "ephemeral_executor",
      policy: {},
      ttl_seconds: 300,
    },
  });

  const mountId = result.mount?.id ?? result.token?.mount_id;
  const tokenId = result.token?.token_id;
  const nonce = result.token?.nonce;
  const executionId = result.token?.execution_id;
  if (
    result.decision !== "allow" ||
    !mountId ||
    !tokenId ||
    !nonce ||
    !executionId
  ) {
    throw new ActivationUnavailableError(
      `CAPPO did not issue an Activation v1 lease: ${result.reason || "unknown reason"}`,
    );
  }

  return {
    mountId,
    tokenId,
    nonce,
    executionId,
    packageRef: capability.id,
    workspaceId,
    projectId,
    allowedAction,
    deniedAction,
    anchorId: result.anchoring?.anchor_id,
  };
}

export async function inspectActivationTarget(
  lease: ActivationLease,
  expectedCount: 0 | 1,
  expectedReceiptId?: string,
): Promise<ActivationTargetObservation> {
  try {
    const observation = (await fetchExecutionTargetObservation(
      lease.executionId,
    )) as ActivationTargetObservation;
    if (
      observation.execution_id !== lease.executionId ||
      observation.workspace_id !== lease.workspaceId ||
      observation.observation_source !== "activation_consequences" ||
      observation.consequence_count !== expectedCount
    ) {
      throw new ActivationUnavailableError(
        `Independent target observation did not prove consequence_count=${expectedCount}.`,
      );
    }
    if (expectedCount === 0) {
      if (observation.persisted || observation.consequence_id) {
        throw new ActivationUnavailableError(
          "Target observer reported a consequence while the expected count was zero.",
        );
      }
    } else if (
      observation.persisted !== true ||
      !observation.consequence_id ||
      !observation.content_hash ||
      observation.mount_id !== lease.mountId ||
      (expectedReceiptId != null && observation.receipt_id !== expectedReceiptId)
    ) {
      throw new ActivationUnavailableError(
        "The independently observed consequence is not bound to this Activation lease and receipt.",
      );
    }
    return observation;
  } catch (error) {
    if (error instanceof ActivationUnavailableError) throw error;
    if (error instanceof ApiError) {
      throw new ActivationUnavailableError(
        `Activation target observation is unavailable (${error.status ?? error.kind}).`,
        error,
      );
    }
    throw error;
  }
}

export async function proveActivationDenial(
  lease: ActivationLease,
): Promise<ActivationDenial> {
  const result = await api<ActionResponse>(
    `/api/cappo/v1/capability/mounts/${encodeURIComponent(lease.mountId)}/actions`,
    {
      method: "POST",
      body: {
        token_id: lease.tokenId,
        nonce: lease.nonce,
        action: lease.deniedAction,
      },
    },
  );

  if (result.decision !== "deny") {
    throw new ActivationUnavailableError(
      `Activation challenge was not denied by CAPPO (decision=${result.decision}).`,
    );
  }
  return {
    decision: "deny",
    reason: result.reason,
    mountId: result.mount_id,
    action: result.action,
    anchorStatus: result.anchoring?.status,
    anchorId: result.anchoring?.anchor_id,
  };
}

export async function executeActivationAllowed(
  lease: ActivationLease,
): Promise<ActivationAllowedExecution> {
  const result = await executeGovernedConsequence({
    capabilityLease: {
      mountId: lease.mountId,
      tokenId: lease.tokenId,
      nonce: lease.nonce,
      executionId: lease.executionId,
    },
    operation: lease.allowedAction,
    prompt: `Activation v1 governed ${lease.allowedAction}`,
  });
  if (!result.execution_id || result.execution_id !== lease.executionId) {
    throw new ActivationUnavailableError(
      "CAPPO did not return the execution identity bound to the issued lease.",
    );
  }
  if (
    result.capability_lease?.receipt_id == null ||
    result.capability_lease.execution_id !== lease.executionId ||
    result.capability_lease.mount_id !== lease.mountId ||
    result.capability_lease.decision !== "allow" ||
    result.capability_lease.nonce_consumed !== true
  ) {
    throw new ActivationUnavailableError(
      "CAPPO response is missing the consumed lease authorization receipt.",
    );
  }
  return {
    executionId: result.execution_id,
    runId: result.run_id,
    operation: lease.allowedAction,
    response: result,
  };
}

export async function proveActivationReplayDenied(
  lease: ActivationLease,
): Promise<ActivationReplayDenial> {
  try {
    await executeGovernedConsequence({
      capabilityLease: {
        mountId: lease.mountId,
        tokenId: lease.tokenId,
        nonce: lease.nonce,
        executionId: lease.executionId,
      },
      operation: lease.allowedAction,
      prompt: `Activation v1 replay challenge ${lease.allowedAction}`,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return {
        decision: "deny",
        status: 403,
        executionId: lease.executionId,
        reason: error.message,
        body: error.body,
      };
    }
    throw new ActivationUnavailableError(
      "The exact Activation replay did not fail with CAPPO's expected authority denial.",
      error,
    );
  }
  throw new ActivationUnavailableError(
    "CAPPO accepted an already-consumed Activation lease replay.",
  );
}

export async function inspectActivationEvidence(
  execution: ActivationAllowedExecution,
): Promise<ActivationEvidence> {
  try {
    const evidence = (await fetchExecutionEvidence(
      execution.executionId,
    )) as ActivationEvidence;
    const verifiedState = ["verified", "verified_with_unresolved_refs"].includes(
      evidence.proof_state,
    );
    const localEventHashValid =
      evidence.pgl?.external === true || Boolean(evidence.pgl?.event_hash);
    if (
      evidence.execution_id !== execution.executionId ||
      evidence.execution_identity?.execution_id !== execution.executionId ||
      evidence.authorization?.decision !== "allow" ||
      evidence.authorization?.receipt_id !== execution.response.capability_lease?.receipt_id ||
      evidence.authorization?.mount_id !== execution.response.capability_lease?.mount_id ||
      evidence.authorization?.action !== execution.operation ||
      !verifiedState ||
      evidence.pgl?.persisted !== true ||
      !evidence.pgl?.event_id ||
      !localEventHashValid ||
      !evidence.eee?.envelope_hash
    ) {
      throw new ActivationUnavailableError(
        "The evidence response is not a verified persisted proof for this execution and authorization receipt.",
      );
    }
    return evidence;
  } catch (error) {
    if (error instanceof ActivationUnavailableError) throw error;
    if (error instanceof ApiError) {
      throw new ActivationUnavailableError(
        `Execution evidence is unavailable (${error.status ?? error.kind}).`,
        error,
      );
    }
    throw error;
  }
}

export async function inspectActivationMeasurements(
  execution: ActivationAllowedExecution,
): Promise<ActivationMeasurements> {
  try {
    const measurements = (await fetchExecutionMeasurement(
      execution.executionId,
    )) as ActivationMeasurements;
    const consequence = measurements.consequence;
    const target = measurements.target_observation;
    const receiptId = execution.response.capability_lease?.receipt_id;
    const mountId = execution.response.capability_lease?.mount_id;
    if (
      measurements.execution_id !== execution.executionId ||
      !["verified", "verified_with_unresolved_refs"].includes(
        measurements.proof_state,
      ) ||
      measurements.authorization_count !== 1 ||
      consequence?.operation_count !== 1 ||
      consequence?.successful_count !== 1 ||
      consequence?.failed_count !== 0 ||
      consequence?.outcome_unknown_count !== 0 ||
      consequence?.events?.map((event) => event.state).join(",") !==
        "authorized,started,succeeded" ||
      target?.execution_id !== execution.executionId ||
      target?.consequence_count !== 1 ||
      target?.persisted !== true ||
      target?.mount_id !== mountId ||
      target?.receipt_id !== receiptId ||
      !target?.consequence_id ||
      !target?.content_hash ||
      !measurements.eee_envelope_hash ||
      !measurements.pgl_event_id
    ) {
      throw new ActivationUnavailableError(
        "Execution measurements do not prove exactly one completed and independently observed consequence.",
      );
    }
    return measurements;
  } catch (error) {
    if (error instanceof ActivationUnavailableError) throw error;
    if (error instanceof ApiError) {
      throw new ActivationUnavailableError(
        `Execution measurements are unavailable (${error.status ?? error.kind}).`,
        error,
      );
    }
    throw error;
  }
}
