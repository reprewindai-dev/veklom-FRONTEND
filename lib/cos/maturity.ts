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
// The first recorded run on veklom.com itself: a signed-in account, every stamp the server's own
// answer (deny without grant, grant with ledger anchoring confirmed, forbidden action refused,
// execute once with receipt, independent re-read, replay refused, revoke, refused after revoke,
// Terminal whoami/tools/discover/verify-by-hash → verified: true). Evidence: DEMO_FREEZE_2026-10-10.
const PROD = "Recorded run on veklom.com, 2026-10-10 (production, signed-in account)";

export const stageMaturity: Record<StageId, StageMaturity> = {
  capabilities: {
    status: "Proven in production",
    summary: "The capability packages offered in Mount are served live, including which target each may act on. The baseline capability list on this page is part of the product, not a live feed.",
    evidence: `${PROD}; ${RUNS}`,
  },
  mount: {
    status: "Proven in production",
    summary: "Choosing a package and binding its scope is the first step of every recorded run. A binding grants nothing on its own.",
    evidence: `${PROD}; ${RUNS}`,
  },
  blueprint: {
    status: "Proven in production",
    summary: "Your plain-English outcome becomes a contract bound to the exact operation, before any authority exists.",
    evidence: `${PROD}; ${RUNS}`,
  },
  govern: {
    status: "Partly proven",
    summary: "Coverage against the live catalog is proven. The generated pipeline code does not yet carry the exact bound operation.",
    evidence: RUNS,
  },
  authority: {
    status: "Proven in production",
    summary: "A grant covers one exact operation on one resource and one target, and is used up after one consequence; revoked grants are refused. 23 attempts to stretch, reuse or forge authority were refused on staging. On veklom.com the grant was requested from this page, with ledger anchoring confirmed.",
    evidence: `${PROD}; ${RUNS}; hostile battery 23/23`,
  },
  execute: {
    status: "Proven in production",
    summary: "With no authority: refused. With exact authority: done once. Retained, revoked or replayed authority: refused. Each checked against the target's own data.",
    evidence: `${PROD}; ${RUNS}`,
  },
  evidence: {
    status: "Partly proven",
    summary: "Receipts, ledger anchoring and verification by event hash are proven on veklom.com (from Execute and the Terminal). This page's own lookups have not yet been exercised in a recorded run.",
    evidence: PROD,
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
    status: "Proven in production",
    summary: "whoami, tools, discover, verify-by-hash (verified: true) and held were typed on veklom.com and answered by the governed tool server. Consequential tools still need a single-use grant.",
    evidence: PROD,
  },
  settings: {
    status: "Needs proof",
    summary: "Account comes from the identity service and the MCP connection is the live tool server; model keys, API keys, webhooks and integrations are not served by any Veklom service yet.",
  },
};

export function getStageMaturity(id: StageId): StageMaturity {
  return stageMaturity[id] ?? { status: "Needs proof", summary: "Not yet exercised in a recorded run." };
}
