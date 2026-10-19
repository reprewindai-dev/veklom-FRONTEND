"use client";

import { CheckCircle2, Clock3, Ban, Loader2, ShieldAlert } from "lucide-react";
import { pipelinePositions, type PipelinePosition, type PipelineStatus } from "@/lib/cos/tasks/pipeline-nodes";
import type { TaskState } from "@/lib/cos/tasks/task-types";

export interface HorizontalExecutionDAGProps {
  state: TaskState;
}

function statusStyles(position: PipelinePosition, isNeedsReview: boolean): {
  containerStyle: string;
  badgeStyle: string;
  icon: React.ReactNode;
} {
  const { status, id } = position;

  if (isNeedsReview && (id === "permission" || id === "executing")) {
    return {
      containerStyle: "border-2 border-amber-500 bg-amber-500/[0.08] shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      badgeStyle: "text-amber-400 font-semibold",
      icon: <ShieldAlert size={16} className="text-amber-400" />,
    };
  }

  switch (status) {
    case "running":
      return {
        containerStyle: "border-2 border-cyan-500 bg-cyan-500/[0.08] shadow-[0_0_15px_rgba(6,182,212,0.25)] animate-pulse",
        badgeStyle: "text-cyan-400 font-medium",
        icon: <Loader2 size={16} className="text-cyan-400 animate-spin" />,
      };
    case "success":
      return {
        containerStyle: "border border-cyan-500/40 bg-cyan-500/[0.05]",
        badgeStyle: "text-cyan-300 font-medium",
        icon: <CheckCircle2 size={16} className="text-cyan-400" />,
      };
    case "failure":
      return {
        containerStyle: "border border-rose-500/40 bg-rose-500/[0.05]",
        badgeStyle: "text-rose-400 font-medium",
        icon: <Ban size={16} className="text-rose-400" />,
      };
    case "idle":
    default:
      return {
        containerStyle: "border border-slate-800 bg-[#0d1627]/60",
        badgeStyle: "text-slate-500 font-mono",
        icon: <Clock3 size={16} className="text-slate-600" />,
      };
  }
}

/**
 * Renders the real 5-stage backend pipeline derived strictly from pipelinePositions(state).
 * Every node state and subtitle reflects observed telemetry from ABIDE, CAPPO, Target sink, and PGL.
 */
export function HorizontalExecutionDAG({ state }: HorizontalExecutionDAGProps) {
  const isNeedsReview = state.phase === "needs_review" || state.phase === "needs_input";
  const positions = pipelinePositions(state);

  return (
    <div className="space-y-4">
      <div className="horizontal-dag flex flex-wrap items-center gap-2 overflow-x-auto py-2">
        {positions.map((pos, idx) => {
          const { containerStyle, badgeStyle, icon } = statusStyles(pos, isNeedsReview);
          const displayStatus = isNeedsReview && (pos.id === "permission" || pos.id === "executing")
            ? "Approval required"
            : pos.status === "success"
              ? pos.id === "result"
                ? "Verified"
                : "Completed"
              : pos.status === "running"
                ? "In progress"
                : pos.status === "failure"
                  ? "Failed / Refused"
                  : "Pending";

          return (
            <div key={pos.id} className="flex items-center gap-2 flex-1 min-w-[130px]">
              <div
                className={`dag-node w-full rounded-xl p-3 text-center space-y-1.5 transition-all duration-200 ${containerStyle}`}
                data-testid={`dag-node-${pos.id}`}
              >
                <div className="flex justify-center">{icon}</div>
                <div className="text-xs font-semibold text-white truncate" title={pos.label}>
                  {pos.label}
                </div>
                <div className="text-[10px] font-mono text-slate-400 truncate" title={pos.nodeType}>
                  {pos.nodeType}
                </div>
                <div className={`text-[10px] ${badgeStyle}`}>
                  {displayStatus}
                </div>
                <div className="text-[9px] font-mono text-slate-400 truncate" title={pos.subtitle}>
                  {pos.subtitle}
                </div>
              </div>
              {idx < positions.length - 1 && (
                <span className="text-slate-600 font-mono select-none text-sm">→</span>
              )}
            </div>
          );
        })}
      </div>

      {state.plan && state.plan.steps.length > 0 && (
        <div className="rounded-lg border border-slate-800/80 bg-[#050914]/80 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            Compiled Contract Steps ({state.plan.planId})
          </div>
          <div className="flex flex-wrap gap-2">
            {state.plan.steps.map((step) => (
              <span
                key={step.stepId}
                className="inline-flex items-center gap-1.5 rounded bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-200 border border-slate-700/60"
              >
                <span className="text-cyan-400 font-semibold">{step.sequence}.</span>
                <span>{step.action ?? "unbound"}</span>
                <span className="text-[10px] text-slate-400">({step.coverage})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
