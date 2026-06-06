"use client";

import { useState } from "react";
import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Table, Button, ErrorBox } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, Field, Select, ProgressBar, ACCENT } from "@/components/telemetry";
import { unwrapList } from "@/types/api";
import { api } from "@/lib/api";
import { FileCheck2, CheckCircle2, AlertTriangle } from "lucide-react";

const REGS = ["gdpr", "ccpa", "soc2", "hipaa"].map((r) => ({ value: r, label: r.toUpperCase() }));

export default function CompliancePage() {
  const frameworks = useApi<any>("/api/v1/compliance/frameworks");
  const checks = useApi<any>("/api/v1/compliance/checks");
  const [busy, setBusy] = useState(false);

  const [reg, setReg] = useState("gdpr");
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-12-31");
  const [genBusy, setGenBusy] = useState(false);
  const [genErr, setGenErr] = useState<string>();
  const [report, setReport] = useState<any>();

  async function generate() {
    setGenBusy(true); setGenErr(undefined);
    try {
      setReport(await api("/api/v1/compliance/report", { method: "POST", body: { regulation: reg, start_date: start, end_date: end } }));
    } catch (e) { setGenErr((e as Error).message); } finally { setGenBusy(false); }
  }

  async function exportEvidence(frameworkId: string) {
    setBusy(true);
    try {
      const res = await api<any>(`/api/v1/compliance/evidence/${frameworkId}/export`, { method: "POST", body: {} });
      if (res?.url) window.open(res.url, "_blank");
    } catch {} finally { setBusy(false); }
  }

  const score = report?.compliance_score;
  const findings: any[] = Array.isArray(report?.findings) ? report.findings : [];
  const recs: any[] = Array.isArray(report?.recommendations) ? report.recommendations : [];

  return (
    <Shell>
      <TierGate required="sovereign" feature="Compliance">
        <ModuleHeader
          breadcrumb="Governance · Compliance"
          title="Operational evidence — not a marketing page"
          subtitle="Generate signed, on-demand compliance reports from your real audit trail. Pre-wired control mappings across frameworks."
          pills={<><Pill tone="green">HMAC-SHA256 audit</Pill><Pill tone="cyan">GDPR · CCPA · SOC2 · HIPAA</Pill></>}
        />

        {/* Report generator */}
        <SectionCard className="mb-4" label="Live engine · /compliance/report" title="Compliance report generator"
          actions={<FileCheck2 size={15} className="text-brand-400" />}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Field label="Regulation"><Select value={reg} onChange={setReg} options={REGS} /></Field>
            <Field label="Start date"><input className="input" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="End date"><input className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
            <div className="flex items-end"><Button onClick={generate} loading={genBusy} className="w-full">Generate report</Button></div>
          </div>
          {genErr && <div className="mt-3"><ErrorBox message={genErr} /></div>}
          {report && !genErr && (
            <div className="mt-4 rounded-xl border border-border bg-white/[0.02] p-5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-600">{report.regulation} · {report.period}</div>
                  <div className="text-3xl font-semibold tracking-tight tabular-nums mt-1">{score != null ? `${score}%` : "—"}</div>
                </div>
                <Pill tone={score >= 90 ? "green" : score >= 70 ? "amber" : "red"}>{score >= 90 ? "Audit-ready" : score >= 70 ? "In progress" : "Action needed"}</Pill>
              </div>
              <div className="mt-3"><ProgressBar percent={score || 0} color={score >= 90 ? ACCENT.green : ACCENT.amber} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-2">Findings</div>
                  <ul className="space-y-2">
                    {findings.length === 0 ? <li className="text-sm text-ink-600">No findings</li> :
                      findings.slice(0, 6).map((f, i) => (
                        <li key={i} className="flex gap-2 text-[13px] text-ink-200">
                          <AlertTriangle size={13} className="mt-0.5 text-accent-amber shrink-0" />
                          <span>{typeof f === "string" ? f : f.title || f.message || JSON.stringify(f)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-2">Recommendations</div>
                  <ul className="space-y-2">
                    {recs.length === 0 ? <li className="text-sm text-ink-600">None</li> :
                      recs.slice(0, 6).map((r, i) => (
                        <li key={i} className="flex gap-2 text-[13px] text-ink-200">
                          <CheckCircle2 size={13} className="mt-0.5 text-accent-green shrink-0" />
                          <span>{typeof r === "string" ? r : r.title || r.message || JSON.stringify(r)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
              {report.generated_at && <div className="text-[10px] text-ink-600 mt-4 font-mono">Generated {report.generated_at}</div>}
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard label="Frameworks" title="Control coverage">
            {frameworks.isLoading ? <Skeleton className="h-32 w-full" /> :
              <Table
                rows={unwrapList<any>(frameworks.data)}
                rowKey={(r) => r.id || r.framework_id}
                empty="No frameworks configured"
                columns={[
                  { key: "name", header: "Framework", render: (r) => r.name || r.id },
                  { key: "coverage", header: "Coverage", render: (r) => `${r.coverage ?? "—"}${r.coverage ? "%" : ""}` },
                  { key: "actions", header: "", render: (r) => <Button variant="ghost" onClick={() => exportEvidence(r.id || r.framework_id)} disabled={busy}>Export</Button>, width: "110px" },
                ]}
              />
            }
          </SectionCard>
          <SectionCard label="Controls · live test status" title="Recent checks">
            {checks.isLoading ? <Skeleton className="h-32 w-full" /> :
              <Table
                rows={unwrapList<any>(checks.data).slice(0, 20)}
                rowKey={(r) => r.id || JSON.stringify(r).slice(0, 24)}
                empty="No checks run"
                columns={[
                  { key: "name", header: "Control", render: (r) => r.name || r.rule },
                  { key: "ts", header: "Last test", render: (r) => <span className="text-ink-500 text-xs font-mono">{r.ts || r.created_at || "—"}</span> },
                  { key: "result", header: "Status", render: (r) => <Pill tone={r.passed ? "green" : "red"}>{r.passed ? "Passing" : "Review"}</Pill> },
                ]}
              />
            }
          </SectionCard>
        </div>
      </TierGate>
    </Shell>
  );
}
