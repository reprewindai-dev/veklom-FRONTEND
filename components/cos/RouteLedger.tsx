import { Activity, ArrowUpRight, CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import type { StageCallRecord } from "@/lib/cos/useStageData";
import { ProofBadge } from "./ProofBadge";

export function RouteLedger({ records }: { records: StageCallRecord[] }) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-cos-border bg-cos-surface2/75 shadow-cos-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cos-border px-5 py-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-accent">
            <Activity size={13} /> Route ledger
          </div>
          <p className="mt-1 text-xs text-cos-muted">Every claim on this section names the route that produced it.</p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Evidence surface</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead className="border-b border-cos-border/80 bg-cos-bg/40 font-mono text-[9px] uppercase tracking-[0.16em] text-cos-steel">
            <tr><th className="px-5 py-3">Route</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Latency</th><th className="px-3 py-3">Proof</th><th className="px-5 py-3 text-right">Source</th></tr>
          </thead>
          <tbody className="divide-y divide-cos-border/70">
            {records.map((record) => (
              <tr key={`${record.method} ${record.path}`} className="text-xs">
                <td className="px-5 py-4"><div className="flex items-center gap-2"><span className="rounded border border-cos-accent/25 px-1.5 py-0.5 font-mono text-[9px] text-cos-accent">{record.method}</span><code className="font-mono tabular-nums text-cos-text">{record.path}</code></div>{record.error && <div className="mt-1 max-w-xl text-[11px] text-cos-warn">{record.error}</div>}</td>
                <td className="px-3 py-4 font-mono tabular-nums text-cos-muted">{record.status ?? "—"}</td>
                <td className="px-3 py-4 font-mono tabular-nums text-cos-muted">{record.latencyMs !== undefined ? `${record.latencyMs} ms` : "—"}</td>
                <td className="px-3 py-4"><ProofBadge status={record.proof} /></td>
                <td className="px-5 py-4 text-right">
                  {record.proof === "Verified" ? <CircleCheck size={15} className="ml-auto text-cos-verified" aria-label="Source-of-truth response" /> : record.proof === "Degraded" ? <CircleAlert size={15} className="ml-auto text-cos-warn" aria-label="Route degraded" /> : record.proof === "Not started" ? <CircleDashed size={15} className="ml-auto text-cos-steel" aria-label="Route not started" /> : <ArrowUpRight size={15} className="ml-auto text-cos-steel" aria-label="Route observation" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
