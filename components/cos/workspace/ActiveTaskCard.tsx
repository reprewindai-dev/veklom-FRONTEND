"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import type { StepBinding, TaskState } from "@/lib/cos/tasks/task-types";
import { HorizontalExecutionDAG } from "./HorizontalExecutionDAG";
import { ActionApprovalCard } from "./ActionApprovalCard";

export function ActiveTaskCard({
  state,
  workspace,
  busy,
  onBind,
  onApprove,
  onCancel,
}: {
  state: TaskState;
  workspace: string | null;
  busy: boolean;
  onBind: (sequence: number, binding: StepBinding) => void;
  onApprove: () => void;
  onCancel?: () => void;
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  const phase = state.phase;
  const isDone = phase === "done" && state.readback?.proof === "Verified";
  const isNeedsReview = phase === "needs_review" || phase === "needs_input";
  const isExecuting = phase === "executing" || phase === "requesting_authority";
  const isFailed = phase === "failed" || phase === "denied" || phase === "refused";

  // Task title derived from intent
  let taskTitle = "Monthly sales summary";
  if (state.intent) {
    if (state.intent.toLowerCase().includes("counter")) {
      taskTitle = "Governed counter cycle";
    } else if (state.intent.toLowerCase().includes("summary")) {
      taskTitle = "Monthly sales summary";
    } else {
      taskTitle = state.intent.length > 36 ? `${state.intent.slice(0, 36)}…` : state.intent;
    }
  }

  // Status pill badge
  let statusBadge = (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-300">
      <Clock3 size={13} />
      <span>Idle</span>
    </div>
  );

  if (isNeedsReview) {
    statusBadge = (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
        <Clock3 size={13} />
        <span>Waiting for your approval</span>
      </div>
    );
  } else if (isExecuting) {
    statusBadge = (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 animate-pulse">
        <Loader2 size={13} className="animate-spin" />
        <span>Executing action…</span>
      </div>
    );
  } else if (isDone) {
    statusBadge = (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
        <CheckCircle2 size={13} />
        <span>Verified & complete</span>
      </div>
    );
  } else if (isFailed) {
    statusBadge = (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-400">
        <Ban size={13} />
        <span>Execution refused</span>
      </div>
    );
  }

  // Footer breadcrumbs
  let footerBreadcrumbs = (
    <>
      <span>Plan prepared</span>
      <span className="text-slate-600">→</span>
      <span className="text-amber-400 font-medium">Awaiting approval</span>
      <span className="text-slate-600">→</span>
      <span className="text-slate-500">No email sent</span>
    </>
  );

  if (isDone) {
    footerBreadcrumbs = (
      <>
        <span className="text-slate-300">Plan prepared</span>
        <span className="text-slate-600">→</span>
        <span className="text-slate-300">Approved</span>
        <span className="text-slate-600">→</span>
        <span className="text-emerald-400 font-medium">Executed & Readback Verified</span>
      </>
    );
  } else if (isExecuting) {
    footerBreadcrumbs = (
      <>
        <span className="text-slate-300">Plan prepared</span>
        <span className="text-slate-600">→</span>
        <span className="text-cyan-400 font-medium">Grant issued · In flight</span>
        <span className="text-slate-600">→</span>
        <span className="text-slate-500">Verifying target</span>
      </>
    );
  }

  return (
    <>
      <div className="active-task-card rounded-2xl border border-slate-800/80 bg-[#091122]/90 backdrop-blur-md p-6 space-y-6 shadow-xl relative overflow-hidden">
        {/* Subtle Background Grid Texture */}
        <div className="pointer-events-none absolute inset-0 bg-cos-grid bg-[size:32px_32px] opacity-15" />

        {/* 1. Header Row */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <FileText size={18} className="text-slate-300" />
            <h2 className="text-base font-semibold text-white tracking-tight">{taskTitle}</h2>
          </div>
          {statusBadge}
        </div>

        {/* 2. Generated Document Preview Sub-Card */}
        <div className="relative z-10 rounded-xl border border-slate-800/80 bg-[#0d1627]/70 p-3.5 flex items-center justify-between max-w-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-white font-mono">sales-summary.pdf</span>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="text-[11px] text-cyan-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  Preview report <ArrowUpRight size="11" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isDone ? "Report archived · Evidence verified" : "Draft available · Email not sent"}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Horizontal Execution DAG */}
        <div className="relative z-10">
          <HorizontalExecutionDAG state={state} />
        </div>

        {/* 4. Exact Action Approval Card */}
        {state.plan ? (
          <div className="relative z-10">
            <ActionApprovalCard
              state={state}
              workspace={workspace}
              busy={busy}
              onBind={onBind}
              onApprove={onApprove}
              onCancel={onCancel}
            />
          </div>
        ) : null}

        {/* 5. Task Card Footer Status Bar */}
        <div className="relative z-10 pt-2 border-t border-slate-800/60 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-400">
          <Clock3 size={13} className="text-slate-400" />
          {footerBreadcrumbs}
        </div>
      </div>

      {/* Report Preview Modal */}
      {showReportModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1627] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">Generated Document Preview</h4>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-3 font-mono text-xs">
              <div className="text-cyan-400 font-semibold">[DOCUMENT: sales-summary.pdf]</div>
              <div className="text-slate-400">Digest: 8e4b7c12f019a3d4...</div>
              <div className="border-t border-slate-800 pt-3 text-slate-200 font-sans text-xs leading-5">
                <strong>Executive Summary:</strong><br />
                October 2026 sales performance across enterprise and community voucher rails.<br /><br />
                • Total Gross Volume: $142,500 CAD<br />
                • Velocity Multiplier: 26.4x<br />
                • Active Hardship Reserve Sweeps: $2,137.50 CAD<br />
                • Cryptographic Receipt Anchors: 100% verified (PGL GnomLedger)
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowReportModal(false)}
              className="w-full rounded-lg bg-cyan-500 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Close Preview
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
