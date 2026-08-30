"use client";

import { useState } from "react";
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

function JsonProof({ value }: { value: unknown }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-lg border border-[var(--theme-border)] bg-black/5 p-3 text-[11px] leading-5 dark:bg-white/5">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function StepItem({
  number,
  title,
  active,
  complete,
}: {
  number: number;
  title: string;
  active: boolean;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
          complete
            ? "border-emerald-500 bg-emerald-500 text-white"
            : active
              ? "border-[var(--theme-accent)] text-[var(--theme-accent)]"
              : "border-[var(--theme-border)] opacity-50"
        }`}
      >
        {complete ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>
      <span className={active || complete ? "font-medium" : "opacity-50"}>{title}</span>
    </div>
  );
}

export default function ActivationPage() {
  const router = useRouter();
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

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(undefined);
    try {
      await action();
    } catch (cause) {
      const message =
        cause instanceof ActivationUnavailableError || cause instanceof Error
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
      const issued = await requestActivationLease(
        capability,
        workspaceId.trim(),
        projectId.trim(),
      );
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
    <main className="min-h-screen bg-[var(--theme-bg)] p-6 text-[var(--theme-text)]">
      <div className="mx-auto grid min-h-[640px] max-w-5xl overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-surface)] shadow-lg md:grid-cols-[280px_1fr]">
        <aside className="border-b border-[var(--theme-border)] bg-black/[0.025] p-7 dark:bg-white/[0.025] md:border-b-0 md:border-r">
          <div className="mb-9 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--theme-accent)] text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold">Veklom Activation</div>
              <div className="text-xs opacity-55">Live proof journey</div>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <StepItem number={1} title="Discover" active={step === 1} complete={step > 1} />
            <StepItem number={2} title="Bound authority" active={step === 2} complete={step > 2} />
            <StepItem number={3} title="Prove denial" active={step === 3} complete={step > 3} />
            <StepItem number={4} title="Governed execution" active={step === 4} complete={step > 4} />
            <StepItem number={5} title="Inspect evidence" active={step === 5} complete={step > 5} />
          </div>

          <div className="mt-8 rounded-lg border border-[var(--theme-border)] p-3 text-xs leading-5 opacity-70">
            This page does not mint browser-only leases, fabricate hashes, simulate execution,
            or mark activation complete with a client cookie. A step advances only after its
            live CAPPO response satisfies the required contract.
          </div>
        </aside>

        <section className="flex items-center p-7 md:p-10">
          <div className="mx-auto w-full max-w-2xl">
            {error ? (
              <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-300">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <XCircle className="h-4 w-4" /> Live proof unavailable
                </div>
                <p>{error}</p>
                <p className="mt-2 text-xs opacity-75">No proof-bearing state was advanced.</p>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <Activity className="mb-5 h-10 w-10 text-[var(--theme-accent)]" />
                <h1 className="text-3xl font-bold tracking-tight">Start with something real.</h1>
                <p className="mt-4 max-w-xl leading-7 opacity-70">
                  Activation first asks CAPPO which capability packages actually exist. If no
                  package can demonstrate both a permitted operation and a blocked operation,
                  the journey stops as unavailable instead of inventing a demo.
                </p>
                <button
                  type="button"
                  onClick={connect}
                  disabled={busy}
                  className="mt-8 flex items-center gap-2 rounded-lg bg-[var(--theme-accent)] px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Discovering..." : "Discover live capability"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {step === 2 && capability ? (
              <div>
                <KeyRound className="mb-5 h-10 w-10 text-[var(--theme-accent)]" />
                <h2 className="text-2xl font-bold">Request bounded authority</h2>
                <p className="mt-3 leading-7 opacity-70">
                  CAPPO selected <strong>{capability.title}</strong> from its live package registry.
                  The activation lease requests only one permitted read and one explicitly blocked
                  action from that package.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-2 block opacity-65">Workspace ID</span>
                    <input
                      value={workspaceId}
                      onChange={(event) => setWorkspaceId(event.target.value)}
                      className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2"
                      placeholder="Your authenticated workspace"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-2 block opacity-65">Activation project</span>
                    <input
                      value={projectId}
                      onChange={(event) => setProjectId(event.target.value)}
                      className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg)] px-3 py-2"
                    />
                  </label>
                </div>
                <div className="mt-5 rounded-lg border border-[var(--theme-border)] p-4 text-sm">
                  <div><span className="opacity-55">Package:</span> {capability.id}</div>
                  <div className="mt-2"><span className="opacity-55">Permitted:</span> {capability.reads?.[0]}</div>
                  <div className="mt-2"><span className="opacity-55">Blocked:</span> {capability.blocked?.[0]}</div>
                </div>
                <button
                  type="button"
                  onClick={grant}
                  disabled={busy || !workspaceId.trim() || !projectId.trim()}
                  className="mt-7 rounded-lg bg-[var(--theme-accent)] px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Requesting lease..." : "Request CAPPO lease"}
                </button>
              </div>
            ) : null}

            {step === 3 && lease ? (
              <div>
                <ShieldAlert className="mb-5 h-10 w-10 text-red-500" />
                <h2 className="text-2xl font-bold">Prove the boundary before using it.</h2>
                <p className="mt-3 leading-7 opacity-70">
                  We deliberately ask the same backend-issued lease to perform
                  <strong> {lease.deniedAction}</strong>. The journey advances only if CAPPO returns
                  a real denial. This check is performed before the permitted operation so a
                  single-use lease remains available for the allowed execution.
                </p>
                <JsonProof value={{
                  mount_id: lease.mountId,
                  package_ref: lease.packageRef,
                  challenge_action: lease.deniedAction,
                  mount_anchor_id: lease.anchorId ?? null,
                }} />
                <button
                  type="button"
                  onClick={challenge}
                  disabled={busy}
                  className="mt-7 rounded-lg bg-red-600 px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Testing boundary..." : "Attempt blocked action"}
                </button>
              </div>
            ) : null}

            {step === 4 && lease && denial ? (
              <div>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold">The forbidden action was denied.</h2>
                <p className="mt-3 leading-7 opacity-70">
                  CAPPO returned <strong>{denial.reason}</strong>. Now the still-bounded lease is
                  used once through the canonical governed execution path for
                  <strong> {lease.allowedAction}</strong>.
                </p>
                <JsonProof value={denial} />
                <button
                  type="button"
                  onClick={execute}
                  disabled={busy}
                  className="mt-7 flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Executing..." : "Run permitted operation"}
                  <Zap className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            {step === 5 && execution ? (
              <div>
                <FileSearch className="mb-5 h-10 w-10 text-[var(--theme-accent)]" />
                <h2 className="text-2xl font-bold">Execution exists. Verify its evidence.</h2>
                <p className="mt-3 leading-7 opacity-70">
                  CAPPO returned execution ID <strong>{execution.executionId}</strong>. Activation
                  still does not call that proof. The next step retrieves the persisted evidence
                  for this exact execution and requires the backend verifier to accept it.
                </p>
                <JsonProof value={{
                  execution_id: execution.executionId,
                  run_id: execution.runId ?? null,
                  operation: execution.operation,
                  capability_lease: execution.response.capability_lease ?? null,
                }} />
                <button
                  type="button"
                  onClick={inspectEvidence}
                  disabled={busy}
                  className="mt-7 rounded-lg bg-[var(--theme-accent)] px-5 py-3 font-medium text-white disabled:opacity-50"
                >
                  {busy ? "Verifying evidence..." : "Inspect persisted evidence"}
                </button>
              </div>
            ) : null}

            {step === 6 && evidence && denial ? (
              <div>
                <CheckCircle2 className="mb-5 h-11 w-11 text-emerald-500" />
                <h2 className="text-3xl font-bold">Activation proof complete.</h2>
                <p className="mt-3 leading-7 opacity-70">
                  This browser observed a backend-issued bounded lease, an anchored denial, a
                  governed execution, and verified persisted evidence. No completion cookie is
                  written; the proof objects below are the basis for the claim.
                </p>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-50">Denied boundary</div>
                    <JsonProof value={denial} />
                  </div>
                  <div>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-50">Execution evidence</div>
                    <JsonProof value={{
                      execution_id: evidence.execution_id,
                      proof_state: evidence.proof_state,
                      verification_reasons: evidence.verification_reasons,
                      pgl: evidence.pgl,
                      eee: evidence.eee,
                    }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/os")}
                  className="mt-7 flex items-center gap-2 rounded-lg bg-[var(--theme-accent)] px-5 py-3 font-medium text-white"
                >
                  Enter Capability OS
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
