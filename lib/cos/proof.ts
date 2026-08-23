import type { ProofStatus } from "./capabilities";

export type ProofObservation =
  | { kind: "not-called" }
  | { kind: "no-route" }
  | { kind: "failed"; status?: number }
  | { kind: "reachability-only"; status: number }
  | { kind: "source-of-truth"; status: number; signed?: boolean };

export interface PayloadClassification {
  observation: ProofObservation;
  reason?: string;
}

function isRecord(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === "object" && payload !== null && !Array.isArray(payload);
}

function payloadDeclaresVerifiedProof(payload: Record<string, unknown>): boolean {
  const proofState = typeof payload.proofState === "string" ? payload.proofState.toLowerCase() : "";
  const truthState = typeof payload.truth_state === "string" ? payload.truth_state.toLowerCase() : "";
  const signature = payload.signature ?? payload.signature_id ?? payload.evidence_signature;
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
  if (Array.isArray(payload)) {
    return { observation: { kind: "source-of-truth", status: 200 } };
  }
  if (isRecord(payload)) {
    const keys = Object.keys(payload);
    const metadataOnly = keys.length === 0 || keys.every((key) => (
      ["status", "message", "version", "service", "timestamp", "_runtimeMeta"].includes(key)
    ));
    return {
      observation: metadataOnly
        ? { kind: "reachability-only", status: 200 }
        : {
            kind: "source-of-truth",
            status: 200,
            signed: payloadDeclaresVerifiedProof(payload),
          },
    };
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
    case "source-of-truth":
      return observation.signed ? "Verified" : "Live";
  }
}
