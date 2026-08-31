import type { ProofStatus } from "./capabilities";

export type ProofObservation =
  | { kind: "not-called" }
  | { kind: "no-route" }
  | { kind: "failed"; status?: number }
  | { kind: "reachability-only"; status: number }
  | { kind: "static-assertion"; status: number }
  | { kind: "measured"; status: number }
  | { kind: "local-receipt"; status: number }
  | { kind: "source-of-truth"; status: number; signed?: boolean; verified?: boolean };

export interface PayloadClassification {
  observation: ProofObservation;
  reason?: string;
}

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload);
}

export function classifyPayload(payload: unknown): PayloadClassification {
  if (isRecord(payload) && payload.proofState === "degraded") {
    return {
      observation: { kind: "failed", status: 200 },
      reason: typeof payload.proofSignal === "string" ? payload.proofSignal : undefined,
    };
  }
  if (payload === null || payload === undefined) {
    return { observation: { kind: "reachability-only", status: 200 } };
  }
  
  if (isRecord(payload)) {
    const evidenceClass = typeof payload.evidence_class === "string" ? payload.evidence_class.toUpperCase() : "";
    
    if (evidenceClass === "STATIC_ASSERTION" || payload.discovery_mechanism === "STATIC_ASSERTION") {
       return { observation: { kind: "static-assertion", status: 200 } };
    }
    
    if (evidenceClass === "MEASURED_TELEMETRY") {
       return { observation: { kind: "measured", status: 200 } };
    }
    
    if (evidenceClass === "LOCAL_RECEIPT") {
       return { observation: { kind: "local-receipt", status: 200 } };
    }
    
    // Self-asserted verification is NEVER trusted. A payload cannot declare itself verified.
    // An external client-side cryptographic verifier must supply `verified: true` independently.
    if (evidenceClass === "SIGNED_EVIDENCE" || evidenceClass === "VERIFIED_EVIDENCE") {
      const signature = payload.signature ?? payload.signature_id ?? payload.evidence_signature;
      return { 
        observation: { 
          kind: "source-of-truth", 
          status: 200, 
          signed: Boolean(signature),
          verified: false // Must be independently verified by the client, not by payload assertion.
        } 
      };
    }

    const keys = Object.keys(payload);
    const metadataOnly = keys.length === 0 || keys.every((key) => (
      ["status", "message", "version", "service", "timestamp", "_runtimeMeta"].includes(key)
    ));
    
    return {
      observation: metadataOnly
        ? { kind: "reachability-only", status: 200 }
        : { kind: "reachability-only", status: 200 },
    };
  }
  
  if (Array.isArray(payload)) {
    return { observation: { kind: "reachability-only", status: 200 } };
  }
  
  return { observation: { kind: "reachability-only", status: 200 } };
}

export function deriveProofStatus(
  observation: ProofObservation,
  sandbox = false,
): ProofStatus {
  if (observation.kind === "no-route") return "Not started";
  if (observation.kind === "failed") return "Degraded";
  if (sandbox && observation.kind !== "not-called") return "Simulated";
  switch (observation.kind) {
    case "not-called":
      return "Needs proof";
    case "reachability-only":
    case "static-assertion":
    case "measured":
    case "local-receipt":
      return "Live";
    case "source-of-truth":
      // Signed != Verified. We only return Verified if the client independently confirmed the binding.
      return observation.verified ? "Verified" : "Live";
  }
}
