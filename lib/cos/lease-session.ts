import { asExecutionIntent, type ExecutionIntent } from "@/lib/cos/execution-intent";
import type { PglProofLookup } from "@/lib/cos/readback";
import { SANDBOX_PROJECT, environmentStorageSuffix, readEnvironmentIsSandbox } from "@/lib/cos/sandbox";

export type SessionCapabilityLeaseGrants = {
  reads?: string[];
  writes?: string[];
  blocked?: string[];
};

export type SessionVLinkHandoff = {
  vlinkId: string;
  leaseId: string;
  status: string;
  handedAt: string;
};

export type SessionCapabilityLease = {
  mountId: string;
  tokenId: string;
  nonce: string;
  packageRef?: string;
  targetRef?: string;
  workspace?: string;
  project?: string;
  resource?: string;
  executionId?: string;
  expiresAt?: string;
  terminated?: boolean;
  terminatedBy?: string;
  grants?: SessionCapabilityLeaseGrants;
  holderCredential?: string;
  vlinkHandoff?: SessionVLinkHandoff;
  /** The contract-bound operation this mount was requested for (from ABIDE via Blueprint). */
  intent?: ExecutionIntent;
  /** The operation_id this lease last submitted, kept so it can be replayed as a test. */
  lastOperationId?: string;
};

/**
 * Credentials the machine still holds after the authority behind them ended or was
 * replaced. They are kept on purpose: the proof is that holding them is not enough.
 */
export type RetainedCapabilityLease = Pick<
  SessionCapabilityLease,
  "mountId" | "tokenId" | "nonce" | "packageRef" | "targetRef" | "workspace" | "project" | "terminatedBy" | "intent" | "lastOperationId"
> & { retainedAt: string };

// Leases and consequence records are segregated per environment so a sandbox
// mount can never be read back as live state (and vice versa).
const LEASE_KEY_BASE = "veklom.capability_lease";
const RETAINED_KEY_BASE = "veklom.capability_lease.retained";
const CONSEQUENCE_KEY_BASE = "veklom.capability_consequence";
const LEASE_CHANGED_EVENT = "veklom.capability_lease.changed";
const MAX_RETAINED = 10;

function leaseKey() {
  return `${LEASE_KEY_BASE}${environmentStorageSuffix()}`;
}

function retainedKey() {
  return `${RETAINED_KEY_BASE}${environmentStorageSuffix()}`;
}

export function readRetainedCapabilityLeases(): RetainedCapabilityLease[] {
  if (typeof window === "undefined" || !window.sessionStorage) return [];
  try {
    const raw = sessionStorage.getItem(retainedKey());
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(list)) return [];
    return list.flatMap((item): RetainedCapabilityLease[] => {
      const value = item as Partial<RetainedCapabilityLease>;
      if (typeof value?.mountId !== "string" || typeof value.tokenId !== "string" || typeof value.nonce !== "string") return [];
      const retained: RetainedCapabilityLease = {
        mountId: value.mountId,
        tokenId: value.tokenId,
        nonce: value.nonce,
        retainedAt: typeof value.retainedAt === "string" ? value.retainedAt : "",
      };
      for (const key of ["packageRef", "targetRef", "workspace", "project", "terminatedBy", "lastOperationId"] as const) {
        if (typeof value[key] === "string") retained[key] = value[key];
      }
      const intent = asExecutionIntent(value.intent);
      if (intent) retained.intent = intent;
      return leaseMatchesEnvironment(retained) ? [retained] : [];
    });
  } catch {
    return [];
  }
}

