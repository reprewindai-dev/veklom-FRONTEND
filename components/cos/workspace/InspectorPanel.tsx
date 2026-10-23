"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, FileCheck2, ShieldCheck } from "lucide-react";
import { ProofBadge } from "@/components/cos/ProofBadge";
import type { ProofStatus } from "@/lib/cos/capabilities";
import { describeArguments } from "@/lib/cos/execution-intent";
import { activeStep } from "@/lib/cos/tasks/task-reducer";
import type { TaskState } from "@/lib/cos/tasks/task-types";
import { ConversationLog } from "./ConversationLog";
import { TaskReceipt } from "./TaskReceipt";

function Row({ label, value, tone = "text-slate-200" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className={`break-all text-right font-mono ${tone}`}>{value}</span>
    </div>
  );
}

function Section({ title, meta, open, onToggle, children }: { title: string; meta: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-800/60 pt-3.5">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-xs font-medium text-slate-300 transition hover:text-white">
        <span>{title}</span>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>{meta}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>
      {open ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}

/**
 * The right rail: capability, policy, authority, outcome and evidence for the task in view,
 * each read from a response. "Not compiled", "Not requested" and "Not executed" are the
 * honest values before the corresponding service has answered.
 */
export function InspectorPanel({
  state,
  project,
  workspace,
  stageProof,
}: {
  state: TaskState;
  project?: string;
  workspace?: string | null;
  stageProof?: ProofStatus;
}) {
  const [scopeOpen, setScopeOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(true);

  const step = activeStep(state);
  const operation = step?.operation;

  const capability = operation?.action ?? step?.action ?? (state.plan ? "No bound action" : "Not compiled");

  let policy = "Not compiled";
  let policyTone = "text-slate-400";
  if (state.plan) {
    if (state.phase === "refused") { policy = "Refused by the catalog"; policyTone = "text-rose-400"; }
    else if (state.phase === "needs_input") { policy = "Needs the exact target"; policyTone = "text-amber-400"; }
    else if (state.phase === "needs_review") { policy = "Approval required"; policyTone = "text-amber-400 font-medium"; }
    else if (state.approval || state.authority) { policy = "Approved by you"; policyTone = "text-emerald-400"; }
  }

  let authority = "Not requested";
  let authorityTone = "text-slate-400";
  if (state.phase === "requesting_authority") { authority = "Requesting"; authorityTone = "text-cyan-400"; }
  else if (state.authority) {
    if (state.authority.decision === "allow") {
      authority = state.execution?.terminated ? "Issued · consumed" : "Issued · single use";
      authorityTone = "text-cyan-400 font-medium";
    } else {
      authority = `Refused: ${state.authority.reason ?? state.authority.decision}`;
      authorityTone = "text-rose-400";
    }
  }

  let outcome = "Not executed";
  let outcomeTone = "text-slate-400";
  if (state.phase === "executing") { outcome = "Executing"; outcomeTone = "text-cyan-400"; }
  else if (state.phase === "outcome_unknown") { outcome = "Unknown: no answer to execute"; outcomeTone = "text-amber-400"; }
  else if (state.execution) {
    if (state.execution.decision === "allow") {
      outcome = state.readback?.proof === "Verified" ? "Executed once" : "Executed once (awaiting readback)";
      outcomeTone = state.readback?.proof === "Verified" ? "text-emerald-400 font-medium" : "text-cyan-400";
    } else {
      outcome = `Refused: ${state.execution.reason ?? state.execution.decision}`;
      outcomeTone = "text-rose-400";
    }
  }

  const evidence = state.readback?.proof ?? (state.execution ? "Needs proof" : "Not read");
  const evidenceTone = evidence === "Verified" ? "text-emerald-400 font-medium" : evidence === "Not read" ? "text-slate-400" : "text-amber-400";

  return (
    <aside className="inspector-panel w-full space-y-5 rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 p-6 text-slate-100 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400"><ShieldCheck size={18} /></div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">Inspector</h3>
            <p className="font-mono text-[10px] text-slate-500">{workspace ? `workspace ${workspace}` : "no workspace bound"}{project ? ` · ${project}` : ""}</p>
          </div>
        </div>
        {stageProof ? <ProofBadge status={stageProof} /> : null}
      </div>

      <div className="space-y-2.5 rounded-xl border border-slate-800/80 bg-[#0d1627]/60 p-4 text-xs">
        <Row label="Capability" value={capability} tone="text-cyan-300 font-medium" />
        <Row label="Policy" value={policy} tone={policyTone} />
        <Row label="Authority" value={authority} tone={authorityTone} />
        <Row label="Outcome" value={outcome} tone={outcomeTone} />
        <Row label="Evidence" value={evidence} tone={evidenceTone} />
      </div>

      <Section title="Scope" meta={operation ? operation.target_ref : "no bound operation"} open={scopeOpen} onToggle={() => setScopeOpen(!scopeOpen)}>
        {operation ? (
          <div className="space-y-2 text-xs text-slate-400">
            <Row label="Package" value={operation.package_ref} />
            <Row label="Target" value={operation.target_ref} />
            <Row label="Resource" value={operation.resource} />
            <Row label="Arguments" value={describeArguments(operation.arguments)} />
            {state.plan ? <Row label="Contract hash" value={state.plan.canonicalHash} /> : null}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-800/50 bg-slate-900/30 p-2 text-xs italic text-slate-500">
            {state.plan ? "The active step is not bound to an exact operation yet." : "Scope appears once a contract is compiled."}
          </p>
        )}
      </Section>

      <Section title="Activity" meta={state.messages.length ? `${state.messages.length} entries` : "nothing yet"} open={activityOpen} onToggle={() => setActivityOpen(!activityOpen)}>
        <div className="max-h-56 overflow-y-auto">
          {state.messages.length ? <ConversationLog messages={state.messages} /> : <p className="text-xs italic text-slate-500">No task has been compiled in this session.</p>}
        </div>
      </Section>

      <Section title="Receipt and readback" meta={state.readback ? state.readback.proof : state.execution ? "readback pending" : "no execution yet"} open={receiptOpen} onToggle={() => setReceiptOpen(!receiptOpen)}>
        {state.authority || state.execution ? (
          <TaskReceipt state={state} project={project} />
        ) : (
          <p className="rounded-lg border border-slate-800/50 bg-slate-900/30 p-2 text-xs italic text-slate-500">
            The receipt, the ledger anchoring and the target&rsquo;s own re-read appear here after you approve an action.
          </p>
        )}
      </Section>

      <div className="flex items-center justify-between border-t border-slate-800/60 pt-4">
        <Link href="/os/evidence" className="inline-flex items-center gap-2 text-xs font-medium text-cyan-400 hover:underline">
          <FileCheck2 size={15} /><span>Evidence and ledger check</span><ArrowRight size={13} />
        </Link>
        <span className="font-mono text-[10px] text-slate-500">{state.execution?.receiptId ? `receipt ${state.execution.receiptId}` : "no receipt yet"}</span>
      </div>
    </aside>
  );
}
