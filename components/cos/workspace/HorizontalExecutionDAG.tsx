"use client";

import { Ban, CheckCircle2, Clock3, Code2, Loader2, ShieldAlert } from "lucide-react";
import { pipelinePositions } from "@/lib/cos/tasks/pipeline-nodes";
import type { TaskState } from "@/lib/cos/tasks/task-types";

export interface HorizontalExecutionDAGProps {
  state: TaskState;
  /** Opens the governed Python ABIDE returned. Rendered only when the contract carries code. */
  onOpenPython?: () => void;
}

type DisplayStatus = "idle" | "running" | "success" | "failure" | "approval_required";

/**
 * The five positions of one governed run, drawn in a row. Every status comes from
 * pipelinePositions(state), which is derived only from responses already observed: nothing
 * here lights up on its own and no position is invented from the wording of the request.
 */
export function HorizontalExecutionDAG({ state, onOpenPython }: HorizontalExecutionDAGProps) {
  const awaitingApproval = state.phase === "needs_review" || state.phase === "needs_input";
  const inFlight = state.phase === "requesting_authority" || state.phase === "executing" || state.phase === "reading_back";
  const positions = pipelinePositions(state);

  const nodes = positions.map((pos) => {
    const status: DisplayStatus = awaitingApproval && pos.id === "permission" ? "approval_required" : pos.status;
    const statusText = status === "approval_required"
      ? "Approval required"
      : status === "success"
        ? (pos.id === "result" ? "Verified" : "Done")
        : status === "running"
          ? "In progress"
          : status === "failure"
            ? (pos.id === "result" ? pos.subtitle : "Refused")
            : "Pending";
    return { ...pos, status, statusText };
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${inFlight ? "animate-ping bg-cyan-400" : awaitingApproval ? "animate-pulse bg-amber-400" : state.plan ? "bg-emerald-400" : "bg-slate-600"}`} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">Execution pipeline</span>
        </div>
        {onOpenPython && state.plan?.pythonCode ? (
          <button
            type="button"
            onClick={onOpenPython}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 font-mono text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <Code2 size={13} className="text-cyan-400" />
            <span>View governed Python</span>
          </button>
        ) : null}
      </div>

      <div className="horizontal-dag flex items-center gap-2 overflow-x-auto py-2">
        {nodes.map((node, idx) => {
          let containerStyle = "border border-slate-800 bg-[#0d1627]/60";
          let badgeStyle = "font-mono text-slate-500";
          let icon = <Clock3 size={16} className="text-slate-600" />;
          if (node.status === "approval_required") {
            containerStyle = "border-2 border-amber-500 bg-amber-500/[0.08] shadow-[0_0_18px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50";
            badgeStyle = "font-semibold text-amber-400";
            icon = <ShieldAlert size={16} className="text-amber-400" />;
          } else if (node.status === "running") {
            containerStyle = "animate-pulse border-2 border-cyan-500 bg-cyan-500/[0.08] shadow-[0_0_16px_rgba(6,182,212,0.3)]";
            badgeStyle = "font-medium text-cyan-400";
            icon = <Loader2 size={16} className="animate-spin text-cyan-400" />;
          } else if (node.status === "success") {
            containerStyle = "border border-cyan-500/50 bg-cyan-500/[0.06] shadow-[0_0_10px_rgba(6,182,212,0.15)]";
            badgeStyle = "font-medium text-cyan-300";
            icon = <CheckCircle2 size={16} className="text-cyan-400" />;
          } else if (node.status === "failure") {
            containerStyle = "border border-rose-500/50 bg-rose-500/[0.06]";
            badgeStyle = "font-medium text-rose-400";
            icon = <Ban size={16} className="text-rose-400" />;
          }
          return (
            <div key={node.id} className="flex min-w-[125px] flex-1 items-center gap-2">
              <div className={`dag-node w-full space-y-1.5 rounded-xl p-3 text-center transition-all duration-200 ${containerStyle}`} data-testid={`dag-node-${node.id}`}>
                <div className="flex justify-center">{icon}</div>
                <div className="truncate text-xs font-semibold text-white" title={node.label}>{node.label}</div>
                <div className={`text-[10px] ${badgeStyle}`}>{node.statusText}</div>
                <div className="truncate font-mono text-[9px] text-slate-400" title={node.subtitle}>{node.subtitle}</div>
                <div className="truncate font-mono text-[9px] text-slate-600" title={node.nodeType}>{node.nodeType}</div>
              </div>
              {idx < nodes.length - 1 ? <span className="shrink-0 select-none font-mono text-sm text-slate-600">→</span> : null}
            </div>
          );
        })}
      </div>

      {state.plan && state.plan.steps.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-[#050914]/80 p-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
            Contract {state.plan.planId} · hash {state.plan.canonicalHash.slice(0, 16)}…
          </div>
          <div className="flex flex-wrap gap-2">
            {state.plan.steps.map((step) => (
              <span key={step.stepId} className="inline-flex items-center gap-1.5 rounded border border-slate-700/60 bg-slate-800/80 px-2 py-0.5 font-mono text-[11px] text-slate-200">
                <span className="font-semibold text-cyan-400">{step.sequence}.</span>
                <span>{step.action ?? step.coverage}</span>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
