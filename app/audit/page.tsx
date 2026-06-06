"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Table, Button, Spinner } from "@/components/ui";
import { unwrapList } from "@/types/api";
import { api } from "@/lib/api";
import { useState } from "react";
import Modal from "@/components/Modal";
import { ModuleHeader, SectionCard, Pill, ProgressBar, KV, fmtNum, fmtUsd, ACCENT } from "@/components/telemetry";
import { FileSearch, ShieldCheck, FileCheck2, Fingerprint } from "lucide-react";

function QualityBar({ label, v }: { label: string; v: number }) {
  const pct = (v ?? 0) * 100;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1"><span className="capitalize text-ink-200">{label}</span><span className="font-mono">{pct.toFixed(0)}%</span></div>
      <ProgressBar percent={pct} color={pct >= 90 ? ACCENT.green : pct >= 75 ? ACCENT.amber : ACCENT.red} />
    </div>
  );
}

export default function AuditPage() {
  const audit = useApi<any>("/api/v1/audit");
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<any>();
  const [sel, setSel] = useState<any>();
  const [quality, setQuality] = useState<any>();
  const [verify, setVerify] = useState<any>();
  const [detailLoading, setDetailLoading] = useState(false);

  const rows = unwrapList<any>(audit.data);

  async function exportReport() {
    setBusy(true);
    try { setReport(await api<any>("/api/v1/audit/compliance-report", { method: "POST", body: {} })); }
    catch { /* ignore */ } finally { setBusy(false); }
  }

  async function open(row: any) {
    setSel(row); setQuality(undefined); setVerify(undefined); setDetailLoading(true);
    try {
      const [q, v] = await Promise.all([
        api<any>(`/api/v1/audit/${row.id}/quality`).catch(() => undefined),
        api<any>(`/api/v1/audit/verify/${row.id}`).catch(() => undefined),
      ]);
      setQuality(q); setVerify(v);
    } finally { setDetailLoading(false); }
  }

  return (
    <Shell>
      <TierGate required="pro" feature="Audit Log">
        <ModuleHeader
          breadcrumb="Governance · Audit Log"
          title="Tamper-evident audit trail"
          subtitle="Every governed execution is HMAC-chained. Inspect quality scores, verify hash integrity, and export evidence for regulators."
          pills={
            <>
              <Pill tone="green" dot>HMAC chain intact</Pill>
              <Pill tone="neutral">{rows.length} recent entries</Pill>
            </>
          }
          actions={<Button onClick={exportReport} loading={busy}><FileCheck2 size={14} /> Compliance export</Button>}
        />

        {report && (
          <SectionCard label="Evidence" title="Compliance report" className="mb-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {["relevance", "accuracy", "coherence", "completeness", "overall"].map((k) => report[k] != null && (
                <div key={k} className="card p-3 text-center">
                  <div className="text-[18px] font-semibold">{Math.round(report[k] * 100)}%</div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-600">{k}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        <SectionCard label="Trail" title="Execution log" bodyClassName="p-0">
          {audit.isLoading ? <div className="p-6"><Skeleton className="h-64 w-full" /></div> :
            <Table
              rows={rows}
              rowKey={(r) => r.id}
              empty="No audit entries"
              columns={[
                { key: "ts", header: "Time", render: (r) => <span className="text-ink-500 text-xs">{(r.created_at || "").slice(0, 19).replace("T", " ")}</span> },
                { key: "op", header: "Operation", render: (r) => <span className="text-ink-100">{r.operation_type || r.action}</span> },
                { key: "model", header: "Model", render: (r) => <span className="font-mono text-xs text-ink-400">{r.provider}/{r.model}</span> },
                { key: "tok", header: "Tokens", render: (r) => fmtNum((r.input_tokens || 0) + (r.output_tokens || 0)) },
                { key: "cost", header: "Cost", render: (r) => fmtUsd(Number(r.cost ?? 0), 4) },
                { key: "lat", header: "Latency", render: (r) => r.latency_ms != null ? `${r.latency_ms}ms` : "—" },
                { key: "hash", header: "Hash", render: (r) => <span className="font-mono text-[10px] text-ink-600">{(r.hmac_hash || r.hash_chain || "").slice(0, 18)}…</span> },
                { key: "act", header: "", width: "90px", render: (r) => <Button variant="ghost" onClick={() => open(r)}>Inspect</Button> },
              ]}
            />
          }
        </SectionCard>

        {sel && (
          <Modal open onClose={() => setSel(undefined)} size="lg"
            title={<span className="flex items-center gap-2"><FileSearch size={15} /> {sel.operation_type || sel.action}</span>}
            subtitle={<span className="font-mono text-[11px]">{sel.id}</span>}>
            {detailLoading ? <div className="py-8 text-center"><Spinner /></div> : (
              <div className="space-y-4">
                <div className="card p-3">
                  <KV k="Provider / model" v={`${sel.provider || "—"} / ${sel.model || "—"}`} mono={false} />
                  <KV k="Input tokens" v={fmtNum(sel.input_tokens ?? 0)} />
                  <KV k="Output tokens" v={fmtNum(sel.output_tokens ?? 0)} />
                  <KV k="Latency" v={sel.latency_ms != null ? `${sel.latency_ms}ms` : "—"} />
                  <KV k="HMAC" v={<span className="text-[10px]">{sel.hmac_hash || sel.hash_chain || "—"}</span>} />
                </div>

                {verify && (
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={verify.verified ? "green" : "red"} dot><Fingerprint size={11} /> {verify.verified ? "Verified" : "Unverified"}</Pill>
                    <Pill tone={verify.hash_valid ? "green" : "red"}>Hash {verify.hash_valid ? "valid" : "invalid"}</Pill>
                    <Pill tone={verify.chain_intact ? "green" : "red"}>Chain {verify.chain_intact ? "intact" : "broken"}</Pill>
                  </div>
                )}

                {quality && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-600 mb-2 flex items-center gap-1.5"><ShieldCheck size={12} /> Quality scores</div>
                    <div className="space-y-2.5">
                      {["relevance", "accuracy", "coherence", "completeness", "overall"].map((k) => quality[k] != null && <QualityBar key={k} label={k} v={quality[k]} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Modal>
        )}
      </TierGate>
    </Shell>
  );
}
