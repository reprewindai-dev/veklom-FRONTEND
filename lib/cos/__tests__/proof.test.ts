import { classifyPayload, deriveProofStatus } from "../proof";

describe("Truth Semantics and Proof Classifier", () => {
  it("never promotes STATIC_ASSERTION to Verified", () => {
    const payload = { evidence_class: "STATIC_ASSERTION", status: "active" };
    const classification = classifyPayload(payload);
    const status = deriveProofStatus(classification.observation);
    
    expect(classification.observation.kind).toBe("static-assertion");
    expect(status).not.toBe("Verified");
    expect(status).toBe("Live");
  });

  it("never promotes MEASURED_TELEMETRY to Verified", () => {
    const payload = { evidence_class: "MEASURED_TELEMETRY", cpu: 55 };
    const classification = classifyPayload(payload);
    const status = deriveProofStatus(classification.observation);
    
    expect(classification.observation.kind).toBe("measured");
    expect(status).not.toBe("Verified");
    expect(status).toBe("Live");
  });

  it("never promotes unsigned LOCAL_RECEIPT to Verified", () => {
    const payload = { evidence_class: "LOCAL_RECEIPT", signature_state: "UNSIGNED" };
    const classification = classifyPayload(payload);
    const status = deriveProofStatus(classification.observation);
    
    expect(classification.observation.kind).toBe("local-receipt");
    expect(status).not.toBe("Verified");
    expect(status).toBe("Live"); // It exists, so route is Live, but it's not verified
  });

  it("promotes strictly SIGNED_EVIDENCE with valid verification to Verified", () => {
    const payload = { evidence_class: "VERIFIED_EVIDENCE", signature: "real_crypto_sig" };
    const classification = classifyPayload(payload);
    const status = deriveProofStatus(classification.observation);
    
    expect(classification.observation.kind).toBe("source-of-truth");
    // @ts-ignore - TS isn't narrowing perfectly here, but we know it's there
    expect(classification.observation.verified).toBe(true);
    expect(status).toBe("Verified");
  });

  it("downgrades empty or arbitrary JSON to reachability-only (Live)", () => {
    const payload = { status: "success", random_data: "123" };
    const classification = classifyPayload(payload);
    const status = deriveProofStatus(classification.observation);
    
    expect(classification.observation.kind).toBe("reachability-only");
    expect(status).not.toBe("Verified");
    expect(status).toBe("Live");
  });
});