function retainLease(lease: SessionCapabilityLease) {
  const retained: RetainedCapabilityLease = {
    mountId: lease.mountId,
    tokenId: lease.tokenId,
    nonce: lease.nonce,
    packageRef: lease.packageRef,
    targetRef: lease.targetRef,
    workspace: lease.workspace,
    project: lease.project,
    terminatedBy: lease.terminatedBy,
    intent: lease.intent,
    lastOperationId: lease.lastOperationId,
    retainedAt: new Date().toISOString(),
  };
  const others = readRetainedCapabilityLeases().filter((item) => item.mountId !== lease.mountId);
  try {
    sessionStorage.setItem(retainedKey(), JSON.stringify([retained, ...others].slice(0, MAX_RETAINED)));
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

/** Before a lease is replaced or cleared, keep its credentials as retained. */
function retainCurrentUnless(nextMountId?: string) {
  const current = readSessionCapabilityLease();
  if (current && current.mountId !== nextMountId) retainLease(current);
}

function consequenceKey() {
  return `${CONSEQUENCE_KEY_BASE}${environmentStorageSuffix()}`;
}

/** A lease belongs to the current environment only when its CAPPO project scope matches. */
function leaseMatchesEnvironment(lease: Pick<SessionCapabilityLease, "project">): boolean {
  const sandbox = readEnvironmentIsSandbox();
  if (lease.project === undefined) return !sandbox;
  return sandbox ? lease.project === SANDBOX_PROJECT : lease.project !== SANDBOX_PROJECT;
}

function notifyLeaseChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LEASE_CHANGED_EVENT));
  }
}

export function storeSessionCapabilityLease(lease: SessionCapabilityLease) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    retainCurrentUnless(lease.mountId);
    sessionStorage.setItem(leaseKey(), JSON.stringify(lease));
    notifyLeaseChanged();
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function readSessionCapabilityLease(): SessionCapabilityLease | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(leaseKey());
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SessionCapabilityLease>;
    if (
      typeof value.mountId !== "string"
      || typeof value.tokenId !== "string"
      || typeof value.nonce !== "string"
    ) return null;
    const lease: SessionCapabilityLease = {
      mountId: value.mountId,
      tokenId: value.tokenId,
      nonce: value.nonce,
    };
    for (const key of [
      "packageRef",
      "targetRef",
      "workspace",
      "project",
      "resource",
      "executionId",
      "expiresAt",
      "lastOperationId",
    ] as const) {
      if (typeof value[key] === "string") lease[key] = value[key];
    }
    const intent = asExecutionIntent(value.intent);
    if (intent) lease.intent = intent;
    if (typeof value.terminated === "boolean") lease.terminated = value.terminated;
    if (typeof value.terminatedBy === "string") lease.terminatedBy = value.terminatedBy;
    if (typeof value.holderCredential === "string") {
      lease.holderCredential = value.holderCredential;
    }
    const vlinkHandoff = value.vlinkHandoff;
    if (
      vlinkHandoff
      && typeof vlinkHandoff === "object"
      && !Array.isArray(vlinkHandoff)
      && typeof vlinkHandoff.vlinkId === "string"
      && typeof vlinkHandoff.leaseId === "string"
      && typeof vlinkHandoff.status === "string"
      && typeof vlinkHandoff.handedAt === "string"
    ) {
      lease.vlinkHandoff = {
        vlinkId: vlinkHandoff.vlinkId,
        leaseId: vlinkHandoff.leaseId,
        status: vlinkHandoff.status,
        handedAt: vlinkHandoff.handedAt,
      };
    }
    if (value.grants && typeof value.grants === "object" && !Array.isArray(value.grants)) {
      const grants: SessionCapabilityLeaseGrants = {};
      for (const key of ["reads", "writes", "blocked"] as const) {
        const entries = value.grants[key];
        if (Array.isArray(entries)) {
          grants[key] = entries.filter((entry): entry is string => typeof entry === "string");
        }
      }
      if (Object.keys(grants).length) lease.grants = grants;
    }
    return leaseMatchesEnvironment(lease) ? lease : null;
  } catch {
    return null;
  }
}

export function applyExecuteResponse(
  lease: SessionCapabilityLease,
  response: Record<string, unknown>,
): SessionCapabilityLease {
  const consequence = response.consequence;
  if (
    consequence
    && typeof consequence === "object"
    && !Array.isArray(consequence)
    && (consequence as Record<string, unknown>).terminated === true
  ) {
    return {
      ...lease,
      terminated: true,
      terminatedBy: "cappo:task_complete",
    };
  }
  return lease;
}

