"use client";

import { ArrowRight, CircleDot } from "lucide-react";
import type { StageDefinition } from "@/lib/cos/stages";
import type { ProofStatus } from "@/lib/cos/capabilities";
import type { StageCallRecord } from "@/lib/cos/useStageData";
import { ProofBadge } from "./ProofBadge";
import { RouteLedger } from "./RouteLedger";

export function SectionShell({
  stage,
  proof,
  primaryAction,
  children,
  records,
}: {
  stage: StageDefinition;
  proof: ProofStatus;
  primaryAction: React.ReactNode;
  children: React.ReactNode;
  records: StageCallRecord[];
}) {
  return (
    <section className="mx-auto max-w-[1500px] px-5 py-8 lg:px-10 lg:py-10">
      <header className="mb-8 flex flex-col gap-6 rounded-2xl border border-cos-border bg-cos-surface2/70 p-5 shadow-cos-card md:flex-row md:items-end md:justify-between lg:p-7">
        <div className="min-w-0"><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent"><CircleDot size={13} /> Capability workspace</div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold tracking-tight text-cos-text md:text-4xl">{stage.label}</h1><ProofBadge status={proof} /></div><p className="mt-3 max-w-2xl text-sm leading-6 text-cos-muted">{stage.purpose}</p></div>
        <div className="shrink-0">{primaryAction}</div>
      </header>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">{children}</div>
      <RouteLedger records={records} />
      <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel"><ArrowRight size={12} className="text-cos-accent" />Capability context stays in this workspace</div>
    </section>
  );
}
