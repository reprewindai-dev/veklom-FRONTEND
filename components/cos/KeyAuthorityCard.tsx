import { Key } from "lucide-react";
import { ProofBadge } from "./ProofBadge";

export function KeyAuthorityCard({ 
  title, 
  keyId, 
  role,
  status = "Live"
}: { 
  title: string;
  keyId: string;
  role: string;
  status?: "Verified" | "Needs proof" | "Live" | "Degraded" | "Not started" | "Manual step" | "Simulated";
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-cos-border bg-cos-surface p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-cos-accent" />
          <h3 className="font-medium text-cos-text">{title}</h3>
        </div>
        <ProofBadge status={status} />
      </div>
      <div className="mt-2 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-cos-muted">Authority Role</span>
          <span className="text-cos-text">{role}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-cos-muted">Key Identifier</span>
          <span className="font-mono text-cos-mono">{keyId}</span>
        </div>
      </div>
    </div>
  );
}