export function applyTerminateResponse(
  lease: SessionCapabilityLease,
  response: Record<string, unknown>,
): SessionCapabilityLease {
  if (response.decision === "allow") {
    return {
      ...lease,
      terminated: true,
      terminatedBy: "explicit_terminate",
    };
  }
  if (response.decision === "deny" && response.reason === "already_terminated") {
    return {
      ...lease,
      terminated: true,
      terminatedBy: lease.terminatedBy ?? "cappo:task_complete",
    };
  }
  return lease;
}

export function clearSessionCapabilityLease() {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    retainCurrentUnless();
    sessionStorage.removeItem(leaseKey());
    notifyLeaseChanged();
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function clearHolderCredential() {
  const lease = readSessionCapabilityLease();
  if (!lease) return;
  const { holderCredential: _holderCredential, ...withoutCredential } = lease;
  storeSessionCapabilityLease(withoutCredential);
}

export type SessionConsequenceAttempt =
  | "execute"
  | "retry"
  | "forbidden_action"
  | "revoke"
  | "no_authority"
  | "retained_token"
  | "replay";

const CONSEQUENCE_ATTEMPTS: ReadonlySet<string> = new Set<SessionConsequenceAttempt>([
  "execute", "retry", "forbidden_action", "revoke", "no_authority", "retained_token", "replay",
]);

export type SessionConsequenceDenial = {
  attempt: SessionConsequenceAttempt;
  decision: string;
  reason: string;
  at: string;
  /** The mount whose credentials made the attempt, when not the held lease's own. */
  mountId?: string;
  operationId?: string;
};

export type SessionTargetReadback = {
  mount_id?: string;
  project?: string;
  state?: Record<string, unknown>;
  error?: string;
  [key: string]: unknown;
};

export type SessionConsequenceRecord = {
  mountId: string;
  response: Record<string, unknown>;
  lastAllowedResponse?: Record<string, unknown>;
  readback?: SessionTargetReadback;
  pglProof?: PglProofLookup;
  recordedAt: string;
  denials: SessionConsequenceDenial[];
};

export function storeSessionConsequence(
  record: Omit<SessionConsequenceRecord, "recordedAt"> & { recordedAt?: string },
) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  const value: SessionConsequenceRecord = {
    ...record,
    recordedAt: record.recordedAt ?? new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(consequenceKey(), JSON.stringify(value));
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function readSessionConsequence(mountId?: string): SessionConsequenceRecord | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(consequenceKey());
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SessionConsequenceRecord>;
    if (
      typeof value.mountId !== "string"
      || (mountId !== undefined && value.mountId !== mountId)
      || !value.response
      || typeof value.response !== "object"
      || Array.isArray(value.response)
      || typeof value.recordedAt !== "string"
      || !Array.isArray(value.denials)
    ) return null;
    const denials = value.denials.filter((item): item is SessionConsequenceDenial => (
      Boolean(item)
      && typeof item === "object"
      && CONSEQUENCE_ATTEMPTS.has((item as SessionConsequenceDenial).attempt)
      && typeof (item as SessionConsequenceDenial).decision === "string"
      && typeof (item as SessionConsequenceDenial).reason === "string"
      && typeof (item as SessionConsequenceDenial).at === "string"
    ));
    return {
      mountId: value.mountId,
      response: value.response as Record<string, unknown>,
      lastAllowedResponse: value.lastAllowedResponse && typeof value.lastAllowedResponse === "object" && !Array.isArray(value.lastAllowedResponse)
        ? value.lastAllowedResponse as Record<string, unknown>
        : undefined,
      readback: value.readback && typeof value.readback === "object" && !Array.isArray(value.readback)
        ? value.readback as SessionTargetReadback
        : undefined,
      pglProof: value.pglProof && typeof value.pglProof === "object" && !Array.isArray(value.pglProof)
        ? value.pglProof as PglProofLookup
        : undefined,
      recordedAt: value.recordedAt,
      denials,
    };
  } catch {
    return null;
  }
}

export function clearSessionConsequence() {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    sessionStorage.removeItem(consequenceKey());
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}
