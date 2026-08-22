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
      sampleCount: api.sampleCount,
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
      measurementCount: api.sampleCount,
      nodeOperators: [],
      harnessVersion: "Needs proof",
      scriptHash: "Needs proof",
    },
    lastMeasured: "",
    measurementCount: api.sampleCount,
    status: "unmeasured",
  };
}

// ---------------------------------------------------------------------------
// Batch scoring for leaderboard
// ---------------------------------------------------------------------------
export function computeLeaderboard(apis: BenchmarkApiEntry[]): VNPScore[] {
  return apis
    .map(computeVNPScore)
    .filter((score) => score.status === "active");
}
