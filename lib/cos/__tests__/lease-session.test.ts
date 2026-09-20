import {
  clearSessionCapabilityLease,
  clearSessionConsequence,
  applyExecuteResponse,
  applyTerminateResponse,
  readSessionCapabilityLease,
  readSessionConsequence,
  storeSessionCapabilityLease,
  storeSessionConsequence,
} from "@/lib/cos/lease-session";

describe("session capability lease handoff", () => {
  beforeEach(() => sessionStorage.clear());

  const lease = {
    mountId: "mnt_1",
    tokenId: "tok_1",
    nonce: "nonce_1",
  };

  it("keeps execute allows mounted until CAPPO reports consequence termination", () => {
    expect(applyExecuteResponse(lease, { decision: "allow" })).toEqual(lease);
    expect(applyExecuteResponse(lease, {
      decision: "allow",
      consequence: { terminated: true },
    })).toEqual({
      ...lease,
      terminated: true,
      terminatedBy: "cappo:task_complete",
    });
  });

  it("records explicit and already-terminated revoke outcomes", () => {
    expect(applyTerminateResponse(lease, {
      decision: "allow",
      reason: "explicit_terminate",
    })).toEqual({
      ...lease,
      terminated: true,
      terminatedBy: "explicit_terminate",
    });
    const completedLease = {
      ...lease,
      terminated: true,
      terminatedBy: "cappo:task_complete",
    };
    expect(applyTerminateResponse(completedLease, {
      decision: "deny",
      reason: "already_terminated",
    })).toEqual(completedLease);
  });

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
        terminatedBy: "cappo:task_complete",
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
      terminatedBy: "cappo:task_complete",
    });
  });

  it("parses only array-shaped grant fields", () => {
    sessionStorage.setItem(
      "veklom.capability_lease",
      JSON.stringify({
        mountId: "mnt_3",
        tokenId: "tok_3",
        nonce: "nonce_3",
        grants: {
          reads: ["counter.read"],
          writes: "counter.increment",
          blocked: ["counter.reset", 42],
        },
      }),
    );
    expect(readSessionCapabilityLease()?.grants).toEqual({
      reads: ["counter.read"],
      blocked: ["counter.reset"],
    });
  });

  it("stores, reads, and clears the last consequence and denial history", () => {
    storeSessionConsequence({
      mountId: "mnt_1",
      response: {
        decision: "allow",
        consequence: { receipt_id: "receipt_1", terminated: true },
      },
      readback: {
        target_ref: "activation.governed-counter",
        resource: "counter",
        project: "sandbox",
        state: { resource: "counter", value: 1, version: 1 },
      },
      pglProof: {
        event_hash: "pgl_abc",
        persisted: true,
        checked_at: "2026-09-13T00:00:00Z",
      },
      denials: [{
        attempt: "retry",
        decision: "deny",
        reason: "idempotency_replay:op-1",
        at: "2026-09-13T00:00:00Z",
      }],
    });
    const record = readSessionConsequence("mnt_1");
    expect(record?.response).toEqual({
      decision: "allow",
      consequence: { receipt_id: "receipt_1", terminated: true },
    });
    expect(record?.denials).toHaveLength(1);
    expect(record?.readback?.project).toBe("sandbox");
    expect(record?.readback?.state).toEqual({ resource: "counter", value: 1, version: 1 });
    expect(record?.pglProof).toEqual({
      event_hash: "pgl_abc",
      persisted: true,
      checked_at: "2026-09-13T00:00:00Z",
    });
    expect(record?.recordedAt).toEqual(expect.any(String));
    expect(readSessionConsequence("mnt_other")).toBeNull();
    clearSessionConsequence();
    expect(readSessionConsequence()).toBeNull();
  });
});
