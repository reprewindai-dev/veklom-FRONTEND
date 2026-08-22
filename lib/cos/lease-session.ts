export type SessionCapabilityLease = {
  mountId: string;
  tokenId: string;
  nonce: string;
};

const KEY = "veklom.capability_lease";

export function storeSessionCapabilityLease(lease: SessionCapabilityLease) {
  sessionStorage.setItem(KEY, JSON.stringify(lease));
}

export function readSessionCapabilityLease(): SessionCapabilityLease | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SessionCapabilityLease>;
    return value.mountId && value.tokenId && value.nonce
      ? { mountId: value.mountId, tokenId: value.tokenId, nonce: value.nonce }
      : null;
  } catch {
    return null;
  }
}

export function clearSessionCapabilityLease() {
  sessionStorage.removeItem(KEY);
}
