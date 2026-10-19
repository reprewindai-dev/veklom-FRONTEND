"use client";

import { CheckCircle2, Clock3, FileCheck2, FileText, Mail, Settings, Ban, Loader2, Database, ShieldAlert } from "lucide-react";
import type { TaskState } from "@/lib/cos/tasks/task-types";

export interface HorizontalExecutionDAGProps {
  state: TaskState;
}

export function HorizontalExecutionDAG({ state }: { state: TaskState }) {
  const phase = state.phase;
  const isNeedsReview = phase === "needs_review" || phase === "needs_input";
  const isExecuting = phase === "executing" || phase === "requesting_authority";
  const isDone = phase === "done" && state.readback?.proof === "Verified";
  const isFailed = phase === "failed" || phase === "denied" || phase === "refused";

  const isSalesSummaryScenario = 
    Boolean(state.intent?.toLowerCase().includes("summary") || 
    state.intent?.toLowerCase().includes("sales") ||
    state.plan?.planId?.includes("sales"));

  if (isSalesSummaryScenario) {
    // 5-Stage Canonical Pipeline for the Sales Summary Scenario
    const activeStep = state.plan?.steps.find((s) => s.stepId === state.activeStepId) ?? state.plan?.steps[0];
    const actionLabel = activeStep?.action ? activeStep.action : "email.send";

    let node4Status = "Waiting";
    let node4Style = "border-slate-800 bg-[#0d1627]/60 text-slate-400";
    let node4Icon = <Mail size={16} className="text-slate-500" />;

    if (isNeedsReview) {
      node4Status = "Approval required";
      node4Style = "border-2 border-amber-500 bg-amber-500/[0.08] text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]";
      node4Icon = <Mail size={16} className="text-amber-400" />;
    } else if (isExecuting) {
      node4Status = "Executing";
      node4Style = "border-2 border-cyan-500 bg-cyan-500/[0.08] text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] animate-pulse";
      node4Icon = <Loader2 size={16} className="text-cyan-400 animate-spin" />;
    } else if (isDone) {
      node4Status = "Verified";
      node4Style = "border border-cyan-500/40 bg-cyan-500/[0.05] text-cyan-400";
      node4Icon = <CheckCircle2 size={16} className="text-cyan-400" />;
    } else if (isFailed) {
      node4Status = "Blocked / Refused";
      node4Style = "border border-rose-500/40 bg-rose-500/[0.05] text-rose-400";
      node4Icon = <Ban size={16} className="text-rose-400" />;
    }

    const node5Status = isDone ? "Verified" : state.execution ? "Pending Readback" : "Pending";
    const node5Style = isDone
      ? "border border-emerald-500/40 bg-emerald-500/[0.05] text-emerald-400"
      : "border border-slate-800 bg-[#0d1627]/40 text-slate-500 opacity-70";

    return (
      <div className="horizontal-dag flex flex-wrap items-center gap-2 overflow-x-auto py-2">
        {/* Node 1: Input Data */}
        <div className="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
          <div className="flex justify-center text-cyan-400">
            <FileText size={16} />
          </div>
          <div className="text-xs font-medium text-white truncate">Input Data</div>
          <div className="text-[10px] font-mono text-cyan-400/80">Prepared</div>
        </div>

        <span className="text-slate-600 font-mono select-none">→</span>

        {/* Node 2: Summarize */}
        <div className="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
          <div className="flex justify-center text-cyan-400">
            <CheckCircle2 size={16} />
          </div>
          <div className="text-xs font-medium text-white">Summarize</div>
          <div className="text-[10px] font-mono text-cyan-400/80">Prepared</div>
        </div>

        <span className="text-slate-600 font-mono select-none">→</span>

        {/* Node 3: Report draft */}
        <div className="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
          <div className="flex justify-center text-cyan-400">
            <FileCheck2 size={16} />
          </div>
          <div className="text-xs font-medium text-white">Report draft</div>
          <div className="text-[10px] font-mono text-cyan-400/80">Prepared</div>
        </div>

        <span className="text-slate-600 font-mono select-none">→</span>

        {/* Node 4: email.send / Action */}
        <div className={`dag-node flex-1 min-w-[130px] rounded-lg p-3 text-center space-y-1 transition-all duration-200 ${node4Style}`}>
          <div className="flex justify-center">{node4Icon}</div>
          <div className="text-xs font-semibold text-white truncate" title={actionLabel}>
            {actionLabel}
          </div>
          <div className="text-[10px] font-medium">{node4Status}</div>
        </div>

        <span className="text-slate-600 font-mono select-none">→</span>

        {/* Node 5: Evidence */}
        <div className={`dag-node flex-1 min-w-[120px] rounded-lg p-3 text-center space-y-1 ${node5Style}`}>
          <div className="flex justify-center">
            {isDone ? <CheckCircle2 size={16} className="text-emerald-400" /> : <FileCheck2 size={16} />}
          </div>
          <div className="text-xs font-medium text-slate-300">Evidence</div>
          <div className="text-[10px] font-mono">{node5Status}</div>
        </div>
      </div>
    );
  }

  // Dynamic General Capability OS Pipeline (Exact Concept 2 Layout: media_1792384473666_34e07e62.png)
  // [ Input ] → [ Capability A ] → [ Capability B ] → [ Output ]
  const steps = state.plan?.steps ?? [];
  const hasPlan = Boolean(state.plan);

  return (
    <div className="horizontal-dag flex flex-wrap items-center gap-3 overflow-x-auto py-2">
      {/* Node 1: Input */}
      <div className="dag-node flex-1 min-w-[130px] rounded-xl border border-cyan-500/30 bg-[#0b1424]/90 p-4 text-center space-y-1.5 shadow-sm">
        <div className="flex justify-center text-cyan-400">
          <FileText size={18} />
        </div>
        <div className="text-xs font-semibold text-white">Input</div>
        <div className="text-[10px] font-mono text-cyan-400/80">
          {state.intent ? "Declared" : "Awaiting input"}
        </div>
      </div>

      <span className="text-slate-500 font-mono select-none text-lg">→</span>

      {/* Dynamic Capability Steps */}
      {steps.length > 0 ? (
        steps.map((step, idx) => {
          const isCurrent = step.stepId === state.activeStepId || idx === 0;
          let nodeStatus = "Prepared";
          let nodeStyle = "border-slate-800 bg-[#0d1627]/60 text-slate-300";
          let nodeIcon = <Settings size={18} className="text-slate-400" />;

          if (isCurrent && isNeedsReview) {
            nodeStatus = "Approval required";
            nodeStyle = "border-2 border-amber-500 bg-amber-500/[0.08] text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]";
            nodeIcon = <ShieldAlert size={18} className="text-amber-400" />;
          } else if (isCurrent && isExecuting) {
            nodeStatus = "Executing";
            nodeStyle = "border-2 border-cyan-500 bg-cyan-500/[0.08] text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] animate-pulse";
            nodeIcon = <Loader2 size={18} className="text-cyan-400 animate-spin" />;
          } else if (isDone) {
            nodeStatus = "Verified";
            nodeStyle = "border border-cyan-500/40 bg-cyan-500/[0.05] text-cyan-400";
            nodeIcon = <CheckCircle2 size={18} className="text-cyan-400" />;
          }

          return (
            <div key={step.stepId || idx} className="flex items-center gap-3 flex-1 min-w-[140px]">
              <div className={`dag-node w-full rounded-xl p-4 text-center space-y-1.5 transition ${nodeStyle}`}>
                <div className="flex justify-center">{nodeIcon}</div>
                <div className="text-xs font-semibold text-white truncate" title={step.action || step.clause}>
                  {step.action || `Capability ${String.fromCharCode(65 + idx)}`}
                </div>
                <div className="text-[10px] font-mono">{nodeStatus}</div>
              </div>
              <span className="text-slate-500 font-mono select-none text-lg">→</span>
            </div>
          );
        })
      ) : (
        <>
          {/* Default Capability A Placeholder */}
          <div className="dag-node flex-1 min-w-[140px] rounded-xl border border-slate-800 bg-[#0b1424]/60 p-4 text-center space-y-1.5">
            <div className="flex justify-center text-slate-400">
              <Settings size={18} />
            </div>
            <div className="text-xs font-semibold text-slate-200">Capability A</div>
            <div className="text-[10px] font-mono text-slate-500">
              {hasPlan ? "Prepared" : "Pending compilation"}
            </div>
          </div>

          <span className="text-slate-500 font-mono select-none text-lg">→</span>

          {/* Default Capability B Placeholder */}
          <div className="dag-node flex-1 min-w-[140px] rounded-xl border border-slate-800 bg-[#0b1424]/60 p-4 text-center space-y-1.5">
            <div className="flex justify-center text-slate-400">
              <Settings size={18} />
            </div>
            <div className="text-xs font-semibold text-slate-200">Capability B</div>
            <div className="text-[10px] font-mono text-slate-500">
              {hasPlan ? "Prepared" : "Pending compilation"}
            </div>
          </div>

          <span className="text-slate-500 font-mono select-none text-lg">→</span>
        </>
      )}

      {/* Node: Output */}
      <div className={`dag-node flex-1 min-w-[130px] rounded-xl p-4 text-center space-y-1.5 ${
        isDone 
          ? "border border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-400"
          : "border border-slate-800 bg-[#0b1424]/60 text-slate-400"
      }`}>
        <div className="flex justify-center">
          {isDone ? <CheckCircle2 size={18} className="text-emerald-400" /> : <FileCheck2 size={18} />}
        </div>
        <div className="text-xs font-semibold text-white">Output</div>
        <div className="text-[10px] font-mono">
          {isDone ? "Verified" : state.execution ? "Pending readback" : "Pending"}
        </div>
      </div>
    </div>
  );
}
