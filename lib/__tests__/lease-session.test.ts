import { clearSessionCapabilityLease, readSessionCapabilityLease, storeSessionCapabilityLease } from "@/lib/cos/lease-session";

describe("session CapabilityLease handoff", () => {
  beforeEach(() => sessionStorage.clear());

  it("hands the single-use lease from Mount to Execute without rendering it", () => {
    const lease = { mountId: "mnt_1", tokenId: "tok_1", nonce: "nonce_1" };
    storeSessionCapabilityLease(lease);
    expect(readSessionCapabilityLease()).toEqual(lease);
    clearSessionCapabilityLease();
    expect(readSessionCapabilityLease()).toBeNull();
  });
});
