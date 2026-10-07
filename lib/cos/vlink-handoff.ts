import type { SessionCapabilityLease } from "./lease-session";

export type VLinkHandoffBody = {
  mountId: string;
  tokenId: string;
  nonce: string;
  holderCredential: string;
  packageRef: string;
  workspace: string;
  project: string;
  targetRef: string;
  allowedActions: string[];
  blockedActions: string[];
  expiresAt: string;
};

export type VLinkHandoffRequest = {
  url: string;
  init: RequestInit;
  body: VLinkHandoffBody;
};

export function buildHandoffRequest(
  lease: SessionCapabilityLease,
  vlinkId: string,
  grant: string,
): VLinkHandoffRequest {
  const body: VLinkHandoffBody = {
    mountId: lease.mountId,
    tokenId: lease.tokenId,
    nonce: lease.nonce,
    holderCredential: lease.holderCredential ?? "",
    packageRef: lease.packageRef ?? "",
    workspace: lease.workspace ?? "",
    project: lease.project ?? "",
    targetRef: lease.targetRef ?? "",
    allowedActions: Array.from(new Set([
      ...(lease.grants?.reads ?? []),
      ...(lease.grants?.writes ?? []),
    ])),
    blockedActions: lease.grants?.blocked ?? [],
    expiresAt: lease.expiresAt ?? "",
  };

  return {
    url: `/vlink/connect/api/v1/vlinks/${encodeURIComponent(vlinkId)}/leases`,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${grant}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    body,
  };
}
