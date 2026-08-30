import { api, ApiError } from "@/lib/api";
import {
  executeGovernedConsequence,
  fetchExecutionEvidence,
  type GovernedConsequenceResponse,
} from "@/lib/cos/verticalSlice";

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

export interface ActivationAllowedExecution {
  executionId: string;
  runId?: string;
  operation: string;
  response: GovernedConsequenceResponse;
}

export interface ActivationEvidence {
  execution_id: string;
  proof_state: "verified" | "verified_with_unresolved_refs";
  verification_reasons: string[];
  eee: Record<string, unknown>;
  pgl: {
    event_id: string;
    certificate_id?: string | null;
    event_hash: string;
    previous_event_hash?: string | null;
    persisted: true;
    created_at: string;
  };
}

type MountResponse = {
  decision: "allow" | "deny";
  reason: string;
  anchoring?: { status?: string; anchor_id?: string | null };
  mount?: { id?: string };
  token?: { token_id?: string; nonce?: string; mount_id?: string };
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
  return (values ?? []).filter((value) => typeof value === "string" && value.trim().length > 0);
}

/**
 * Activation v1 deliberately selects an existing backend capability package.
 * It does not manufacture a demo package in the browser. The first slice uses
 * a read action so it can execute without fabricating an external target-state
 * observation; write activation must wait for a real signed observer.
 */
export async function discoverActivationPackage(): Promise<ActivationPackage> {
  const packages = await api<ActivationPackage[]>("/api/cappo/v1/capability/packages", {
    method: "GET",
  });
  const candidate = packages.find(
    (item) => nonEmpty(item.reads).length > 0 && nonEmpty(item.blocked).length > 0,
  );
  if (!candidate) {
    throw new ActivationUnavailableError(
      "No live capability package currently exposes both an allowed read and a blocked action.",
    );
  }
  return candidate;
}

export async function requestActivationLease(
  capability: ActivationPackage,
  workspaceId: string,
  projectId: string,
): Promise<ActivationLease> {
  const allowedAction = nonEmpty(capability.reads)[0];
  const deniedAction = nonEmpty(capability.blocked)[0];
  if (!allowedAction || !deniedAction) {
    throw new ActivationUnavailableError("The selected capability is not suitable for Activation v1.");
  }

  const result = await api<MountResponse>("/api/cappo/v1/capability/mounts", {
    method: "POST",
    body: {
      package_ref: capability.id,
      execution_scope: { workspace: workspaceId, project: projectId },
      requested_action_scope: {
        reads: [allowedAction],
        writes: [],
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
  if (result.decision !== "allow" || !mountId || !tokenId || !nonce) {
    throw new ActivationUnavailableError(
      `CAPPO did not issue an Activation v1 lease: ${result.reason || "unknown reason"}`,
    );
  }

  return {
    mountId,
    tokenId,
    nonce,
    packageRef: capability.id,
    workspaceId,
    projectId,
    allowedAction,
    deniedAction,
    anchorId: result.anchoring?.anchor_id,
  };
}

/**
 * Prove the negative boundary before consuming the lease on the allowed run.
 * A denial is accepted only when CAPPO itself returns decision=deny.
 */
export async function proveActivationDenial(lease: ActivationLease): Promise<ActivationDenial> {
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
    },
    operation: lease.allowedAction,
    prompt: `Activation v1 governed ${lease.allowedAction}`,
    workspaceId: lease.workspaceId,
  });
  if (!result.execution_id) {
    throw new ActivationUnavailableError(
      "CAPPO returned no execution_id; Activation cannot claim a governed consequence.",
    );
  }
  return {
    executionId: result.execution_id,
    runId: result.run_id,
    operation: lease.allowedAction,
    response: result,
  };
}

export async function inspectActivationEvidence(
  execution: ActivationAllowedExecution,
): Promise<ActivationEvidence> {
  try {
    const evidence = await fetchExecutionEvidence(execution.executionId) as ActivationEvidence;
    if (
      evidence.execution_id !== execution.executionId ||
      !["verified", "verified_with_unresolved_refs"].includes(evidence.proof_state) ||
      evidence.pgl?.persisted !== true ||
      !evidence.pgl?.event_hash
    ) {
      throw new ActivationUnavailableError(
        "The evidence response is not a verified, persisted proof for this execution.",
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
