"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { ScopeTag } from "@/components/cos/EnvironmentFrame";
import type { ProofStatus } from "@/lib/cos/capabilities";
import { activeStep } from "@/lib/cos/tasks/task-reducer";
import type { TaskState } from "@/lib/cos/tasks/task-types";
import { capabilityNotice } from "./ActionReviewCard";

function show(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not returned";
  return typeof value === "string" ? value : JSON.stringify(value);
}

function Row({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-cos-text">{show(value)}</div>
    </div>
  );
}

function StateFields({ state }: { state: Record<string, unknown> | undefined }) {
  if (!state) return <div className="font-mono text-xs text-cos-muted">Not returned</div>;
  return (
    <dl className="grid gap-1 font-mono text-[11px]">
      {Object.entries(state).map(([key, value]) => (
        <div key={key} className="flex gap-2"><dt className="shrink-0 text-cos-steel">{key}</dt><dd className="break-all text-cos-text">{show(value)}</dd></div>
      ))}
    </dl>
  );
}

/**
 * What actually happened, field by field, as returned by the authority layer and the target. The
 * badge is Verified only when the target's own re-read matched the receipt; a lost answer stays
 * "reconciliation required" whatever the re-read shows.
 */
export function TaskReceipt({ state, project }: { state: TaskState; project?: string }) {
  const { authority, execution, readback, phase } = state;
  const step = activeStep(state);
  if (!authority && !execution) return null;
  const notice = capabilityNotice(step?.operation?.package_ref ?? step?.packageRef);
  const receiptProof: ProofStatus = phase === "outcome_unknown"
    ? "Degraded"
    : readback?.proof ?? (execution?.decision === "allow" ? "Needs proof" : "Needs proof");
  const headline = phase === "outcome_unknown"
    ? "Outcome unknown: reconciliation required"
    : execution?.decision === "allow"
      ? readback?.proof === "Verified" ? "Executed once and independently verified" : "Executed once; independent re-read " + (readback ? "did not confirm it" : "pending")
      : execution ? `Execution refused: ${execution.reason ?? "no reason returned"}` : `Grant refused: ${authority?.reason ?? authority?.decision ?? "no reason returned"}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><ProofBadge status={receiptProof} /><span className="text-sm text-cos-text">{headline}</span></div>
        <ScopeTag project={project} />
      </div>
      {notice ? <p className="rounded-lg border border-cos-warn/40 bg-cos-warn/[0.06] px-3 py-2 text-[11px] leading-5 text-cos-warn">{notice}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Row label="Grant decision" value={authority?.decision} />
        <Row label="Mount" value={authority?.mountId} />
        <Row label="Operation id" value={execution?.operationId} />
        <Row label="Consequence decision" value={execution?.decision} />
        <Row label="Receipt id" value={execution?.receiptId} />
        <Row label="Grant consumed" value={execution?.terminated === undefined ? undefined : execution.terminated ? "yes (task-bound, single use)" : "not reported as consumed"} />
        <Row label="Ledger anchoring" value={execution?.anchoringStatus} />
        <Row label="Ledger event hash" value={execution?.eventHash} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div><div className="mb-2 font-mono text-[9px] uppercase text-cos-steel">Resulting state (what execute returned)</div><StateFields state={execution?.resultingState} /></div>
        <div><div className="mb-2 font-mono text-[9px] uppercase text-cos-steel">Target state now (target&rsquo;s own statement)</div><StateFields state={readback?.state} />{readback?.error ? <p className="mt-2 font-mono text-xs text-cos-warn">{readback.error}</p> : null}</div>
      </div>
      <div className="flex flex-wrap gap-3 border-t border-cos-border pt-3 font-mono text-[10px] uppercase tracking-[0.12em]">
        <Link href="/os/execute" className="inline-flex items-center gap-1 text-cos-accent">Operator view: Execute <ArrowRight size={12} /></Link>
        <Link href="/os/evidence" className="inline-flex items-center gap-1 text-cos-accent">Evidence and ledger check <ArrowRight size={12} /></Link>
      </div>
    </div>
  );
}
