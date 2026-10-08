import type { ProofStatus } from "@/lib/cos/capabilities";

const styles: Record<ProofStatus, string> = {
  Verified: "border-cos-verified/30 bg-cos-verified/10 text-cos-verified",
  Live: "border-cos-info/30 bg-cos-info/10 text-cos-info",
  "Needs proof": "border-cos-unknown/30 bg-cos-unknown/10 text-cos-unknown",
  Present: "border-cos-present/30 bg-cos-present/10 text-cos-present",
  Degraded: "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  "Not started": "border-cos-unknown/30 bg-cos-unknown/10 text-cos-unknown",
  "Manual step": "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  Simulated: "border-cos-danger/30 bg-cos-danger/10 text-cos-danger",
};

// What a first-time visitor reads. The internal status (what the page has actually observed
// in this session) is unchanged; only its wording is plain language. "Needs proof" read as
// "this product is unproven", when it only means nothing has happened here yet.
export const proofLabels: Record<ProofStatus, string> = {
  Verified: "Verified",
  Live: "Live",
  "Needs proof": "Not observed yet",
  Present: "Observed",
  Degraded: "Problem",
  "Not started": "Not started",
  "Manual step": "Manual step",
  Simulated: "Simulated",
};

export const proofExplanations: Record<ProofStatus, string> = {
  Verified: "Checked independently, not just reported by the service that did the work.",
  Live: "A real response just came back from the running service.",
  "Needs proof": "Nothing has happened here yet in your session. This changes only when a real response comes back.",
  Present: "A real response came back and is shown here.",
  Degraded: "A response came back, but something is wrong. The details are shown here.",
  "Not started": "This step has not been started.",
  "Manual step": "This step needs a person to act.",
  Simulated: "Simulated, not a real result. Labelled so it is never mistaken for one.",
};

export function ProofBadge({ status }: { status: ProofStatus }) {
  return (
    <span
      title={proofExplanations[status]}
      className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${styles[status]}`}
    >
      {proofLabels[status]}
    </span>
  );
}
