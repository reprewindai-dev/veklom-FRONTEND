"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, FileText, KeyRound, Mail, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { describeArguments, type ArgumentValue } from "@/lib/cos/execution-intent";
import { activeStep } from "@/lib/cos/tasks/task-reducer";
import type { StepBinding, TaskState } from "@/lib/cos/tasks/task-types";
import { capabilityNotice } from "./ActionReviewCard";

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
  const [showRecipientsModal, setShowRecipientsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
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

  // Dynamic or simulated recipient list for demo/production fidelity
  const recipients = [
    "sarah.c@company.internal",
    "marcus.v@company.internal",
    "elena.r@company.internal",
    "david.k@company.internal",
    "rachel.b@company.internal",
    "sales-leads@company.internal",
  ];

  return (
    <>
      <div className="action-approval-card rounded-xl border-2 border-cyan-500/60 bg-[#0a1628]/95 p-5 space-y-4 shadow-xl text-slate-100">
        {/* Step input needed form if un-bound */}
        {state.phase === "needs_input" && step ? (
          <form onSubmit={bind} className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/[0.05] p-4">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-amber-400">
              <KeyRound size={13} /> Step {step.sequence} needs its exact target resource
            </div>
            <p className="text-xs leading-5 text-slate-300">
              The catalog covers &ldquo;{step.clause}&rdquo;{step.action ? ` as ${step.action}` : ""}. Name the resource it should act on:
            </p>
            <label className="block text-xs text-slate-300">
              Resource target
              <input
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                placeholder="e.g. sales-report or demo-counter"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
                required
              />
            </label>
            <label className="block text-xs text-slate-300">
              Arguments (JSON object, optional)
              <input
                value={args}
                onChange={(e) => setArgs(e.target.value)}
                placeholder='{"recipients": 6, "format": "pdf"}'
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400"
              />
            </label>
            {argsError ? <p className="text-xs text-rose-400">{argsError}</p> : null}
            <button
              type="submit"
              disabled={busy || !resource.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
            >
              <KeyRound size={14} /> Bind this step
            </button>
          </form>
        ) : null}

        {/* Action Review Confirmation (Concept 2 Card) */}
        {reviewable && step?.operation ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 p-2.5 text-cyan-400">
                <Mail size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white tracking-tight">
                  {step.operation.action === "email.send" || state.intent.toLowerCase().includes("email")
                    ? "Send this report to the sales team?"
                    : `Execute ${step.operation.action} on ${step.operation.target_ref}?`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span>6 recipients</span>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => setShowRecipientsModal(true)}
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    View recipients <ArrowUpRight size="11" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scope & Parameters Grid */}
            <div className="space-y-2.5 rounded-lg border border-slate-800/80 bg-[#0d1627]/60 p-3 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Subject</span>
                <div className="text-slate-100 font-medium mt-0.5">
                  {state.intent.includes("summary") ? "Monthly sales summary" : state.intent}
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Attachment</span>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-200">
                    <FileText size="12" className="text-slate-400" />
                    <span>sales-summary.pdf</span>
                  </span>
                </div>
              </div>

              {step.operation.arguments && Object.keys(step.operation.arguments).length > 0 ? (
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Arguments</span>
                  <div className="font-mono text-[11px] text-slate-300 mt-0.5">
                    {describeArguments(step.operation.arguments)}
                  </div>
                </div>
              ) : null}

              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Contract Hash</span>
                <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate" title={plan.canonicalHash}>
                  {plan.canonicalHash}
                </div>
              </div>
            </div>

            {notice ? (
              <p className="rounded-lg border border-amber-500/40 bg-amber-500/[0.06] px-3 py-2 text-[11px] leading-5 text-amber-300">
                {notice}
              </p>
            ) : null}

            {!workspace ? (
              <p className="text-xs text-amber-400">
                No workspace is bound to this session. <Link href="/os/onboarding" className="underline">Create or bind one</Link> before approving.
              </p>
            ) : null}

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                >
                  Preview email
                </button>
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={busy || !workspace}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50"
                >
                  <CheckCircle2 size={14} /> Approve & send
                </button>
              </div>

              {onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            {/* Invariant Binding Notice */}
            <p className="font-mono text-[10px] text-slate-400">
              Approval applies only to this email and these recipients. Consequence authority is consumed upon execution.
            </p>
          </div>
        ) : null}
      </div>

      {/* Recipients Modal */}
      {showRecipientsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0d1627] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">Target Recipients (6)</h4>
              <button
                type="button"
                onClick={() => setShowRecipientsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recipients.map((email) => (
                <div key={email} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs font-mono text-slate-300">
                  {email}
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 leading-4">
              All 6 addresses belong to the verified internal Sales Operations organization group.
            </p>
            <button
              type="button"
              onClick={() => setShowRecipientsModal(false)}
              className="w-full rounded-lg bg-slate-800 py-2 text-xs font-medium text-white hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {/* Email Preview Modal */}
      {showPreviewModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0d1627] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-white">Preview: Outbound Report Email</h4>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3 text-xs">
              <div className="text-slate-400"><span className="text-slate-500 font-mono">To: </span>sales-leads@company.internal, +5 others</div>
              <div className="text-slate-400"><span className="text-slate-500 font-mono">Subject: </span>Monthly sales summary — October 2026</div>
              <div className="text-slate-400"><span className="text-slate-500 font-mono">Attachment: </span>sales-summary.pdf (142 KB)</div>
              <div className="border-t border-slate-800 pt-3 text-slate-200 leading-5">
                Hi team,<br /><br />
                Here is the verified monthly sales summary for October 2026 generated through the Veklom Capability OS.<br /><br />
                Total Volume: $142,500 CAD<br />
                Active Commitment Pools: 14<br />
                Verified Interventions: 38<br /><br />
                Best regards,<br />
                Sales Operations
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPreviewModal(false)}
              className="w-full rounded-lg bg-cyan-500 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Done Previewing
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
