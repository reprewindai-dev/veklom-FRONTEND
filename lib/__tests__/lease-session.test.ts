import {
  clearSessionCapabilityLease,
  readSessionCapabilityLease,
  storeSessionCapabilityLease,
} from "@/lib/cos/lease-session";

describe("session CapabilityLease handoff", () => {
  beforeEach(() => sessionStorage.clear());

  it("hands the execution-bound single-use lease from Mount to Execute", () => {
    const lease = {
      mountId: "mnt_1",
      tokenId: "tok_1",
      nonce: "nonce_1",
      executionId: "exec_1",
    };
    storeSessionCapabilityLease(lease);
    expect(readSessionCapabilityLease()).toEqual(lease);
    clearSessionCapabilityLease();
    expect(readSessionCapabilityLease()).toBeNull();
  });

  it("fails closed on a legacy lease that has no bound execution id", () => {
    sessionStorage.setItem(
      "veklom.capability_lease",
      JSON.stringify({ mountId: "mnt_1", tokenId: "tok_1", nonce: "nonce_1" }),
    );

    expect(readSessionCapabilityLease()).toBeNull();
  });
});
