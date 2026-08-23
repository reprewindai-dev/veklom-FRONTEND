import { FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { ProofBadge } from "./ProofBadge";

export function EvidencePanel({ 
  title, 
  evidenceId,
  timestamp,
  status = "Needs proof"
}: { 
  title: string;
  evidenceId?: string;
  timestamp?: string;
  status?: "Verified" | "Needs proof" | "Live" | "Degraded" | "Not started" | "Manual step" | "Simulated";
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cos-border bg-cos-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-cos-accent" />
          <h3 className="font-medium text-cos-text">{title}</h3>
        </div>
        <ProofBadge status={status} />
      </div>
      <div className="mt-2 space-y-2 rounded border border-cos-border/50 bg-cos-surface2 p-3 text-xs">
        {evidenceId ? (
          <>
            <div className="flex justify-between">
              <span className="text-cos-muted">Receipt ID</span>
              <span className="font-mono text-cos-mono">{evidenceId}</span>
            </div>
            {timestamp && (
              <div className="flex justify-between">
                <span className="text-cos-muted">Timestamp</span>
                <span className="text-cos-text">{timestamp}</span>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1.5 text-cos-verified">
              <CheckCircle2 size={12} />
              <span>Cryptographically secured</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-cos-muted">
            <ShieldAlert size={14} />
            <span>No cryptographic evidence available</span>
          </div>
        )}
      </div>
    </div>
  );
}
