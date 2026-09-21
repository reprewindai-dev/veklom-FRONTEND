import type { PglProofLookup } from "@/lib/cos/readback";

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
};

const KEY = "veklom.capability_lease";
const CONSEQUENCE_KEY = "veklom.capability_consequence";
const LEASE_CHANGED_EVENT = "veklom.capability_lease.changed";

function notifyLeaseChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LEASE_CHANGED_EVENT));
  }
}

export function storeSessionCapabilityLease(lease: SessionCapabilityLease) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(lease));
    notifyLeaseChanged();
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function readSessionCapabilityLease(): SessionCapabilityLease | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(KEY);
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
    ] as const) {
      if (typeof value[key] === "string") lease[key] = value[key];
    }
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
    return lease;
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
    sessionStorage.removeItem(KEY);
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

export type SessionConsequenceDenial = {
  attempt: "execute" | "retry" | "forbidden_action" | "revoke";
  decision: string;
  reason: string;
  at: string;
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
    sessionStorage.setItem(CONSEQUENCE_KEY, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function readSessionConsequence(mountId?: string): SessionConsequenceRecord | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(CONSEQUENCE_KEY);
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
      && (item as SessionConsequenceDenial).attempt !== undefined
      && ((item as SessionConsequenceDenial).attempt === "execute"
        || (item as SessionConsequenceDenial).attempt === "retry"
        || (item as SessionConsequenceDenial).attempt === "forbidden_action"
        || (item as SessionConsequenceDenial).attempt === "revoke")
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
    sessionStorage.removeItem(CONSEQUENCE_KEY);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}
