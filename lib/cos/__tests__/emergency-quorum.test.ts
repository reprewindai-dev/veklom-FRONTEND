import { EmergencyQuorumManager } from "../emergencyQuorum";

describe("EmergencyQuorumManager (2-of-3 ESTOP)", () => {
  let manager: EmergencyQuorumManager;

  beforeEach(() => {
    manager = new EmergencyQuorumManager(2, 3);
    manager.registerKeyholder({
      id: "KEY_OFFICER",
      name: "Risk Officer",
      role: "RISK",
      publicKeyHex: "01020304"
    });
    manager.registerKeyholder({
      id: "KEY_OPERATOR",
      name: "System Operator",
      role: "OPERATOR",
      publicKeyHex: "05060708"
    });
    manager.registerKeyholder({
      id: "KEY_SENTINEL",
      name: "Circuit Sentinel",
      role: "SENTINEL",
      publicKeyHex: "090a0b0c"
    });
  });

  test("rejects unregistered keyholders with deltaC = 0", () => {
    const res = manager.submitHaltSignature({
      keyholderId: "UNKNOWN_ROGUE",
      signatureHex: "abcd",
      reason: "TEST",
      timestamp: new Date().toISOString()
    });
    expect(res.status).toBe("REJECTED_UNKNOWN_KEYHOLDER");
    expect(res.deltaC).toBe(0);
    expect(manager.isHalted()).toBe(false);
  });

  test("1 of 3 signature transitions to PENDING_QUORUM without halting", () => {
    const res = manager.submitHaltSignature({
      keyholderId: "KEY_OFFICER",
      signatureHex: "abcd",
      reason: "ANOMALY",
      timestamp: new Date().toISOString()
    });
    expect(res.status).toBe("PENDING_INSUFFICIENT_QUORUM");
    expect(res.deltaC).toBe(0);
    expect(manager.isHalted()).toBe(false);
    expect(manager.getQuorumState().status).toBe("PENDING_QUORUM");
  });

  test("rejects duplicate signature from the same keyholder", () => {
    manager.submitHaltSignature({
      keyholderId: "KEY_OFFICER",
      signatureHex: "abcd",
      reason: "ANOMALY",
      timestamp: new Date().toISOString()
    });
    const dupRes = manager.submitHaltSignature({
      keyholderId: "KEY_OFFICER",
      signatureHex: "abcd",
      reason: "ANOMALY",
      timestamp: new Date().toISOString()
    });
    expect(dupRes.status).toBe("REJECTED_DUPLICATE_KEYHOLDER");
    expect(manager.isHalted()).toBe(false);
  });

  test("2 of 3 distinct signatures trigger EMERGENCY_ESTOP_TRIGGERED and halt estate", () => {
    manager.submitHaltSignature({
      keyholderId: "KEY_OFFICER",
      signatureHex: "abcd",
      reason: "FLASH_CRASH_DETECTED",
      timestamp: new Date().toISOString()
    });
    const secondRes = manager.submitHaltSignature({
      keyholderId: "KEY_SENTINEL",
      signatureHex: "ef01",
      reason: "FLASH_CRASH_DETECTED",
      timestamp: new Date().toISOString()
    });
    expect(secondRes.status).toBe("EMERGENCY_ESTOP_TRIGGERED");
    expect(secondRes.deltaC).toBe(0);
    expect(manager.isHalted()).toBe(true);
    expect(manager.getQuorumState().status).toBe("HALTED");
    expect(manager.getQuorumState().signers).toEqual(["KEY_OFFICER", "KEY_SENTINEL"]);
  });
});
