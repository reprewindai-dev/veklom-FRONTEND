"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, HelpCircle, KeyRound, ShieldCheck } from "lucide-react";
import { describeArguments, type ArgumentValue } from "@/lib/cos/execution-intent";
import { activeStep } from "@/lib/cos/tasks/task-reducer";
import type { StepBinding, TaskState, WorkspaceStep } from "@/lib/cos/tasks/task-types";
import { capabilityNotice } from "./ActionReviewCard";

const COVERAGE: Record<WorkspaceStep["coverage"], { label: string; icon: typeof CheckCircle2; tone: string }> = {
  read: { label: "Read", icon: CheckCircle2, tone: "text-emerald-400" },
  write: { label: "Write", icon: KeyRound, tone: "text-cyan-400" },
  blocked: { label: "Blocked by the catalog", icon: Ban, tone: "text-rose-400" },
  uncovered: { label: "No capability covers this", icon: HelpCircle, tone: "text-amber-400" },
};

const inputClass = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400";

/**
 * What the contract says and the one action approval would authorize. Every field is the
 * compiler's: action, target, resource, arguments and the contract hash the approval pins to.
 */
export function ActionApprovalCard({
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
  const step = activeStep(state);
  const plan = state.plan;
  const [resource, setResource] = useState("");
  const [args, setArgs] = useState("");
  const [argsError, setArgsError] = useState<string>();

  if (!plan) return null;

  function bind(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!step || !resource.trim()) return;
    let parsed: unknown = {};
    if (args.trim()) {
      try {
        parsed = JSON.parse(args);
      } catch {
        setArgsError("Arguments must be a JSON object, for example {\"amount\": 5}.");
        return;
      }
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setArgsError("Arguments must be a JSON object.");
      return;
    }
    setArgsError(undefined);
    onBind(step.sequence, { resource: resource.trim(), arguments: parsed as Record<string, ArgumentValue> });
  }

  const notice = capabilityNotice(step?.operation?.package_ref ?? step?.packageRef);
  const reviewable = state.phase === "needs_review" && Boolean(step?.operation);

  return (
    <div className="action-approval-card space-y-5 rounded-2xl border border-slate-800/80 bg-[#0a1628]/95 p-5 text-slate-100">
      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">What the contract says · {plan.planId}</div>
        <ol className="space-y-2">
          {plan.steps.map((item) => {
            const coverage = COVERAGE[item.coverage];
            const Icon = coverage.icon;
            const isActive = item.stepId === state.activeStepId;
            return (
              <li key={item.stepId} className={`flex items-start gap-3 rounded-lg border p-3 ${isActive ? "border-cyan-500/50 bg-cyan-500/[0.05]" : "border-slate-800 bg-slate-900/40"}`}>
                <span className="font-mono text-[10px] text-slate-500">{item.sequence}</span>
                <Icon size={16} className={`mt-0.5 shrink-0 ${coverage.tone}`} />
                <div className="min-w-0">
                  <div className="text-sm text-slate-100">{item.clause}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-slate-400"><span className={coverage.tone}>{coverage.label}</span>{item.action ? ` · ${item.action}` : ""}{item.packageRef ? ` · ${item.packageRef}` : ""}</div>
                  {item.reason ? <div className="mt-0.5 text-[11px] text-slate-500">{item.reason}</div> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {state.phase === "needs_input" && step ? (
        <form onSubmit={bind} className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/[0.05] p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-400">
            <KeyRound size={13} /> Step {step.sequence} needs its exact target resource
          </div>
          <p className="text-xs leading-5 text-slate-300">
            The catalog covers &ldquo;{step.clause}&rdquo;{step.action ? ` as ${step.action}` : ""}. Name the one resource it should act on. ABIDE binds the operation; the browser only carries it.
          </p>
          <label className="block text-xs text-slate-300">
            Resource
            <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="e.g. demo-counter" className={inputClass} required />
          </label>
          <label className="block text-xs text-slate-300">
            Arguments (JSON object, optional)
            <input value={args} onChange={(e) => setArgs(e.target.value)} placeholder='{"amount": 5}' className={inputClass} />
          </label>
          {argsError ? <p className="text-xs text-rose-400">{argsError}</p> : null}
          {notice ? <p className="rounded-lg border border-amber-500/40 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-300">{notice}</p> : null}
          <button type="submit" disabled={busy || !resource.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
            <KeyRound size={14} /> Bind this step
          </button>
        </form>
      ) : null}

      {reviewable && step?.operation ? (
        <div className="space-y-4 rounded-xl border-2 border-cyan-500/60 bg-cyan-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-2.5 text-cyan-400"><ShieldCheck size={20} /></div>
            <div className="min-w-0 space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-white">Run {step.operation.action} on {step.operation.resource}?</h3>
              <p className="text-xs text-slate-300">This is the one action the grant would cover. Nothing else in the contract runs.</p>
            </div>
          </div>

          <dl className="grid gap-2 rounded-xl border border-slate-800/80 bg-[#0d1627]/60 p-4 font-mono text-xs sm:grid-cols-2">
            <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Action</dt><dd className="mt-0.5 text-slate-100">{step.operation.action}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Target</dt><dd className="mt-0.5 break-all text-slate-100">{step.operation.target_ref}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Resource</dt><dd className="mt-0.5 break-all text-slate-100">{step.operation.resource}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Arguments</dt><dd className="mt-0.5 break-all text-slate-100">{describeArguments(step.operation.arguments)}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Capability package</dt><dd className="mt-0.5 break-all text-slate-100">{step.operation.package_ref}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Workspace</dt><dd className="mt-0.5 break-all text-slate-100">{workspace ?? "none bound"}</dd></div>
            <div className="sm:col-span-2"><dt className="text-[10px] uppercase tracking-wider text-slate-400">Contract hash (approval is pinned to it)</dt><dd className="mt-0.5 break-all text-slate-100">{plan.canonicalHash}</dd></div>
          </dl>

          {notice ? <p className="rounded-lg border border-amber-500/40 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-300">{notice}</p> : null}

          <p className="text-xs leading-5 text-slate-300">
            Approving asks the authority layer for a single-use grant for exactly this operation, runs it once, and reads the target back independently. The grant is consumed by the first allowed consequence; a retry is refused.
          </p>
          {!workspace ? (
            <p className="text-xs text-amber-300">No workspace is bound to this session. <Link href="/os/onboarding" className="underline">Create or bind one</Link> before approving.</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={onApprove}
              disabled={busy || !workspace}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-xs font-semibold text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition hover:bg-cyan-300 disabled:opacity-50"
            >
              <CheckCircle2 size={15} /> Approve and run once
            </button>
            {onCancel ? (
              <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:text-slate-200">Discard this task</button>
            ) : null}
          </div>
          <p className="font-mono text-[10px] text-slate-400">Approval applies only to this operation under this contract hash.</p>
        </div>
      ) : null}

      {!reviewable && state.phase !== "needs_input" && onCancel ? (
        <div className="flex justify-end">
          <button type="button" onClick={onCancel} className="rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:text-slate-200">Start another task</button>
        </div>
      ) : null}
    </div>
  );
}
