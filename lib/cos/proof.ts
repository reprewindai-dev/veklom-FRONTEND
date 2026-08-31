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

function payloadDeclaresVerifiedProof(payload: Record<string, unknown>): boolean {
  const evidenceClass = typeof payload.evidence_class === "string" ? payload.evidence_class.toUpperCase() : "";
  const proofState = typeof payload.proofState === "string" ? payload.proofState.toLowerCase() : "";
  const truthState = typeof payload.truth_state === "string" ? payload.truth_state.toLowerCase() : "";
  const signature = payload.signature ?? payload.signature_id ?? payload.evidence_signature;
  
  if (evidenceClass === "VERIFIED_EVIDENCE") return true;
  return (proofState === "verified" || truthState === "verified") && Boolean(signature);
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
    
    if (evidenceClass === "SIGNED_EVIDENCE" || payloadDeclaresVerifiedProof(payload)) {
      return { 
        observation: { 
          kind: "source-of-truth", 
          status: 200, 
          signed: true,
          verified: evidenceClass === "VERIFIED_EVIDENCE" 
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
        : { kind: "reachability-only", status: 200 }, // Degrade arbitrary JSON from "Live" source-of-truth to reachability-only
    };
  }
  
  if (Array.isArray(payload)) {
    return { observation: { kind: "reachability-only", status: 200 } }; // Downgraded from source-of-truth
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
      return "Live";
    case "static-assertion":
      return "Live"; // Represents Route Live + Static metadata
    case "measured":
      return "Live"; // Represents Route Live + Observed values
    case "local-receipt":
      return "Live"; // Represents Route Live + Local execution record
    case "source-of-truth":
      return observation.verified ? "Verified" : (observation.signed ? "Verified" : "Live");
  }
}
