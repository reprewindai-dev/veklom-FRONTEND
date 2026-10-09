import type { StageId } from "./stages";

/**
 * One-line "how to use this page" guidance, shown under each page's purpose.
 * Plain words for a first-time visitor: what to do here, what it needs first, where to go next.
 * Keep each line true to what the page does today; anything not built yet is named as such.
 */
export interface StageGuide {
  /** What to do on this page, in one sentence. */
  howTo: string;
  /** What must exist first, if anything. */
  needs?: string;
  /** Where to go next. */
  next?: { label: string; route: string };
}

export const stageGuides: Partial<Record<StageId, StageGuide>> = {
  capabilities: {
    howTo: "Start here. To run a real action: describe it in Blueprint, then follow Mount, Authority and Execute.",
    next: { label: "Blueprint", route: "/os/blueprint" },
  },
  blueprint: {
    howTo: "Write the outcome in plain words and compile it. On the step you want to run, enter the resource and inputs, choose Bind exact operation, then Use this operation and Mount it.",
    next: { label: "Mount", route: "/os/mount" },
  },
  govern: {
    howTo: "Lay a multi-step plan out as a pipeline on the canvas and see which steps the live catalog covers. Building a pipeline grants nothing.",
    next: { label: "Mount", route: "/os/mount" },
  },
  mount: {
    howTo: "Choose a capability, check the scope (project, actions, resource), then Bind and request authority.",
    needs: "To run an action afterwards, start from an operation bound in Blueprint. A one-step shortcut on this page is planned.",
    next: { label: "Authority", route: "/os/authority" },
  },
  authority: {
    howTo: "Request the single-use grant for what you prepared in Mount and compare what you asked for with what was granted. You hold one grant at a time; revoke it to start another.",
    needs: "A binding prepared in Mount.",
    next: { label: "Execute", route: "/os/execute" },
  },
  execute: {
    howTo: "Run the exact operation your grant covers, once. Retries and replays are refused by design, and you can re-read the target to check the result.",
    needs: "A grant for an operation bound in Blueprint.",
    next: { label: "Evidence", route: "/os/evidence" },
  },
  evidence: {
    howTo: "Look up the receipt from Execute and check its record in the tamper-evident ledger yourself.",
    needs: "A receipt from an executed action.",
  },
  measure: {
    howTo: "Measurements of the systems your capabilities depend on appear here once probe nodes report. No probe nodes are reporting yet.",
  },
  settle: {
    howTo: "Payment requirements and settlement records for paid actions. Nothing here is charged without a checkout you complete.",
  },
  tracker: {
    howTo: "What needs attention: it compares your grant, receipt and the target's own state, and flags anything that does not line up.",
  },
  registry: { howTo: "Every capability the live registry serves, with its signed advertisement checked. Listing a capability grants nothing." },
  marketplace: { howTo: "Browse capabilities and add them to this workspace. Installing grants nothing; each action still needs its own grant." },
  harnesses: { howTo: "The targets each capability is allowed to act on, as declared by the registry." },
  contracts: { howTo: "Contracts compiled in Blueprint, with their hashes, so you can check what was intended before anything ran." },
  verification: { howTo: "Re-check receipts and ledger records independently of the page that produced them." },
  computeless: { howTo: "Your own machines as governed compute: register them, place work, and see results. Machines hold no authority of their own." },
  terminal: { howTo: "Type directives that run through the same governed tools machines use. A refusal is final and never retried." },
  settings: { howTo: "Your account and wallet. API keys and webhooks are not available yet." },
};
