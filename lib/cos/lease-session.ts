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
};

const KEY = "veklom.capability_lease";
const CONSEQUENCE_KEY = "veklom.capability_consequence";

export function storeSessionCapabilityLease(lease: SessionCapabilityLease) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(lease));
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
    return lease;
  } catch {
    return null;
  }
}

export function clearSessionCapabilityLease() {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export type SessionConsequenceDenial = {
  attempt: "retry" | "forbidden_action";
  decision: string;
  reason: string;
  at: string;
};

export type SessionConsequenceRecord = {
  response: Record<string, unknown>;
  lastAllowedResponse?: Record<string, unknown>;
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

export function readSessionConsequence(): SessionConsequenceRecord | null {
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
      !value.response
      || typeof value.response !== "object"
      || Array.isArray(value.response)
      || typeof value.recordedAt !== "string"
      || !Array.isArray(value.denials)
    ) return null;
    const denials = value.denials.filter((item): item is SessionConsequenceDenial => (
      Boolean(item)
      && typeof item === "object"
      && (item as SessionConsequenceDenial).attempt !== undefined
      && ((item as SessionConsequenceDenial).attempt === "retry"
        || (item as SessionConsequenceDenial).attempt === "forbidden_action")
      && typeof (item as SessionConsequenceDenial).decision === "string"
      && typeof (item as SessionConsequenceDenial).reason === "string"
      && typeof (item as SessionConsequenceDenial).at === "string"
    ));
    return {
      response: value.response as Record<string, unknown>,
      lastAllowedResponse: value.lastAllowedResponse && typeof value.lastAllowedResponse === "object" && !Array.isArray(value.lastAllowedResponse)
        ? value.lastAllowedResponse as Record<string, unknown>
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
