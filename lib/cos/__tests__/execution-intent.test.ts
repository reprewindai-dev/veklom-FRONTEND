import {
  asBoundOperation,
  clearPendingExecutionIntent,
  readPendingExecutionIntent,
  storePendingExecutionIntent,
  type ExecutionIntent,
} from "@/lib/cos/execution-intent";
import {
  clearSessionCapabilityLease,
  readRetainedCapabilityLeases,
  readSessionCapabilityLease,
  storeSessionCapabilityLease,
} from "@/lib/cos/lease-session";

const operation = {
  package_ref: "arena.dataset@v1",
  target_ref: "arena.protected-dataset",
  action: "record.modify",
  resource: "42",
  arguments: { note: "approved-by-veklom" },
};

const intent: ExecutionIntent = {
  contractId: "bc_1",
  canonicalHash: "h".repeat(64),
  stepId: "st_1",
  sequence: 1,
  clause: "Change the note on record 42 to approved-by-veklom",
  operation,
  boundAt: "2026-10-07T00:00:00.000Z",
};

describe("contract-bound execution intent", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("round-trips a pending intent and clears it", () => {
    storePendingExecutionIntent(intent);
    expect(readPendingExecutionIntent()).toEqual(intent);
    clearPendingExecutionIntent();
    expect(readPendingExecutionIntent()).toBeNull();
  });

  it("rejects an operation missing any bound field or carrying non-scalar arguments", () => {
    expect(asBoundOperation(operation)).toEqual(operation);
    for (const key of ["package_ref", "target_ref", "action", "resource"] as const) {
      expect(asBoundOperation({ ...operation, [key]: "" })).toBeNull();
    }
    expect(asBoundOperation({ ...operation, arguments: { note: { nested: true } } })).toBeNull();
    expect(asBoundOperation({ ...operation, arguments: ["x"] })).toBeNull();
  });

  it("carries the intent on the lease", () => {
    storeSessionCapabilityLease({ mountId: "mnt_a", tokenId: "tok_a", nonce: "n_a", intent, lastOperationId: "op-1" });
    expect(readSessionCapabilityLease()?.intent).toEqual(intent);
    expect(readSessionCapabilityLease()?.lastOperationId).toBe("op-1");
  });
});

describe("retained credentials", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("keeps a replaced lease's credentials as retained, not discarded", () => {
    storeSessionCapabilityLease({ mountId: "mnt_a", tokenId: "tok_a", nonce: "n_a", intent, lastOperationId: "op-a", terminated: true, terminatedBy: "cappo:task_complete" });
    storeSessionCapabilityLease({ mountId: "mnt_b", tokenId: "tok_b", nonce: "n_b" });

    const retained = readRetainedCapabilityLeases();
    expect(retained.map((item) => item.mountId)).toEqual(["mnt_a"]);
    expect(retained[0]).toMatchObject({ tokenId: "tok_a", nonce: "n_a", lastOperationId: "op-a", terminatedBy: "cappo:task_complete", intent });
  });

  it("does not retain a lease merely updated in place", () => {
    storeSessionCapabilityLease({ mountId: "mnt_a", tokenId: "tok_a", nonce: "n_a" });
    storeSessionCapabilityLease({ mountId: "mnt_a", tokenId: "tok_a", nonce: "n_a", lastOperationId: "op-a" });
    expect(readRetainedCapabilityLeases()).toEqual([]);
  });

  it("retains a cleared lease", () => {
    storeSessionCapabilityLease({ mountId: "mnt_a", tokenId: "tok_a", nonce: "n_a" });
    clearSessionCapabilityLease();
    expect(readSessionCapabilityLease()).toBeNull();
    expect(readRetainedCapabilityLeases().map((item) => item.mountId)).toEqual(["mnt_a"]);
  });
});
