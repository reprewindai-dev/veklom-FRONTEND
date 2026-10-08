"use client";

import { ArrowRight, CircleDot } from "lucide-react";
import type { StageDefinition } from "@/lib/cos/stages";
import type { ProofStatus } from "@/lib/cos/capabilities";
import type { StageCallRecord } from "@/lib/cos/useStageData";
import { getStageMaturity, type MaturityStatus, type StageMaturity } from "@/lib/cos/maturity";
import { ProofBadge } from "./ProofBadge";
import { RouteLedger } from "./RouteLedger";

const maturityStyles: Record<MaturityStatus, string> = {
  "Proven in production": "border-cos-verified/40 bg-cos-verified/10 text-cos-verified",
  "Proven on staging": "border-cos-present/40 bg-cos-present/10 text-cos-present",
  "Partly proven": "border-cos-warn/40 bg-cos-warn/10 text-cos-warn",
  "Needs proof": "border-cos-unknown/40 bg-cos-unknown/10 text-cos-unknown",
};

/** The stable "is this real today" marker for the page, tied to recorded evidence. */
function MaturityBadge({ maturity }: { maturity: StageMaturity }) {
  return (
    <span
      title={maturity.evidence ? `Evidence: ${maturity.evidence}` : "Not yet shown in a recorded run."}
      className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${maturityStyles[maturity.status]}`}
    >
      {maturity.status}
    </span>
  );
}

export function SectionShell({
  stage,
  proof,
  primaryAction,
  children,
  records,
}: {
  stage: StageDefinition;
  proof: ProofStatus;
  primaryAction?: React.ReactNode;
  children: React.ReactNode;
  records: StageCallRecord[];
}) {
  const maturity = getStageMaturity(stage.id);
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-8 lg:px-10 lg:py-10">
      <header className="mb-8 flex flex-col gap-6 rounded-2xl border border-cos-border bg-cos-surface2/70 p-5 shadow-cos-card md:flex-row md:items-end md:justify-between lg:p-7">
        <div className="min-w-0"><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent"><CircleDot size={13} /> Capability workspace</div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-cos-text md:text-4xl">{stage.label}</h1><MaturityBadge maturity={maturity} /></div><p className="mt-3 max-w-2xl text-sm leading-6 text-cos-muted">{stage.purpose}</p><p className="mt-3 max-w-2xl text-xs leading-5 text-cos-text"><span className="font-semibold">What&rsquo;s proven: </span>{maturity.summary}{maturity.evidence ? <span className="text-cos-steel"> Evidence: {maturity.evidence}.</span> : null}</p><p className="mt-2 flex max-w-2xl flex-wrap items-center gap-2 text-xs leading-5 text-cos-steel"><span>This session:</span><ProofBadge status={proof} /><span>Panel badges show what this page has actually seen since you opened it, and change only when a real response comes back.</span></p></div>
        {primaryAction ? <div className="shrink-0">{primaryAction}</div> : null}
      </header>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">{children}</div>
      <RouteLedger records={records} />
      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel"><ArrowRight size={12} className="text-cos-accent" />Capability context stays in this workspace</div>
    </section>
  );
}
