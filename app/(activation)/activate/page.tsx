"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Zap,
} from "lucide-react";

import { PremiumLogo, StageLabel } from "@/components/brand/PremiumPrimitives";
import { useAuth } from "@/lib/auth-context";
import {
  ActivationUnavailableError,
  discoverActivationPackage,
  executeActivationAllowed,
  inspectActivationEvidence,
  proveActivationDenial,
  requestActivationLease,
  type ActivationAllowedExecution,
  type ActivationDenial,
  type ActivationEvidence,
  type ActivationLease,
  type ActivationPackage,
} from "@/lib/cos/activation";

const DEFAULT_PROJECT = "activation-v1";
const steps = ["Discover", "Bind authority", "Prove denial", "Execute", "Inspect evidence"];

function JsonProof({ value }: { value: unknown }) {
  return (
    <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-2xl border border-white/10 bg-[#05070b] p-4 font-mono text-[10px] leading-5 text-white/62 shadow-inner">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function ProgressItem({ index, title, step }: { index: number; title: string; step: number }) {
  const complete = step > index;
  const active = step === index;
  return (
    <div className="grid grid-cols-[34px_1fr] items-center gap-3 py-2.5">
      <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-[10px] font-semibold transition ${complete ? "border-theme-verified bg-theme-verified text-white" : active ? "border-theme-accent text-theme-accent shadow-[0_0_0_5px_rgb(var(--theme-accent)/.07)]" : "border-theme-border text-theme-inkDim"}`}>
        {complete ? <CheckCircle2 className="h-4 w-4" /> : String(index).padStart(2, "0")}
      </span>
      <span className={`text-xs font-medium ${active || complete ? "text-theme-ink" : "text-theme-inkDim"}`}>{title}</span>
    </div>
  );
}

function ActionButton({ children, onClick, busy, danger = false }: { children: React.ReactNode; onClick: () => void; busy: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`group mt-8 inline-flex min-h-13 items-center gap-4 rounded-full px-6 text-sm font-semibold shadow-[0_16px_42px_rgba(0,0,0,.12)] transition duration-300 hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-50 disabled:hover:translate-y-0 ${danger ? "bg-theme-danger text-white" : "bg-theme-ink text-theme-bg"}`}
    >
      {children}
      {!busy && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
    </button>
  );
}

export default function ActivationPage() {
  const router = useRouter();
  const { me } = useAuth();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [workspaceId, setWorkspaceId] = useState("");
  const [projectId, setProjectId] = useState(DEFAULT_PROJECT);
  const [capability, setCapability] = useState<ActivationPackage>();
  const [lease, setLease] = useState<ActivationLease>();
  const [denial, setDenial] = useState<ActivationDenial>();
  const [execution, setExecution] = useState<ActivationAllowedExecution>();
  const [evidence, setEvidence] = useState<ActivationEvidence>();

  useEffect(() => {
    const scopedWorkspace = me?.workspace_id;
    if (scopedWorkspace && !workspaceId) setWorkspaceId(scopedWorkspace);
  }, [me?.workspace_id, workspaceId]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      const message = cause instanceof ActivationUnavailableError || cause instanceof Error
        ? cause.message
        : "Activation is unavailable because a required live proof step failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function connect() {
    await run(async () => {
      const selected = await discoverActivationPackage();
      setCapability(selected);
      setStep(2);
    });
  }

  async function grant() {
    if (!capability || !workspaceId.trim() || !projectId.trim()) return;
    await run(async () => {
      const issued = await requestActivationLease(capability, workspaceId.trim(), projectId.trim());
      setLease(issued);
      setStep(3);
    });
  }

  async function challenge() {
    if (!lease) return;
    await run(async () => {
      const rejected = await proveActivationDenial(lease);
      setDenial(rejected);
      setStep(4);
    });
  }

  async function execute() {
    if (!lease) return;
    await run(async () => {
      const allowed = await executeActivationAllowed(lease);
      setExecution(allowed);
      setStep(5);
    });
  }

  async function inspectEvidence() {
    if (!execution) return;
    await run(async () => {
      const proof = await inspectActivationEvidence(execution);
      setEvidence(proof);
      setStep(6);
    });
  }

  return (
    <main className="min-h-screen bg-theme-bg text-theme-ink">
      <header className="border-b border-theme-border bg-theme-bg/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1480px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <PremiumLogo />
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[.18em] text-theme-inkDim">
            <span className="hidden sm:inline">Live Activation</span>
            <span className="h-1.5 w-1.5 rounded-full bg-theme-verified shadow-[0_0_0_5px_rgb(var(--theme-verified)/.08)]" />
            Real backend only
          </div>
        </div>
      </header>

      <div className="relative mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1480px] gap-8 px-5 py-8 sm:px-8 md:py-12 lg:grid-cols-[310px_1fr] lg:gap-10 lg:px-10">
        <aside className="h-fit rounded-[28px] border border-theme-border bg-theme-surface p-6 lg:sticky lg:top-24 md:p-7">
          <StageLabel>Proof sequence</StageLabel>
          <h1 className="mt-5 text-3xl font-semibold leading-[1.02] tracking-[-.045em] text-theme-ink">One live journey from capability to evidence.</h1>
          <div className="mt-7 border-t border-theme-border pt-5">
            {steps.map((title, idx) => <ProgressItem key={title} index={idx + 1} title={title} step={step} />)}
          </div>
          <div className="mt-7 rounded-2xl border border-theme-border bg-theme-bg p-4 text-[11px] leading-6 text-theme-inkDim">
            No browser-only lease. No fake hash. No canned ALLOW/DENY. A stage advances only after the real backend returns the required state.
          </div>
          {me?.email && (
            <div className="mt-4 border-t border-theme-border pt-4 text-[10px] text-theme-inkDim">
              Session · <span className="font-medium text-theme-ink">{me.email}</span>
            </div>
          )}
        </aside>

        <section className="relative overflow-hidden rounded-[32px] border border-theme-border bg-theme-surface shadow-[0_40px_120px_rgba(2,8,23,.07)]">
          <div className="absolute right-[-8rem] top-[-9rem] h-96 w-96 rounded-full bg-[radial-gradient(circle,rgb(var(--theme-accent)/.13),transparent_68%)] blur-3xl" aria-hidden="true" />
          <div className="relative min-h-[680px] p-6 sm:p-9 md:p-12 lg:p-14">
            {error && (
              <div className="mb-8 flex gap-3 rounded-2xl border border-theme-danger/20 bg-theme-danger/5 p-4 text-sm leading-6 text-theme-danger">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div><div className="font-semibold">Live proof stopped.</div><div className="mt-1">{error}</div><div className="mt-1 text-xs opacity-70">No proof-bearing state was advanced.</div></div>
              </div>
            )}

            {step === 1 && (
              <div className="max-w-3xl">
                <Activity className="h-9 w-9 text-theme-accent" />
                <div className="mt-8 text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">01 · Discover</div>
                <h2 className="mt-4 text-4xl font-semibold leading-[.97] tracking-[-.055em] text-theme-ink md:text-6xl">Start with a capability that actually exists.</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-theme-inkDim">Activation asks CAPPO for its live capability-package registry and selects a package that exposes both an allowed read and a blocked action. If none exists, the experience stops instead of inventing one.</p>
                <ActionButton onClick={connect} busy={busy}>{busy ? "Discovering live registry…" : "Discover live capability"}</ActionButton>
              </div>
            )}

            {step === 2 && capability && (
              <div className="max-w-3xl">
                <KeyRound className="h-9 w-9 text-theme-accent" />
                <div className="mt-8 text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">02 · Bind authority</div>
                <h2 className="mt-4 text-4xl font-semibold leading-[.97] tracking-[-.055em] text-theme-ink md:text-6xl">Make the allowed action smaller than the machine.</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-theme-inkDim">CAPPO selected <strong className="text-theme-ink">{capability.title}</strong>. The lease requests one permitted operation and one explicit negative boundary for this workspace.</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-medium text-theme-ink">
                    <span className="mb-2.5 block">Workspace ID</span>
                    <input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} className="min-h-13 w-full rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm outline-none transition focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/5" placeholder="Authenticated workspace" />
                  </label>
                  <label className="text-xs font-medium text-theme-ink">
                    <span className="mb-2.5 block">Activation project</span>
                    <input value={projectId} onChange={(e) => setProjectId(e.target.value)} className="min-h-13 w-full rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm outline-none transition focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/5" />
                  </label>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-theme-border bg-theme-bg p-4"><div className="text-[9px] uppercase tracking-[.18em] text-theme-inkDim">Package</div><div className="mt-2 break-all font-mono text-[11px] text-theme-ink">{capability.id}</div></div>
                  <div className="rounded-2xl border border-theme-verified/20 bg-theme-verified/5 p-4"><div className="text-[9px] uppercase tracking-[.18em] text-theme-inkDim">Permitted</div><div className="mt-2 break-all font-mono text-[11px] text-theme-verified">{capability.reads?.[0]}</div></div>
                  <div className="rounded-2xl border border-theme-danger/20 bg-theme-danger/5 p-4"><div className="text-[9px] uppercase tracking-[.18em] text-theme-inkDim">Blocked</div><div className="mt-2 break-all font-mono text-[11px] text-theme-danger">{capability.blocked?.[0]}</div></div>
                </div>

                <ActionButton onClick={grant} busy={busy}>{busy ? "Requesting bounded lease…" : "Request CAPPO lease"}</ActionButton>
              </div>
            )}

            {step === 3 && lease && (
              <div className="max-w-3xl">
                <ShieldAlert className="h-9 w-9 text-theme-danger" />
                <div className="mt-8 text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">03 · Prove denial</div>
                <h2 className="mt-4 text-4xl font-semibold leading-[.97] tracking-[-.055em] text-theme-ink md:text-6xl">Attack the boundary before trusting the allow.</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-theme-inkDim">The same backend-issued lease is deliberately asked to perform <strong className="text-theme-danger">{lease.deniedAction}</strong>. The journey advances only if CAPPO itself returns a denial before consequence.</p>
                <div className="mt-7"><JsonProof value={{ mount_id: lease.mountId, package_ref: lease.packageRef, challenge_action: lease.deniedAction, mount_anchor_id: lease.anchorId ?? null }} /></div>
                <ActionButton onClick={challenge} busy={busy} danger>{busy ? "Testing negative boundary…" : "Attempt blocked action"}</ActionButton>
              </div>
            )}

            {step === 4 && lease && denial && (
              <div className="max-w-3xl">
                <ShieldCheck className="h-10 w-10 text-theme-verified" />
                <div className="mt-8 text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">04 · Governed execution</div>
                <h2 className="mt-4 text-4xl font-semibold leading-[.97] tracking-[-.055em] text-theme-ink md:text-6xl">The forbidden action failed. Now use the authority once.</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-theme-inkDim">CAPPO returned <strong className="text-theme-ink">{denial.reason}</strong>. The still-bounded lease now executes the permitted operation <strong className="text-theme-verified">{lease.allowedAction}</strong> through the canonical governed path.</p>
                <div className="mt-7"><JsonProof value={denial} /></div>
                <ActionButton onClick={execute} busy={busy}>{busy ? "Executing governed operation…" : "Run permitted operation"}</ActionButton>
              </div>
            )}

            {step === 5 && execution && (
              <div className="max-w-3xl">
                <FileSearch className="h-10 w-10 text-theme-accent" />
                <div className="mt-8 text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">05 · Inspect evidence</div>
                <h2 className="mt-4 text-4xl font-semibold leading-[.97] tracking-[-.055em] text-theme-ink md:text-6xl">Execution exists. That still is not proof.</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-theme-inkDim">CAPPO returned execution ID <strong className="text-theme-ink">{execution.executionId}</strong>. Activation now retrieves the persisted evidence for that exact execution and requires the backend verifier to accept it.</p>
                <div className="mt-7"><JsonProof value={{ execution_id: execution.executionId, run_id: execution.runId ?? null, operation: execution.operation, capability_lease: execution.response.capability_lease ?? null }} /></div>
                <ActionButton onClick={inspectEvidence} busy={busy}>{busy ? "Verifying persisted evidence…" : "Inspect persisted evidence"}</ActionButton>
              </div>
            )}

            {step === 6 && evidence && denial && (
              <div className="max-w-4xl">
                <CheckCircle2 className="h-11 w-11 text-theme-verified" />
                <div className="mt-8 text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Proof complete</div>
                <h2 className="mt-4 text-4xl font-semibold leading-[.97] tracking-[-.055em] text-theme-ink md:text-6xl">The browser observed the whole boundary.</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-theme-inkDim">A backend-issued lease, a real denial, a governed execution and persisted evidence are now tied to this journey. Completion is based on those proof objects—not a decorative success state.</p>
                <div className="mt-8 grid gap-4 lg:grid-cols-2">
                  <div><div className="mb-2 text-[9px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">Denied boundary</div><JsonProof value={denial} /></div>
                  <div><div className="mb-2 text-[9px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">Execution evidence</div><JsonProof value={{ execution_id: evidence.execution_id, proof_state: evidence.proof_state, verification_reasons: evidence.verification_reasons, pgl: evidence.pgl, eee: evidence.eee }} /></div>
                </div>
                <button type="button" onClick={() => router.push("/os")} className="group mt-8 inline-flex min-h-13 items-center gap-4 rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg">Enter Capability OS <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
