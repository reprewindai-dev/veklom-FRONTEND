"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  FileCheck2,
  FileText,
  Mail,
  ShieldCheck,
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

  // Derive key-value properties matching Concept 2 image
  const capabilityValue = step?.operation?.action ?? (state.plan ? "email.send" : "email.send");
  const actionTitle = capabilityValue === "email.send" ? "Send email" : capabilityValue;
  
  let policyValue = "Approval required";
  let policyTone = "text-amber-400 font-medium";
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
      authorityValue = "Issued & Burned";
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
      outcomeValue = isDone ? "Committed" : "Executed (Awaiting readback)";
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

  // Header status badge
  let headerBadge = (
    <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[11px] text-amber-400 font-medium">
      Approval required
    </span>
  );
  if (isDone) {
    headerBadge = (
      <span className="rounded-full border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-400 font-medium">
        Verified
      </span>
    );
  } else if (isExecuting) {
    headerBadge = (
      <span className="rounded-full border border-cyan-500/50 bg-cyan-500/10 px-2.5 py-0.5 font-mono text-[11px] text-cyan-400 font-medium animate-pulse">
        Executing
      </span>
    );
  }

  return (
    <aside className="inspector-panel w-full rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md p-6 space-y-5 shadow-xl text-slate-100">
      {/* Top Action Header matching Concept 2 image */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/30">
            <Mail size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              {actionTitle}
            </h3>
            <span className="hidden">Inspector</span>
          </div>
        </div>
        {headerBadge}
      </div>

      {/* Property Matrix Grid */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0d1627]/60 p-4 space-y-2.5 text-xs">
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
      <div className="border-t border-slate-800/60 pt-3.5">
        <button
          type="button"
          onClick={() => setScopeOpen(!scopeOpen)}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <div className="flex items-center gap-2">
            <span>Scope and recipients</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>6 recipients · Sales team</span>
            {scopeOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        {scopeOpen ? (
          <div className="mt-3 space-y-2 text-xs text-slate-400">
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
              <span>Recipients</span>
              <span className="font-mono text-slate-200">6 (Sales team)</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
              <span>Attachment</span>
              <span className="font-mono text-slate-200">sales-summary.pdf</span>
            </div>
            {step?.operation?.resource ? (
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
                <span>Target resource</span>
                <span className="font-mono text-slate-200">{step.operation.resource}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Accordion 2: Activity Log */}
      <div className="border-t border-slate-800/60 pt-3.5">
        <button
          type="button"
          onClick={() => setActivityOpen(!activityOpen)}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <span>Activity</span>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>{isDone ? "Committed & verified" : "Draft ready · Waiting for approval"}</span>
            {activityOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        {activityOpen ? (
          <div className="mt-3 max-h-56 overflow-y-auto">
            <ConversationLog messages={state.messages} />
          </div>
        ) : null}
      </div>

      {/* Accordion 3: Receipt & Readback */}
      <div className="border-t border-slate-800/60 pt-3.5">
        <button
          type="button"
          onClick={() => setReceiptOpen(!receiptOpen)}
          className="flex w-full items-center justify-between text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <span>Receipt and readback</span>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>{isDone ? "PGL Anchored" : "No readback yet"}</span>
            {receiptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
        </button>
        {receiptOpen ? (
          <div className="mt-3">
            {state.authority || state.execution ? (
              <TaskReceipt state={state} project={project} />
            ) : (
              <p className="text-xs text-slate-500 italic p-2 rounded-lg bg-slate-900/30 border border-slate-800/50">
                Receipt and target readback will be anchored here once the action executes.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Link: View Task Evidence */}
      <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between">
        <Link
          href="/os/evidence"
          className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:underline font-medium"
        >
          <FileCheck2 size={15} />
          <span>View task evidence</span>
          <ArrowRight size={13} />
        </Link>
        <span className="font-mono text-[10px] text-slate-500">
          {isDone ? "Receipt verified" : "No execution receipt yet"}
        </span>
      </div>
    </aside>
  );
}
