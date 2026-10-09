import Link from "next/link";

/**
 * Plain-language orientation for a first-time visitor: how to run one real action, what works
 * today, and what is not built yet. Every "works today" line was exercised end to end on staging
 * (2026-10-09); "coming next" items are named as not available so a disabled control never looks
 * like a broken one.
 */
const FIRST_ACTION = [
  { step: "Blueprint", route: "/os/blueprint", text: "Describe what you want in plain words, compile it, and bind the exact step to run." },
  { step: "Mount, then Authority", route: "/os/mount", text: "Bind that step and request one single-use grant for it." },
  { step: "Execute, then Evidence", route: "/os/execute", text: "Run it once, get a receipt, and check the receipt in the ledger yourself." },
];

const WORKS_TODAY = [
  "Sign up, workspaces and agent registration",
  "Contracts from Blueprint, single-use grants and execution with receipts",
  "Blocked actions, retries and replays refused, with the reason shown",
  "Capabilities: Governed Counter, Protected records, Document Reader (PDF and text), PII Redaction",
  "Private Cloud on your own machines (limited beta)",
];

const COMING_NEXT = [
  "Run one action straight from Mount, without Blueprint",
  "Upload a document in the browser for the Document Reader (it works through the API today)",
  "Live measurements in Measure (probe nodes are not reporting yet)",
  "API keys, webhooks and Slack approvals",
];

export function GettingStarted() {
  return (
    <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="rounded-xl border border-cos-accent/30 bg-cos-accent/[0.04] p-5">
        <h2 className="text-sm font-semibold text-cos-text">Run your first real action</h2>
        <ol className="mt-3 space-y-2 text-xs leading-5 text-cos-muted">
          {FIRST_ACTION.map((item, index) => (
            <li key={item.step}>
              <span className="mr-2 font-mono text-cos-accent">{index + 1}.</span>
              <Link href={item.route} className="font-semibold text-cos-text underline">{item.step}</Link>: {item.text}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[11px] text-cos-steel">Every page also says, under its title, what to do there and where to go next.</p>
      </div>
      <div className="rounded-xl border border-cos-border bg-cos-surface2/60 p-5 text-xs leading-5">
        <h2 className="text-sm font-semibold text-cos-text">What works today</h2>
        <ul className="mt-2 space-y-1 text-cos-muted">{WORKS_TODAY.map((item) => <li key={item}>✓ {item}</li>)}</ul>
        <h2 className="mt-4 text-sm font-semibold text-cos-text">Coming next (not available yet)</h2>
        <ul className="mt-2 space-y-1 text-cos-steel">{COMING_NEXT.map((item) => <li key={item}>○ {item}</li>)}</ul>
      </div>
    </div>
  );
}
