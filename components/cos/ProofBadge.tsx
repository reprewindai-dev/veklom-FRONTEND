import type { ProofStatus } from "@/lib/cos/capabilities";

const styles: Record<ProofStatus, string> = {
  Verified: "border-cos-verified/30 bg-cos-verified/10 text-cos-verified",
  "Needs proof": "border-cos-unknown/30 bg-cos-unknown/10 text-cos-unknown",
  Present: "border-cos-info/30 bg-cos-info/10 text-cos-info",
  Degraded: "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  "Not started": "border-cos-unknown/30 bg-cos-unknown/10 text-cos-unknown",
  "Manual step": "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  Simulated: "border-cos-danger/30 bg-cos-danger/10 text-cos-danger",
};

export function ProofBadge({ status }: { status: ProofStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${styles[status]}`}>
      {status}
    </span>
  );
}
