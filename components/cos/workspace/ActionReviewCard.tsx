"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, HelpCircle, KeyRound, ShieldCheck } from "lucide-react";
import { describeArguments, type ArgumentValue } from "@/lib/cos/execution-intent";
import { activeStep } from "@/lib/cos/tasks/task-reducer";
import type { StepBinding, TaskState, WorkspaceStep } from "@/lib/cos/tasks/task-types";

const COVERAGE: Record<WorkspaceStep["coverage"], { label: string; icon: typeof CheckCircle2; tone: string }> = {
  read: { label: "Read", icon: CheckCircle2, tone: "text-cos-ok" },
  write: { label: "Write", icon: KeyRound, tone: "text-cos-accent" },
  blocked: { label: "Blocked by the catalog", icon: Ban, tone: "text-cos-danger" },
  uncovered: { label: "No capability covers this", icon: HelpCircle, tone: "text-cos-warn" },
};

/** What the target really is, said next to the action so nobody reads a test capability as a product integration. */
export function capabilityNotice(packageRef: string | null | undefined): string | null {
  if (!packageRef) return null;
  if (packageRef.includes("governed-counter")) {
    return "Sandbox pool: governed-counter test capability. This is a governed counter used to prove the authority path. It is not a Sarafu pool, a voucher, or a bank balance.";
  }
  return null;
}

const inputClass = "mt-1 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text";

export function ActionReviewCard({
  state,
  workspace,
  busy,
  onBind,
  onApprove,
}: {
  state: TaskState;
  workspace: string | null;
  busy: boolean;
  onBind: (sequence: number, binding: StepBinding) => void;
  onApprove: () => void;
}) {
  const step = activeStep(state);
  const [resource, setResource] = useState("");
  const [args, setArgs] = useState("");
  const [argsError, setArgsError] = useState<string>();

  if (!state.plan) return null;
  const { plan } = state;

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
  const reviewable = state.phase === "needs_review" && step?.operation;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">What the contract says · {plan.planId}</div>
        <ol className="space-y-2">
          {plan.steps.map((item) => {
            const coverage = COVERAGE[item.coverage];
            const Icon = coverage.icon;
            const isActive = item.stepId === state.activeStepId;
            return (
              <li key={item.stepId} className={`flex items-start gap-3 rounded-lg border p-3 ${isActive ? "border-cos-accent/50 bg-cos-accent/[0.05]" : "border-cos-border bg-cos-bg/40"}`}>
                <span className="font-mono text-[10px] text-cos-steel">{item.sequence}</span>
                <Icon size={16} className={`mt-0.5 shrink-0 ${coverage.tone}`} />
                <div className="min-w-0">
                  <div className="text-sm text-cos-text">{item.clause}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-cos-muted"><span className={coverage.tone}>{coverage.label}</span>{item.action ? ` · ${item.action}` : ""}{item.packageRef ? ` · ${item.packageRef}` : ""}</div>
                  {item.reason ? <div className="mt-0.5 text-[11px] text-cos-steel">{item.reason}</div> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {state.phase === "needs_input" && step ? (
        <form onSubmit={bind} className="space-y-3 rounded-xl border border-cos-accent/30 bg-cos-accent/[0.04] p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Step {step.sequence} needs its exact target</div>
          <p className="text-xs leading-5 text-cos-muted">The catalog covers &ldquo;{step.clause}&rdquo;{step.action ? ` as ${step.action}` : ""}. Name the one resource it should act on. ABIDE binds the operation; the browser only carries it.</p>
          <label className="block text-xs text-cos-muted">Resource<input value={resource} onChange={(event) => setResource(event.target.value)} placeholder="e.g. demo-counter" className={inputClass} required /></label>
          <label className="block text-xs text-cos-muted">Arguments (JSON object, optional)<input value={args} onChange={(event) => setArgs(event.target.value)} placeholder='{"amount": 5}' className={inputClass} /></label>
          {argsError ? <p className="text-xs text-cos-warn">{argsError}</p> : null}
          {notice ? <p className="rounded-lg border border-cos-warn/40 bg-cos-warn/[0.06] px-3 py-2 text-[11px] leading-5 text-cos-warn">{notice}</p> : null}
          <button type="submit" disabled={busy || !resource.trim()} className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/50 px-4 py-2 text-xs font-semibold text-cos-accent hover:bg-cos-accent/10 disabled:opacity-50">
            <KeyRound size={14} /> Bind this step
          </button>
        </form>
      ) : null}

      {reviewable && step?.operation ? (
        <div className="space-y-3 rounded-xl border border-cos-accent/40 bg-cos-accent/[0.05] p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel"><ShieldCheck size={13} className="text-cos-accent" /> Action requires your approval</div>
          <div className="grid gap-1 font-mono text-xs text-cos-text sm:grid-cols-2">
            <div><span className="text-cos-steel">action </span>{step.operation.action}</div>
            <div><span className="text-cos-steel">target </span>{step.operation.target_ref}</div>
            <div><span className="text-cos-steel">resource </span>{step.operation.resource}</div>
            <div><span className="text-cos-steel">arguments </span>{describeArguments(step.operation.arguments)}</div>
            <div className="sm:col-span-2"><span className="text-cos-steel">contract </span>{plan.canonicalHash}</div>
          </div>
          {notice ? <p className="rounded-lg border border-cos-warn/40 bg-cos-warn/[0.06] px-3 py-2 text-[11px] leading-5 text-cos-warn">{notice}</p> : null}
          <p className="text-xs leading-5 text-cos-muted">
            Approving asks the authority layer for a single-use grant for exactly this operation{workspace ? ` in workspace ${workspace}` : ""}, runs it once, and reads the target back. The grant is consumed by the first allowed consequence; a retry is refused.
          </p>
          {!workspace ? (
            <p className="text-xs text-cos-warn">No workspace is bound to this session. <Link href="/os/onboarding" className="underline">Create or bind one</Link> before approving.</p>
          ) : null}
          <button type="button" onClick={onApprove} disabled={busy || !workspace} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-4 py-2 text-sm font-semibold text-cos-bg disabled:opacity-50">
            <CheckCircle2 size={15} /> Approve and run once
          </button>
        </div>
      ) : null}
    </div>
  );
}
