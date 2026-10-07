import {
  clearHolderCredential,
  readSessionCapabilityLease,
  storeSessionCapabilityLease,
  type SessionCapabilityLease,
} from "@/lib/cos/lease-session";

describe("VLink fields in the session capability lease", () => {
  beforeEach(() => sessionStorage.clear());

  const lease: SessionCapabilityLease = {
    mountId: "mnt_1",
    tokenId: "tok_1",
    nonce: "nonce_1",
    holderCredential: "vlm_mnt_1.secret",
    project: "sandbox",
    vlinkHandoff: {
      vlinkId: "vlink_1",
      leaseId: "lease_1",
      status: "active",
      handedAt: "2026-09-14T00:00:00Z",
    },
  };

  it("round-trips holder credentials and VLink handoff metadata", () => {
    storeSessionCapabilityLease(lease);
    expect(readSessionCapabilityLease()).toEqual(lease);
  });

  it("clears only the holder credential", () => {
    storeSessionCapabilityLease(lease);
    clearHolderCredential();
    expect(readSessionCapabilityLease()).toEqual({
      mountId: "mnt_1",
      tokenId: "tok_1",
      nonce: "nonce_1",
      project: "sandbox",
      vlinkHandoff: lease.vlinkHandoff,
    });
  });
});
