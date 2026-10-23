"use client";

import { useState } from "react";
import { Ban, Check, CheckCircle2, Clock3, Code2, Copy, Download, FileText, Loader2, ShieldAlert, X } from "lucide-react";
import type { StepBinding, TaskState } from "@/lib/cos/tasks/task-types";
import { ActionApprovalCard } from "./ActionApprovalCard";
import { HorizontalExecutionDAG } from "./HorizontalExecutionDAG";

type Tone = "idle" | "wait" | "busy" | "ok" | "bad" | "warn";

const TONE_CLASS: Record<Tone, string> = {
  idle: "border-slate-700 bg-slate-800/80 text-slate-300",
  wait: "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]",
  busy: "animate-pulse border-cyan-500/50 bg-cyan-500/10 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
  ok: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]",
  bad: "border-rose-500/50 bg-rose-500/10 text-rose-400",
  warn: "border-amber-500/50 bg-amber-500/10 text-amber-300",
};

/** The task's status in the words the lifecycle uses. Derived from the phase and the responses only. */
export function describePhase(state: TaskState): { label: string; tone: Tone } {
  switch (state.phase) {
    case "idle": return { label: "No task yet", tone: "idle" };
    case "compiling": return { label: "Compiling against the catalog", tone: "busy" };
    case "needs_input": return { label: "Needs the exact target", tone: "wait" };
    case "needs_review": return { label: "Waiting for your approval", tone: "wait" };
    case "refused": return { label: "Refused: not covered by the catalog", tone: "bad" };
    case "requesting_authority": return { label: "Requesting a single-use grant", tone: "busy" };
    case "executing": return { label: "Executing once", tone: "busy" };
    case "reading_back": return { label: "Reading the target back", tone: "busy" };
    case "denied": return { label: state.execution ? "Execution refused by the authority layer" : "Grant refused by the authority layer", tone: "bad" };
    case "outcome_unknown": return { label: "Outcome unknown: reconciliation required", tone: "warn" };
    case "failed": return { label: "Failed", tone: "bad" };
    case "done":
      if (state.readback?.proof === "Verified") return { label: "Verified and complete", tone: "ok" };
      if (state.readback?.proof === "Degraded") return { label: "Executed; readback does not match", tone: "bad" };
      return { label: "Executed; not yet verified", tone: "warn" };
  }
}

function Crumb({ label, on, tone = "text-slate-300" }: { label: string; on: boolean; tone?: string }) {
  return <span className={on ? `${tone} font-medium` : "text-slate-500"}>{label}</span>;
}

/**
 * One task, from the compiled contract to the independent readback. Everything on it is
 * read from the task state; the card shows nothing before a contract exists.
 */
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
  const [showPython, setShowPython] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = describePhase(state);
  const Icon = status.tone === "busy" ? Loader2 : status.tone === "ok" ? CheckCircle2 : status.tone === "bad" ? Ban : status.tone === "warn" ? ShieldAlert : Clock3;

  if (state.phase === "idle" && !state.plan) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-[#091122]/60 p-6 text-slate-300">
        <div className="flex items-start gap-3">
          <FileText size={18} className="mt-0.5 shrink-0 text-slate-500" />
          <div>
            <h2 className="text-sm font-semibold text-white">No task yet</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Describe what you need above. The compiler returns the steps, which capability covers each, and what it refuses. Nothing is granted or run until you approve the one action it shows you.
            </p>
            <code className="mt-3 block font-mono text-[10px] text-slate-500">POST /api/abide/v1/blueprint/compile</code>
          </div>
        </div>
      </div>
    );
  }

  const title = state.intent.length > 72 ? `${state.intent.slice(0, 72)}…` : state.intent || "Task";
  const python = state.plan?.pythonCode;
  const granted = state.authority?.decision === "allow";
  const executed = state.execution?.decision === "allow";
  const readBack = Boolean(state.readback);

  function copyPython() {
    if (!python) return;
    void navigator.clipboard.writeText(python);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadPython() {
    if (!python) return;
    const blob = new Blob([python], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `veklom_${state.plan?.planId ?? "contract"}.py`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="active-task-card relative space-y-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#091122]/90 p-6 text-slate-100 shadow-xl backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-cos-grid opacity-15 [background-size:32px_32px]" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <FileText size={18} className="shrink-0 text-slate-300" />
            <h2 className="truncate text-base font-semibold tracking-tight text-white" title={state.intent}>{title}</h2>
          </div>
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${TONE_CLASS[status.tone]}`}>
            <Icon size={13} className={status.tone === "busy" ? "animate-spin" : undefined} />
            <span>{status.label}</span>
          </div>
        </div>

        <div className="relative z-10">
          <HorizontalExecutionDAG state={state} onOpenPython={python ? () => setShowPython(true) : undefined} />
        </div>

        {state.plan ? (
          <div className="relative z-10">
            <ActionApprovalCard state={state} workspace={workspace} busy={busy} onBind={onBind} onApprove={onApprove} onCancel={onCancel} />
          </div>
        ) : null}

        <div className="relative z-10 flex flex-wrap items-center gap-2 border-t border-slate-800/60 pt-2 font-mono text-xs text-slate-400">
          <Clock3 size={13} className="text-slate-400" />
          <Crumb label="Compiled" on={Boolean(state.plan)} />
          <span className="text-slate-600">→</span>
          <Crumb label="Approved" on={Boolean(state.approval) || granted} tone="text-amber-400" />
          <span className="text-slate-600">→</span>
          <Crumb label="Granted" on={granted} tone="text-cyan-400" />
          <span className="text-slate-600">→</span>
          <Crumb label="Executed once" on={executed} tone="text-cyan-400" />
          <span className="text-slate-600">→</span>
          <Crumb label={state.readback?.proof === "Verified" ? "Readback verified" : readBack ? `Readback: ${state.readback?.proof}` : "Read back"} on={readBack} tone={state.readback?.proof === "Verified" ? "text-emerald-400" : "text-amber-400"} />
        </div>
      </div>

      {showPython && python ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl space-y-4 rounded-2xl border border-cyan-500/40 bg-[#091122] p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-cyan-400"><Code2 size={18} /></div>
                <div>
                  <h4 className="text-base font-semibold text-white">Governed Python from ABIDE</h4>
                  <p className="font-mono text-xs text-slate-400">Returned with contract {state.plan?.planId}. It can only act under a single-use permit; this code grants nothing.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={copyPython} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-200 hover:bg-slate-700">
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}<span>{copied ? "Copied" : "Copy"}</span>
                </button>
                <button type="button" onClick={downloadPython} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-200 hover:bg-slate-700">
                  <Download size={13} /><span>Download .py</span>
                </button>
                <button type="button" onClick={() => setShowPython(false)} className="p-1 text-slate-400 hover:text-white" aria-label="Close"><X size={18} /></button>
              </div>
            </div>
            <pre className="max-h-96 overflow-auto rounded-xl border border-slate-800 bg-[#050914] p-4 font-mono text-xs leading-relaxed text-slate-300">{python}</pre>
          </div>
        </div>
      ) : null}
    </>
  );
}
