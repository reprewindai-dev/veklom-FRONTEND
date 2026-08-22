import {
  executionProofStatus,
  proofRecordStatus,
  requestStillCurrent,
} from "@/lib/cos/vertical-slice-truth";

describe("truthful vertical slice state", () => {
  it.each(["failed", "security_blocked", "cancelled", "accepted", "pending", "queued", undefined])(
    "does not verify an execution in %s state",
    (status) => {
      expect(executionProofStatus({
        status,
        executionId: "exec-1",
        hasResponse: true,
        leaseAllowed: true,
        sandbox: false,
      })).not.toBe("Verified");
    },
  );

  it("verifies only explicit successful execution states with authority and a result", () => {
    expect(executionProofStatus({
      status: "succeeded",
      executionId: "exec-1",
      hasResponse: true,
      leaseAllowed: true,
      sandbox: false,
    })).toBe("Verified");
  });

  it("marks otherwise verified execution and evidence as simulated in sandbox", () => {
    expect(executionProofStatus({
      status: "completed",
      executionId: "exec-1",
      hasResponse: true,
      leaseAllowed: true,
      sandbox: true,
    })).toBe("Simulated");
    expect(proofRecordStatus({ verified: true, sandbox: true })).toBe("Simulated");
  });

  it("does not attach a superseded response to the current execution", () => {
    expect(requestStillCurrent("exec-a", "exec-b", 4, 4)).toBe(false);
    expect(requestStillCurrent("exec-a", "exec-a", 3, 4)).toBe(false);
    expect(requestStillCurrent("exec-a", "exec-a", 4, 4)).toBe(true);
  });
});
