"use client";

import { CheckCircle2, Clock3, FileCheck2, FileText, Mail, AlertTriangle, Ban } from "lucide-react";
import type { TaskState } from "@/lib/cos/tasks/task-types";
import { pipelinePositions } from "@/lib/cos/tasks/pipeline-nodes";

export interface HorizontalExecutionDAGProps {
  state: TaskState;
}

export function HorizontalExecutionDAG({ state }: { state: TaskState }) {
  const positions = pipelinePositions(state);
  const phase = state.phase;
  const isNeedsReview = phase === "needs_review" || phase === "needs_input";
  const isExecuting = phase === "executing" || phase === "requesting_authority";
  const isDone = phase === "done" && state.readback?.proof === "Verified";
  const isFailed = phase === "failed" || phase === "denied" || phase === "refused";

  // Derive label and status for Node 4 (Action / Permission)
  const activeStep = state.plan?.steps.find((s) => s.stepId === state.activeStepId) ?? state.plan?.steps[0];
  const actionLabel = activeStep?.action ? activeStep.action.replace(/_/g, " ") : "Send email";
  
  // Custom nodes matching Concept 2 visual design:
  // Node 1: Sales CSV (Input)
  // Node 2: Summarize (Computation)
  // Node 3: Report draft (Draft Artifact)
  // Node 4: Send email / Action (Consequence Gate)
  // Node 5: Evidence (PGL Verification)
  const node1Status = state.plan ? "Prepared" : "Waiting";
  const node2Status = state.plan ? "Prepared" : "Waiting";
  const node3Status = state.plan ? "Prepared" : "Waiting";
  
  let node4Status = "Waiting";
  let node4Style = "border-slate-800 bg-[#0d1627]/40 text-slate-400";
  let node4Icon = <Mail size={16} className="text-slate-500" />;
  
  if (isNeedsReview) {
    node4Status = "Approval required";
    node4Style = "border-2 border-amber-500 bg-amber-500/[0.08] text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]";
    node4Icon = <Mail size={16} className="text-amber-400" />;
  } else if (isExecuting) {
    node4Status = "Executing";
    node4Style = "border-2 border-cyan-500 bg-cyan-500/[0.08] text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] animate-pulse";
    node4Icon = <Mail size={16} className="text-cyan-400" />;
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
          <CheckCircle2 size={16} />
        </div>
        <div className="text-xs font-medium text-white truncate" title={state.intent ? "Input data" : "Sales CSV"}>
          {state.intent ? "Input Data" : "Sales CSV"}
        </div>
        <div className="text-[10px] font-mono text-cyan-400/80">{node1Status}</div>
      </div>

      <span className="text-slate-600 font-mono select-none">→</span>

      {/* Node 2: Plan / Summarize */}
      <div className="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
        <div className="flex justify-center text-cyan-400">
          <CheckCircle2 size={16} />
        </div>
        <div className="text-xs font-medium text-white">Summarize</div>
        <div className="text-[10px] font-mono text-cyan-400/80">{node2Status}</div>
      </div>

      <span className="text-slate-600 font-mono select-none">→</span>

      {/* Node 3: Report draft */}
      <div className="dag-node flex-1 min-w-[120px] rounded-lg border border-cyan-500/30 bg-[#0d1627]/80 p-3 text-center space-y-1">
        <div className="flex justify-center text-cyan-400">
          <CheckCircle2 size={16} />
        </div>
        <div className="text-xs font-medium text-white">Report draft</div>
        <div className="text-[10px] font-mono text-cyan-400/80">{node3Status}</div>
      </div>

      <span className="text-slate-600 font-mono select-none">→</span>

      {/* Node 4: Send email / Consequential Action (Gated) */}
      <div className={`dag-node flex-1 min-w-[130px] rounded-lg p-3 text-center space-y-1 transition-all duration-200 ${node4Style}`}>
        <div className="flex justify-center">{node4Icon}</div>
        <div className="text-xs font-semibold text-white capitalize truncate" title={actionLabel}>
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
