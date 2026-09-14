import {
  clearSessionCapabilityLease,
  clearSessionConsequence,
  readSessionCapabilityLease,
  readSessionConsequence,
  storeSessionCapabilityLease,
  storeSessionConsequence,
} from "@/lib/cos/lease-session";

describe("session capability lease handoff", () => {
  beforeEach(() => sessionStorage.clear());

  it("hands the single-use lease from Mount to Execute without rendering it", () => {
    const lease = { mountId: "mnt_1", tokenId: "tok_1", nonce: "nonce_1" };
    storeSessionCapabilityLease(lease);
    expect(readSessionCapabilityLease()).toEqual(lease);
    clearSessionCapabilityLease();
    expect(readSessionCapabilityLease()).toBeNull();
  });

  it("reads legacy three-field leases and extended scope fields", () => {
    sessionStorage.setItem(
      "veklom.capability_lease",
      JSON.stringify({
        mountId: "mnt_2",
        tokenId: "tok_2",
        nonce: "nonce_2",
        packageRef: "veklom.governed-counter@v1",
        targetRef: "activation.governed-counter",
        workspace: "default",
        project: "sandbox",
        resource: "counter-1234",
        executionId: "exec_2",
        expiresAt: "2026-09-14T00:00:00Z",
        terminated: true,
      }),
    );
    expect(readSessionCapabilityLease()).toEqual({
      mountId: "mnt_2",
      tokenId: "tok_2",
      nonce: "nonce_2",
      packageRef: "veklom.governed-counter@v1",
      targetRef: "activation.governed-counter",
      workspace: "default",
      project: "sandbox",
      resource: "counter-1234",
      executionId: "exec_2",
      expiresAt: "2026-09-14T00:00:00Z",
      terminated: true,
    });
  });

  it("stores, reads, and clears the last consequence and denial history", () => {
    storeSessionConsequence({
      response: {
        decision: "allow",
        consequence: { receipt_id: "receipt_1", terminated: true },
      },
      denials: [{
        attempt: "retry",
        decision: "deny",
        reason: "idempotency_replay:op-1",
        at: "2026-09-13T00:00:00Z",
      }],
    });
    const record = readSessionConsequence();
    expect(record?.response).toEqual({
      decision: "allow",
      consequence: { receipt_id: "receipt_1", terminated: true },
    });
    expect(record?.denials).toHaveLength(1);
    expect(record?.recordedAt).toEqual(expect.any(String));
    clearSessionConsequence();
    expect(readSessionConsequence()).toBeNull();
  });
});
