import type { ProofStatus } from "./capabilities";

export type ProofObservation =
  | { kind: "not-called" }
  | { kind: "no-route" }
  | { kind: "failed"; status?: number }
  | { kind: "reachability-only"; status: number }
  | { kind: "source-of-truth"; status: number; signed?: boolean };

export function deriveProofStatus(
  observation: ProofObservation,
  sandbox = false,
): ProofStatus {
  if (observation.kind === "no-route") return "Not started";
  if (sandbox && observation.kind !== "not-called") return "Simulated";
  switch (observation.kind) {
    case "not-called":
      return "Needs proof";
    case "failed":
      return "Degraded";
    case "reachability-only":
      return "Present";
    case "source-of-truth":
      return "Verified";
  }
}
