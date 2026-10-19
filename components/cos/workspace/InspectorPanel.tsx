"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { activeStep } from "@/lib/cos/tasks/task-reducer";
import type { TaskState } from "@/lib/cos/tasks/task-types";
import { TaskReceipt } from "./TaskReceipt";
import { ConversationLog } from "./ConversationLog";

export function InspectorPanel({
  state,
  project,
}: {
  state: TaskState;
  project?: string;
}) {
  const [scopeOpen, setScopeOpen] = useState(true);
  const [activityOpen, setActivityOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(true);

  const step = activeStep(state);
  const phase = state.phase;
  const isDone = phase === "done" && state.readback?.proof === "Verified";
  const isNeedsReview = phase === "needs_review" || phase === "needs_input";
  const isExecuting = phase === "executing" || phase === "requesting_authority";

  // Derive key-value properties
  const capabilityValue = step?.operation?.action ?? (state.plan ? "email.send" : "None");
  
  let policyValue = "Not evaluated";
  let policyTone = "text-slate-400";
  if (state.plan) {
    if (isNeedsReview) {
      policyValue = "Approval required";
      policyTone = "text-amber-400 font-medium";
    } else {
      policyValue = "Satisfied";
      policyTone = "text-emerald-400";
    }
  }

  let authorityValue = "Not issued";
  let authorityTone = "text-slate-400";
  if (state.authority) {
    if (state.authority.decision === "allow") {
      authorityValue = "Issued · Single-use";
      authorityTone = "text-cyan-400 font-medium";
    } else {
      authorityValue = `Denied: ${state.authority.reason ?? "revoked"}`;
      authorityTone = "text-rose-400";
    }
  }

  let outcomeValue = "Not executed";
  let outcomeTone = "text-slate-400";
  if (state.execution) {
    if (state.execution.decision === "allow") {
      outcomeValue = isDone ? "Verified" : "Executed (Awaiting readback)";
      outcomeTone = isDone ? "text-emerald-400 font-medium" : "text-cyan-400";
    } else {
      outcomeValue = "Refused";
      outcomeTone = "text-rose-400";
    }
  }

  let evidenceValue = "Pending";
  let evidenceTone = "text-slate-500";
  if (state.readback) {
    evidenceValue = state.readback.proof;
    evidenceTone = state.readback.proof === "Verified" ? "text-emerald-400 font-medium" : "text-amber-400";
  }

  return (
    <aside className="inspector-panel w-full rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md p-5 space-y-6 shadow-xl text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-cyan-400" />
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-slate-300 font-semibold">
            Inspector
          </h3>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          {project ?? "workspace"}
        </span>
      </div>

      {/* Property Matrix Grid */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0d1627]/60 p-3.5 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Capability</span>
          <span className="font-mono text-cyan-300 font-medium">{capabilityValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Policy</span>
          <span className={policyTone}>{policyValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Authority</span>
          <span className={authorityTone}>{authorityValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Outcome</span>
          <span className={outcomeTone}>{outcomeValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Evidence</span>
          <span className={evidenceTone}>{evidenceValue}</span>
        </div>
      </div>

      {/* Accordion 1: Scope & Recipients */}
      <div className="border-t border-slate-800/60 pt-3">
        <button
          type="button"
          onClick={() => setScopeOpen(!scopeOpen)}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white"
        >
          <span>Scope and recipients</span>
          {scopeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {scopeOpen ? (
          <div className="mt-2.5 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2">
              <span>Recipients</span>
              <span className="font-mono text-slate-200">6 (Sales team)</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2">
              <span>Attachment</span>
              <span className="font-mono text-slate-200">sales-summary.pdf</span>
            </div>
            {step?.operation?.resource ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2">
                <span>Target resource</span>
                <span className="font-mono text-slate-200">{step.operation.resource}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Accordion 2: Activity Log */}
      <div className="border-t border-slate-800/60 pt-3">
        <button
          type="button"
          onClick={() => setActivityOpen(!activityOpen)}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white"
        >
          <span>Activity</span>
          {activityOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {activityOpen ? (
          <div className="mt-2.5 max-h-56 overflow-y-auto">
            <ConversationLog messages={state.messages} />
          </div>
        ) : null}
      </div>

      {/* Accordion 3: Receipt & Readback */}
      <div className="border-t border-slate-800/60 pt-3">
        <button
          type="button"
          onClick={() => setReceiptOpen(!receiptOpen)}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white"
        >
          <span>Receipt and readback</span>
          {receiptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {receiptOpen ? (
          <div className="mt-2.5">
            {state.authority || state.execution ? (
              <TaskReceipt state={state} project={project} />
            ) : (
              <p className="text-xs text-slate-500 italic">
                Receipt and target readback will be anchored here once the action executes.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Accordion 4 / Footer: View Task Evidence Link */}
      <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between">
        <Link
          href="/os/evidence"
          className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-medium"
        >
          <FileCheck2 size={14} />
          <span>View task evidence</span>
          <ArrowRight size={12} />
        </Link>
        <span className="font-mono text-[10px] text-slate-500">
          PGL Vault
        </span>
      </div>
    </aside>
  );
}
