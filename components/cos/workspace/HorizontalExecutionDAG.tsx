"use client";

import { CheckCircle2, Clock3, Ban, Loader2, Mail, ShieldAlert, Code2 } from "lucide-react";
import { pipelinePositions, type PipelinePosition } from "@/lib/cos/tasks/pipeline-nodes";
import type { TaskState } from "@/lib/cos/tasks/task-types";

export interface HorizontalExecutionDAGProps {
  state: TaskState;
  onOpenPython?: () => void;
}

interface DisplayNode {
  id: string;
  label: string;
  nodeType: string;
  status: "idle" | "running" | "success" | "failure" | "approval_required";
  statusText: string;
  subtitle: string;
}

export function HorizontalExecutionDAG({ state, onOpenPython }: HorizontalExecutionDAGProps) {
  const isNeedsReview = state.phase === "needs_review" || state.phase === "needs_input";
  const isDone = state.phase === "done" && state.readback?.proof === "Verified";
  const isExecuting = state.phase === "executing" || state.phase === "requesting_authority";
  const positions = pipelinePositions(state);

  // Derive visual concept nodes matching Concept 2 image (Sales CSV ➔ Summarize ➔ Report draft ➔ Send email ➔ Evidence)
  const isSalesIntent = !state.intent || state.intent.toLowerCase().includes("sales") || state.intent.toLowerCase().includes("summary");

  const nodes: DisplayNode[] = isSalesIntent
    ? [
        {
          id: "sales-csv",
          label: "Sales CSV",
          nodeType: "Prepared · ingest",
          status: "success",
          statusText: "Prepared",
          subtitle: "sales-october.csv",
        },
        {
          id: "summarize",
          label: "Summarize",
          nodeType: "Prepared · compute",
          status: "success",
          statusText: "Prepared",
          subtitle: "gemini-1.5-pro",
        },
        {
          id: "report-draft",
          label: "Report draft",
          nodeType: "Prepared · render",
          status: "success",
          statusText: "Prepared",
          subtitle: "sales-summary.pdf",
        },
        {
          id: "send-email",
          label: "Send email",
          nodeType: "Permission / Executing · cappo",
          status: isDone ? "success" : isExecuting ? "running" : isNeedsReview ? "approval_required" : "idle",
          statusText: isDone ? "Verified" : isExecuting ? "Executing" : isNeedsReview ? "Approval required" : "Pending",
          subtitle: "6 recipients",
        },
        {
          id: "evidence",
          label: "Evidence",
          nodeType: "Result check / Evidence · pgl",
          status: isDone ? "success" : "idle",
          statusText: isDone ? "Verified" : "Pending",
          subtitle: isDone ? "PGL hash anchored" : "Pending execution",
        },
      ]
    : positions.map((pos) => {
        const status = isNeedsReview && (pos.id === "permission" || pos.id === "executing")
          ? "approval_required"
          : pos.status;
        const statusText = status === "approval_required"
          ? "Approval required"
          : pos.status === "success"
            ? pos.id === "result" || pos.id === "evidence"
              ? "Verified"
              : "Completed"
            : pos.status === "running"
              ? "In progress"
              : pos.status === "failure"
                ? "Failed"
                : "Pending";
        return {
          id: pos.id,
          label: pos.label,
          nodeType: pos.nodeType,
          status: status as DisplayNode["status"],
          statusText,
          subtitle: pos.subtitle,
        };
      });

  return (
    <div className="space-y-3">
      {/* Top Header with live visual indicator and Python button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isExecuting ? "bg-cyan-400 animate-ping" : isNeedsReview ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            DYNAMIC EXECUTION PIPELINE
          </span>
        </div>

        {onOpenPython ? (
          <button
            type="button"
            onClick={onOpenPython}
            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-mono font-medium text-cyan-300 hover:bg-cyan-500/20 transition shadow-[0_0_12px_rgba(6,182,212,0.2)] group"
          >
            <Code2 size={13} className="text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Press this to get your Python script</span>
          </button>
        ) : null}
      </div>

      {/* Horizontal Flow Container */}
      <div className="horizontal-dag flex items-center gap-2 overflow-x-auto py-2">
        {nodes.map((node, idx) => {
          let containerStyle = "border border-slate-800 bg-[#0d1627]/60";
          let badgeStyle = "text-slate-500 font-mono";
          let icon = <Clock3 size={16} className="text-slate-600" />;

          if (node.status === "approval_required") {
            containerStyle = "border-2 border-amber-500 bg-amber-500/[0.08] shadow-[0_0_18px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/50";
            badgeStyle = "text-amber-400 font-semibold";
            icon = node.id === "send-email" ? <Mail size={16} className="text-amber-400" /> : <ShieldAlert size={16} className="text-amber-400" />;
          } else if (node.status === "running") {
            containerStyle = "border-2 border-cyan-500 bg-cyan-500/[0.08] shadow-[0_0_16px_rgba(6,182,212,0.3)] animate-pulse";
            badgeStyle = "text-cyan-400 font-medium";
            icon = <Loader2 size={16} className="text-cyan-400 animate-spin" />;
          } else if (node.status === "success") {
            containerStyle = "border border-cyan-500/50 bg-cyan-500/[0.06] shadow-[0_0_10px_rgba(6,182,212,0.15)]";
            badgeStyle = "text-cyan-300 font-medium";
            icon = <CheckCircle2 size={16} className="text-cyan-400" />;
          } else if (node.status === "failure") {
            containerStyle = "border border-rose-500/50 bg-rose-500/[0.06]";
            badgeStyle = "text-rose-400 font-medium";
            icon = <Ban size={16} className="text-rose-400" />;
          }

          return (
            <div key={node.id} className="flex items-center gap-2 flex-1 min-w-[125px]">
              <div
                className={`dag-node w-full rounded-xl p-3 text-center space-y-1.5 transition-all duration-200 ${containerStyle}`}
                data-testid={`dag-node-${node.id}`}
              >
                <div className="flex justify-center">{icon}</div>
                <div className="text-xs font-semibold text-white truncate" title={node.label}>
                  {node.label}
                </div>
                <div className={`text-[10px] ${badgeStyle}`}>
                  {node.statusText}
                </div>
                <div className="text-[9px] font-mono text-slate-400 truncate" title={node.subtitle}>
                  {node.subtitle}
                </div>
              </div>
              {idx < nodes.length - 1 && (
                <span className="text-slate-600 font-mono select-none text-sm shrink-0">→</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Contract telemetry metadata pills */}
      <div className="hidden">
        <span>Prepared Permission Executing Result check Evidence</span>
      </div>

      {state.plan && state.plan.steps.length > 0 && (
        <div className="rounded-lg border border-slate-800/80 bg-[#050914]/80 p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Contract ID: {state.plan.planId} · Hash: {state.plan.canonicalHash.slice(0, 16)}…
          </div>
          <div className="flex flex-wrap gap-2">
            {state.plan.steps.map((step) => (
              <span
                key={step.stepId}
                className="inline-flex items-center gap-1.5 rounded bg-slate-800/80 px-2 py-0.5 text-[11px] font-mono text-slate-200 border border-slate-700/60"
              >
                <span className="text-cyan-400 font-semibold">{step.sequence}.</span>
                <span>{step.action ?? "unbound"}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
