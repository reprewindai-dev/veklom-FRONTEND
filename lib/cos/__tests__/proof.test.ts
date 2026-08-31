import { classifyPayload, deriveProofStatus } from "../proof";

describe("Truth Semantics and Proof Classifier (Hostile Suite)", () => {
  it("never promotes STATIC_ASSERTION to Verified", () => {
    const payload = { evidence_class: "STATIC_ASSERTION", status: "active" };
    const classification = classifyPayload(payload);
    expect(deriveProofStatus(classification.observation)).toBe("Live");
  });

  it("never promotes MEASURED_TELEMETRY to Verified", () => {
    const payload = { evidence_class: "MEASURED_TELEMETRY", cpu: 55 };
    const classification = classifyPayload(payload);
    expect(deriveProofStatus(classification.observation)).toBe("Live");
  });

  it("never promotes unsigned LOCAL_RECEIPT to Verified", () => {
    const payload = { evidence_class: "LOCAL_RECEIPT", signature_state: "UNSIGNED" };
    const classification = classifyPayload(payload);
    expect(deriveProofStatus(classification.observation)).toBe("Live"); 
  });

  it("SIGNED_EVIDENCE + signature -> NOT Verified (Only signed)", () => {
    const payload = { evidence_class: "SIGNED_EVIDENCE", signature: "some_crypto_sig" };
    const classification = classifyPayload(payload);
    expect(classification.observation.kind).toBe("source-of-truth");
    // @ts-ignore
    expect(classification.observation.signed).toBe(true);
    // @ts-ignore
    expect(classification.observation.verified).toBe(false);
    expect(deriveProofStatus(classification.observation)).toBe("Live");
  });

  it("VERIFIED_EVIDENCE + garbage signature -> NOT Verified (Cannot self-assert verification)", () => {
    const payload = { evidence_class: "VERIFIED_EVIDENCE", signature: "garbage" };
    const classification = classifyPayload(payload);
    // @ts-ignore
    expect(classification.observation.verified).toBe(false); // Payload assertion is untrusted
    expect(deriveProofStatus(classification.observation)).toBe("Live");
  });

  it("truth_state=verified + arbitrary signature -> NOT Verified", () => {
    const payload = { truth_state: "verified", signature: "arbitrary_sig" };
    const classification = classifyPayload(payload);
    expect(deriveProofStatus(classification.observation)).toBe("Live");
  });

  it("proofState=verified + arbitrary signature -> NOT Verified", () => {
    const payload = { proofState: "verified", signature: "arbitrary_sig" };
    const classification = classifyPayload(payload);
    expect(deriveProofStatus(classification.observation)).toBe("Live");
  });

  it("downgrades empty or arbitrary JSON to reachability-only (Live)", () => {
    const payload = { status: "success", random_data: "123" };
    const classification = classifyPayload(payload);
    expect(classification.observation.kind).toBe("reachability-only");
    expect(deriveProofStatus(classification.observation)).toBe("Live");
  });

  it("only an actual successful external verifier result -> Verified", () => {
    // We mock the client-side verifier manually injecting a verified observation
    const externalObservation = { kind: "source-of-truth" as const, status: 200, signed: true, verified: true };
    const status = deriveProofStatus(externalObservation);
    expect(status).toBe("Verified");
  });
});
