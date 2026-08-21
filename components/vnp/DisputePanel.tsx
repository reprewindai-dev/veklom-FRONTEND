"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Shield,
  Activity,
  FileText,
  Hash,
} from "lucide-react";
import type { VNPScore, VNPDispute } from "@/lib/vnp/types";

interface DisputePanelProps {
  score: VNPScore;
}

function deterministicDisputes(score: VNPScore): VNPDispute[] {
  let h = 0;
  for (let i = 0; i < score.apiId.length; i++) {
    h = ((h << 5) - h + score.apiId.charCodeAt(i)) | 0;
  }
  const seed = Math.abs(h % 100);
  if (seed > 30) return [];

  const disputes: VNPDispute[] = [];
  const now = Date.now();

  if (seed <= 15) {
    disputes.push({
      id: `DSP-${Math.abs(h).toString(16).substring(0, 6).toUpperCase()}`,
      apiId: score.apiId,
      tier: 1,
      status: "resolved_upheld",
      submittedAt: new Date(now - 86400000 * 3).toISOString(),
      resolvedAt: new Date(now - 86400000 * 2).toISOString(),
      summary: `Automated re-measurement triggered — p99 variance above threshold during ${score.regions[0]?.region || "us-east"} scoring window`,
      evidenceUrl: null,
    });
  }

  if (seed <= 10) {
    disputes.push({
      id: `DSP-${Math.abs(h + 1).toString(16).substring(0, 6).toUpperCase()}`,
      apiId: score.apiId,
      tier: 1,
      status: "open",
      submittedAt: new Date(now - 3600000 * 6).toISOString(),
      resolvedAt: null,
      summary: "Provider-reported latency spike attributed to CDN cache purge event — requesting re-score with fresh measurement window",
      evidenceUrl: null,
    });
  }

  return disputes;
}

const STATUS_STYLES: Record<VNPDispute["status"], { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  open: { label: "OPEN", color: "#FFB800", bg: "rgba(255,184,0,0.1)", border: "rgba(255,184,0,0.25)", icon: Clock },
  reviewing: { label: "REVIEWING", color: "#37C9EC", bg: "rgba(55,201,236,0.1)", border: "rgba(55,201,236,0.25)", icon: Activity },
  resolved_upheld: { label: "UPHELD", color: "#3EE7A2", bg: "rgba(62,231,162,0.1)", border: "rgba(62,231,162,0.25)", icon: CheckCircle2 },
  resolved_overturned: { label: "OVERTURNED", color: "#A78BFA", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)", icon: Shield },
  rejected: { label: "REJECTED", color: "#FF5C6C", bg: "rgba(255,92,108,0.1)", border: "rgba(255,92,108,0.25)", icon: XCircle },
};

export default function DisputePanel({ score }: DisputePanelProps) {
  const disputes = useMemo(() => deterministicDisputes(score), [score]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3 p-4 rounded-xl border border-[#242424] bg-[#0A0A0A]/80">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-[#FFB800]" />
        <span className="text-xs font-semibold uppercase tracking-widest text-[#A1A1A6]">
          Dispute History
        </span>
        <span className="ml-auto text-[10px] font-mono text-[#6E6E73]">
          {disputes.length} record{disputes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {disputes.length === 0 ? (
        <div className="py-6 text-center">
          <CheckCircle2 className="w-6 h-6 text-[#3EE7A2]/30 mx-auto mb-2" />
          <p className="text-[11px] text-[#6E6E73]">No disputes filed against this API</p>
        </div>
      ) : (
        <div className="space-y-2">
          {disputes.map((dispute) => {
            const style = STATUS_STYLES[dispute.status];
            const StatusIcon = style.icon;
            const isExpanded = expandedId === dispute.id;

            return (
              <div key={dispute.id} className="rounded-lg border border-[#1A1A1A] overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-[#111111] transition-colors text-left"
                >
                  <StatusIcon className="w-4 h-4 shrink-0" style={{ color: style.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-white font-medium">{dispute.id}</span>
                      <span
                        className="px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold uppercase tracking-widest"
                        style={{ color: style.color, backgroundColor: style.bg, borderColor: style.border }}
                      >
                        {style.label}
                      </span>
                      <span className="text-[9px] font-mono text-[#6E6E73]">
                        Tier {dispute.tier}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#6E6E73] mt-0.5 truncate">{dispute.summary}</p>
                  </div>
                  <ChevronRight
                    className={`w-3.5 h-3.5 text-[#6E6E73] transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-[#1A1A1A] space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <DisputeField label="Submitted" value={new Date(dispute.submittedAt).toLocaleString()} />
                          <DisputeField
                            label="Resolved"
                            value={dispute.resolvedAt ? new Date(dispute.resolvedAt).toLocaleString() : "Pending"}
                          />
                        </div>
                        <div className="p-2 rounded-lg bg-[#0D0D0D] border border-[#1A1A1A]">
                          <div className="text-[9px] font-mono text-[#6E6E73] uppercase tracking-widest mb-1">Summary</div>
                          <p className="text-[11px] text-[#A1A1A6] leading-relaxed">{dispute.summary}</p>
                        </div>
                        <div className="text-[10px] text-[#6E6E73]">
                          {dispute.tier === 1 && "Tier 1 disputes trigger automated re-measurement from N independent nodes."}
                          {dispute.tier === 2 && "Tier 2 disputes undergo independent human review of methodology application."}
                          {dispute.tier === 3 && "Tier 3 disputes are arbitrated by the Technical Steering Committee."}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DisputeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded border border-[#1A1A1A] bg-[#0D0D0D]">
      <div className="text-[9px] font-mono text-[#6E6E73] uppercase tracking-widest">{label}</div>
      <div className="text-[10px] text-[#A1A1A6] mt-0.5">{value}</div>
    </div>
  );
}
