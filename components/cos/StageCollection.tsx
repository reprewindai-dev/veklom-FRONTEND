"use client";
import { Pillar, HonestEmpty } from "./SectionPillars";
import { Field, JsonPanel, DataNotice } from "./StageParts";
import { ProofBadge } from "./ProofBadge";
import type { StageCallRecord } from "@/lib/cos/useStageData";
export function PayloadPillar({ title, record, value, route, detail }: { title: "Work"|"Telemetry"|"Authority"|"Evidence"|"Drift"; record?: StageCallRecord; value?: unknown; route: string; detail: string }) { return <Pillar title={title} proof={record?.proof ?? "Needs proof"}><JsonPanel value={value} empty={`${detail} — ${route}`} /></Pillar>; }
export function MetricGrid({ value }: { value: unknown }) { if (!value || typeof value !== "object") return <DataNotice proof="Needs proof" title="No measurement payload" detail="The endpoint did not return a source-of-truth measurement object." />; const entries = Object.entries(value as Record<string, unknown>).filter(([,v]) => typeof v !== "object" || v === null).slice(0, 12); return <div className="grid gap-3 sm:grid-cols-2">{entries.map(([k,v]) => <Field key={k} label={k} value={v} />)}</div>; }
export function ChainState({ label, proof, detail }: { label: string; proof: "Verified"|"Needs proof"|"Present"|"Degraded"|"Not started"|"Manual step"|"Simulated"; detail: string }) { return <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs uppercase tracking-[.12em] text-cos-text">{label}</span><ProofBadge status={proof} /></div><p className="mt-3 text-xs leading-5 text-cos-muted">{detail}</p></div>; }
export function UnknownLink({ label, detail }: { label: string; detail: string }) {
  return <ChainState label={label} proof="Needs proof" detail={`Unknown — unmeasured. Evidence needed: ${detail}`} />;
}
