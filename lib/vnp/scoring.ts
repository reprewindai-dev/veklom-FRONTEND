/**
 * VNP Methodology v1.0 scoring engine
 *
 * Keeps aggregate benchmark telemetry separate from trace-backed VNP scores.
 */

import type {
  BenchmarkApiEntry,
  VNPScore,
} from "./types";
import { CONFIDENCE_THRESHOLDS } from "./constants";

/**
 * Leaderboard metadata is not measurement evidence. Until the backend returns
 * signed observations and provenance, the control plane must remain blocked.
 *
 * The backend input that would change this is a signed observation set with a
 * named harness, operators, epoch bounds, and a verifiable Merkle root.
 */
export function computeVNPScore(api: BenchmarkApiEntry): VNPScore {
  return {
    apiId: api.id,
    apiName: api.name,
    provider: api.provider || "Unknown",
    category: "Unknown",
    composite: null,
    grade: "N/A" as VNPScore["grade"],
    dimensions: [],
    confidence: {
      level: "unmeasured",
      sampleCount: 0,
      marginOfError: 0,
      minForHigh: CONFIDENCE_THRESHOLDS.high,
    },
    regions: [],
    provenance: {
      epochId: "Needs proof",
      epochStart: "",
      epochEnd: "",
      merkleRoot: "Needs proof",
      chainAnchorTx: null,
      chainAnchorBlock: null,
      measurementCount: 0,
      nodeOperators: [],
      harnessVersion: "Needs proof",
      scriptHash: "Needs proof",
    },
    lastMeasured: "",
    measurementCount: 0,
    telemetrySampleCount: api.sampleCount,
    status: "unmeasured",
  };
}

// ---------------------------------------------------------------------------
// Batch scoring for leaderboard
// ---------------------------------------------------------------------------
export function computeLeaderboard(_apis: BenchmarkApiEntry[]): VNPScore[] {
  // No signed observations are available yet, so no score can be produced.
  return [];
}
