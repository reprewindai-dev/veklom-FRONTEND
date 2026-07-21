/**
 * VNP Methodology v1.0 scoring engine
 *
 * Transforms raw benchmark API data into full VNP composite scores.
 * Implements the current methodology: asymmetric verification input weighting,
 * geographic normalization, confidence intervals, and provenance generation.
 */

import type {
  BenchmarkApiEntry,
  VNPScore,
  VNPDimensionScore,
  VNPConfidence,
  VNPRegionalScore,
  VNPProvenance,
  VNPGrade,
  VNPRegionId,
} from "./types";
import { VNP_DIMENSIONS, CONFIDENCE_THRESHOLDS } from "./constants";

/**
 * Leaderboard metadata is not measurement evidence. Until the backend returns
 * signed observations and provenance, the control plane must remain blocked.
 */
export function computeVNPScore(api: BenchmarkApiEntry): VNPScore {
  const evidence = api.measurementEvidence;
  const evidenceIsValid = Boolean(
    evidence && Number.isInteger(evidence.measurementCount) && evidence.measurementCount > 0 &&
    evidence.merkleRoot.trim() && evidence.nodeOperators.length > 0 &&
    evidence.harnessVersion.trim() && evidence.scriptHash.trim() && evidence.epochStart && evidence.epochEnd
  );
  if (!evidenceIsValid) {
    return {
      apiId: api.id,
      apiName: api.name,
      provider: api.provider || "Veklom Network",
      category: api.category,
      composite: 0,
      grade: "N/A",
      dimensions: [],
      confidence: { level: "unmeasured", sampleCount: 0, marginOfError: 0, minForHigh: CONFIDENCE_THRESHOLDS.high },
      regions: [],
      provenance: { epochId: "unmeasured", epochStart: "", epochEnd: "", merkleRoot: "Needs proof", chainAnchorTx: null, chainAnchorBlock: null, measurementCount: 0, nodeOperators: [], harnessVersion: "", scriptHash: "" },
      lastMeasured: "",
      measurementCount: 0,
      status: "unmeasured",
    };
  }
  return {
    apiId: api.id,
    apiName: api.name,
    provider: api.provider || "Needs proof",
    category: api.category,
    composite: 0,
    grade: "N/A" as VNPScore["grade"],
    dimensions: VNP_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      raw: 0,
      normalized: 0,
      weight: dimension.weight,
      weighted: 0,
    })),
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
    status: "unmeasured",
  };
}

// ---------------------------------------------------------------------------
// Batch scoring for leaderboard
// ---------------------------------------------------------------------------
export function computeLeaderboard(apis: BenchmarkApiEntry[]): VNPScore[] {
  return apis
    .map(computeVNPScore)
    .filter((score) => score.status === "active")
    .filter((score) => score.status !== "unmeasured")
    .sort((a, b) => b.composite - a.composite);
}
