import { deriveProofStatus } from "@/lib/cos/proof";

describe("Capability OS proof derivation", () => {
  it("keeps an uncalled route at Needs proof", () => {
    expect(deriveProofStatus({ kind: "not-called" })).toBe("Needs proof");
  });

  it("keeps a missing route at Not started", () => {
    expect(deriveProofStatus({ kind: "no-route" })).toBe("Not started");
  });

  it("marks failed calls Degraded", () => {
    expect(deriveProofStatus({ kind: "failed", status: 401 })).toBe("Degraded");
  });

  it("does not treat reachability as verification", () => {
    expect(deriveProofStatus({ kind: "reachability-only", status: 200 })).toBe("Present");
  });

  it("requires source truth or a signed handshake for Verified", () => {
    expect(deriveProofStatus({ kind: "source-of-truth", status: 200 })).toBe("Verified");
    expect(deriveProofStatus({ kind: "source-of-truth", status: 200, signed: true })).toBe("Verified");
  });

  it("forces sandbox observations to Simulated", () => {
    expect(deriveProofStatus({ kind: "source-of-truth", status: 200 }, true)).toBe("Simulated");
    expect(deriveProofStatus({ kind: "failed", status: 500 }, true)).toBe("Simulated");
  });
});
