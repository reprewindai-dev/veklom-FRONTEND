import { anchoringLabel, anchoringProof, compareReadback } from "../readback";

describe("Capability OS readback and anchoring proof", () => {
  const resultingState = { resource: "counter", value: 1, version: 1 };

  it("requires proof before an independent readback runs", () => {
    expect(compareReadback(resultingState, undefined)).toBe("Needs proof");
  });

  it("verifies matching readback value and version", () => {
    expect(compareReadback(resultingState, {
      state: { resource: "counter", value: 1, version: 1 },
    })).toBe("Verified");
  });

  it("degrades when the readback value or version differs", () => {
    expect(compareReadback(resultingState, {
      state: { resource: "counter", value: 2, version: 1 },
    })).toBe("Degraded");
    expect(compareReadback(resultingState, {
      state: { resource: "counter", value: 1, version: 2 },
    })).toBe("Degraded");
  });

  it.each([
    ["confirmed", "Verified", "PGL persisted"],
    ["pending_reconciliation", "Degraded", "PGL append unconfirmed"],
    ["not_applicable", "Needs proof", "PGL status not confirmed"],
    ["unconfirmed", "Needs proof", "PGL status not confirmed"],
  ] as const)("maps %s anchoring honestly", (status, proof, label) => {
    expect(anchoringProof({ status })).toBe(proof);
    expect(anchoringLabel({ status })).toBe(label);
  });

  it("requires proof when anchoring is missing", () => {
    expect(anchoringProof(undefined)).toBe("Needs proof");
    expect(anchoringLabel(undefined)).toBe("PGL status not confirmed");
  });
});
