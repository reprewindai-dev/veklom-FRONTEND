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
    summary: "Choosing a package and binding its scope is the first step of every recorded run. A binding grants nothing on its own.",
    evidence: RUNS,
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
    status: "Proven on staging",
    summary: "A grant covers one exact operation on one resource and one target, and is used up after one consequence; revoked grants are refused. 23 attempts to stretch, reuse or forge authority were refused. Recorded when this step was performed from the Mount page; not yet re-recorded here.",
    evidence: `${RUNS}; hostile battery 23/23`,
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
  registry: {
    status: "Partly proven",
    summary: "The package catalog listed here is the one every recorded run mounted from. Signed beacons are live but not part of the recorded proof.",
    evidence: RUNS,
  },
  marketplace: {
    status: "Needs proof",
    summary: "Not yet exercised in a recorded run. Installing hands a package to Mount; it grants nothing.",
  },
  harnesses: {
    status: "Partly proven",
    summary: "The package-to-target binding and the independent target readback are the ones used in every recorded run.",
    evidence: RUNS,
  },
  contracts: {
    status: "Partly proven",
    summary: "Contracts compiled in Blueprint carried the bound operation in every recorded run. Checking a pasted contract here has not been recorded.",
    evidence: RUNS,
  },
  verification: {
    status: "Partly proven",
    summary: "The ledger lookups here are the ones the recorded runs used from Execute. The ledger is hash-chain verified; signature verification is not yet proven. Repository scanning is not connected.",
    evidence: RUNS,
  },
  settings: {
    status: "Needs proof",
    summary: "Account, keys, wallet and webhooks are served by the identity service; this page has not been exercised in a recorded run.",
  },
};

export function getStageMaturity(id: StageId): StageMaturity {
  return stageMaturity[id] ?? { status: "Needs proof", summary: "Not yet exercised in a recorded run." };
}
