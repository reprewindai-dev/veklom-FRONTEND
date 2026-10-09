import type { StageId } from "@/lib/cos/stages";

/**
 * What is proven today, per Capability OS page: the stable marker a visitor can trust.
 * Separate from the live per-session telemetry on each panel (ProofBadge).
 *
 * Rules: a status names its evidence. "Proven on staging" means demonstrated end to end in
 * recorded runs on the staging stack. Nothing is marked proven in production until a
 * production run is recorded. Update this file only together with new evidence.
 */
export type MaturityStatus = "Proven in production" | "Proven on staging" | "Partly proven" | "Needs proof";

export interface StageMaturity {
  status: MaturityStatus;
  summary: string;
  evidence?: string;
}

const RUNS = "Recorded runs 001–005 (14/14 steps each), staging, 2026-10-08";

export const stageMaturity: Record<StageId, StageMaturity> = {
  capabilities: {
    status: "Proven on staging",
    summary: "The capability packages offered in Mount are served live, including which target each may act on. The baseline capability list on this page is part of the product, not a live feed.",
    evidence: RUNS,
  },
  mount: {
    status: "Proven on staging",
    summary: "A mount grants one exact operation on one resource and one target, and is used up after one consequence. 23 attempts to stretch, reuse or forge authority were refused.",
    evidence: `${RUNS}; hostile battery 23/23`,
  },
  blueprint: {
    status: "Proven on staging",
    summary: "Your plain-English outcome becomes a contract bound to the exact operation, before any authority exists.",
    evidence: RUNS,
  },
  govern: {
    status: "Partly proven",
    summary: "Coverage against the live catalog is proven. The generated pipeline code does not yet carry the exact bound operation.",
    evidence: RUNS,
  },
  authority: {
    status: "Needs proof",
    summary: "This page has not yet been exercised in a recorded run.",
  },
  execute: {
    status: "Proven on staging",
    summary: "With no authority: refused. With exact authority: done once. Retained, revoked or replayed authority: refused. Each checked against the target's own data.",
    evidence: RUNS,
  },
  evidence: {
    status: "Needs proof",
    summary: "Receipts and ledger anchoring are proven from the Execute page; this page itself has not yet been exercised in a recorded run.",
  },
  measure: {
    status: "Needs proof",
    summary: "Not yet exercised in a recorded run.",
  },
  settle: {
    status: "Needs proof",
    summary: "Not yet exercised in a recorded run.",
  },
  tracker: {
    status: "Needs proof",
    summary: "Not yet exercised in a recorded run.",
  },
  computeless: {
    status: "Needs proof",
    summary: "Diagnostics only. Not part of the recorded proof.",
  },
  terminal: {
    status: "Needs proof",
    summary: "Not yet exercised in a recorded run.",
  },
};

export function getStageMaturity(id: StageId): StageMaturity {
  return stageMaturity[id] ?? { status: "Needs proof", summary: "Not yet exercised in a recorded run." };
}
