"use client";

import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, FlaskConical, Play } from "lucide-react";
import { api, ApiError, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { resolveStageTransportPath } from "@/lib/cos/useStageData";
import { SANDBOX_PROJECT, useSandboxMode } from "@/lib/cos/sandbox";
import {
  runSandboxScenario,
  SANDBOX_SCENARIOS,
  scenarioSdkSnippet,
  type ScenarioId,
  type ScenarioResult,
  type ScenarioTransport,
} from "@/lib/cos/sandbox-scenarios";
import { VeklomActivityCue, type ActivityCondition } from "./VeklomActivityCue";
import { CopyValue } from "./StageParts";
import { ScopeTag } from "./EnvironmentFrame";

/** Workspace claim CAPPO reads from the session JWT (workspace_id | workspace | tenant_id). */
export function sessionWorkspaceClaim(token: string | null = getToken()): string | undefined {
  if (!token || !token.startsWith("eyJ")) return undefined;
  try {
    const part = token.split(".")[1] ?? "";
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))) as Record<string, unknown>;
    const claim = json.workspace_id ?? json.workspace ?? json.tenant_id;
    return typeof claim === "string" && claim.trim() ? claim.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Transport shared with Mount/Execute: same proxy routes, sandbox data-mode header. */
export const sandboxScenarioTransport: ScenarioTransport = async ({ method, path, body }) => {
  try {
    const data = await api<unknown>(resolveStageTransportPath("mount", path), {
      method,
      body,
      headers: { "X-Veklom-Data-Mode": "sandbox" },
      handlePaymentRequired: false,
    });
    return { status: 200, data };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.status, data: error.body, error: error.message };
    return { error: error instanceof Error ? error.message : "request failed" };
  }
};

type RunState = { running: boolean; startedAt?: number; result?: ScenarioResult };

function conditionFor(state?: RunState): ActivityCondition {
  if (!state) return "unknown";
  if (state.running) return "active";
  if (!state.result) return "unknown";
  return state.result.pass ? "verified" : "failed";
}

export function SandboxScenarios() {
  const sandbox = useSandboxMode();
  const { me } = useAuth();
  const [workspace, setWorkspace] = useState("default");
  const [resource, setResource] = useState("sandbox-scenarios");
  const [runs, setRuns] = useState<Partial<Record<ScenarioId, RunState>>>({});
  const [copied, setCopied] = useState<ScenarioId | null>(null);
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://veklom.com";
  const anyRunning = Object.values(runs).some((state) => state?.running);

  useEffect(() => {
    const claim = sessionWorkspaceClaim();
    if (claim) setWorkspace(claim);
  }, []);
  useEffect(() => {
    if (me?.id) setResource(`sandbox-scenarios-${String(me.id).replace(/[^A-Za-z0-9._-]/g, "").slice(0, 8)}`);
  }, [me?.id]);

  const transportPath = useMemo(() => (path: string) => resolveStageTransportPath("mount", path), []);

  if (!sandbox) return null;

  async function run(id: ScenarioId) {
    setRuns((current) => ({ ...current, [id]: { running: true, startedAt: Date.now() } }));
    const result = await runSandboxScenario(id, { workspace, resource, transport: sandboxScenarioTransport });
    setRuns((current) => ({ ...current, [id]: { running: false, startedAt: current[id]?.startedAt, result } }));
  }

  async function runAll() {
    for (const scenario of SANDBOX_SCENARIOS) {
      // Sequential: scenarios share one sandbox counter so readback deltas stay attributable.
      await run(scenario.id);
    }
  }

  function copySnippet(id: ScenarioId) {
    const snippet = scenarioSdkSnippet(id, { baseUrl, workspace, resource, transportPath });
    void navigator.clipboard?.writeText(snippet);
    setCopied(id);
  }

  return (
    <section data-testid="sandbox-scenarios" className="mt-10 rounded-2xl border border-cos-warn/40 bg-cos-warn/[0.04] p-5 shadow-cos-card lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-warn"><FlaskConical size={13} /> Sandbox scenarios · project={SANDBOX_PROJECT}</div>
          <h2 className="mt-2 text-lg font-semibold text-cos-text">Rehearse governed consequence against real CAPPO</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-cos-muted">Each scenario mounts <code className="font-mono">veklom.governed-counter@v1</code> with <code className="font-mono">execution_scope.project=&quot;sandbox&quot;</code>, calls the real CAPPO routes, and compares CAPPO&apos;s decision and an independent counter readback with the expected outcome. Nothing here is simulated.</p>
        </div>
        <button type="button" onClick={() => void runAll()} disabled={anyRunning} className="inline-flex items-center gap-2 rounded-lg bg-cos-warn px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg disabled:cursor-not-allowed disabled:opacity-50"><Play size={13} /> Run all</button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-cos-muted">Workspace (must match your session&apos;s workspace claim)<input value={workspace} onChange={(event) => setWorkspace(event.target.value)} className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-sm text-cos-text" /></label>
        <label className="text-xs text-cos-muted">Sandbox counter resource<input value={resource} onChange={(event) => setResource(event.target.value)} pattern="[A-Za-z0-9._-]{1,128}" className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-sm text-cos-text" /></label>
      </div>
      <div className="mt-5 space-y-3">
        {SANDBOX_SCENARIOS.map((scenario) => {
          const state = runs[scenario.id];
          const result = state?.result;
          return (
            <article key={scenario.id} data-scenario={scenario.id} className="rounded-xl border border-cos-border bg-cos-bg/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <VeklomActivityCue kind="authority" condition={conditionFor(state)} startedAt={state?.running ? state.startedAt : undefined} size={20} showCaption={false} />
                  <h3 className="text-sm font-medium text-cos-text">{scenario.title}</h3>
                  <ScopeTag project={SANDBOX_PROJECT} />
                </div>
                <div className="flex items-center gap-2">
                  {result ? <span data-testid="scenario-verdict" className={`rounded-full border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${result.pass ? "border-cos-verified/50 text-cos-verified" : "border-cos-danger/50 text-cos-danger"}`}>{result.pass ? "PASS" : "FAIL"}</span> : null}
                  <button type="button" onClick={() => void run(scenario.id)} disabled={anyRunning} className="rounded-lg border border-cos-warn/50 px-3 py-1.5 text-[11px] text-cos-warn disabled:opacity-50">{state?.running ? "Running…" : "Run"}</button>
                  <button type="button" onClick={() => copySnippet(scenario.id)} className="inline-flex items-center gap-1 rounded-lg border border-cos-border px-3 py-1.5 text-[11px] text-cos-text"><ClipboardCopy size={12} />{copied === scenario.id ? "Copied" : "Copy as SDK code"}</button>
                </div>
              </div>
              <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Expected</dt><dd className="mt-1 font-mono text-cos-text">{scenario.expected}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Actual (returned by CAPPO)</dt><dd className="mt-1 font-mono text-cos-text">{result?.actual ?? (state?.running ? "Waiting for CAPPO…" : "Not run")}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Receipt ID</dt><dd className="mt-1"><CopyValue value={result?.evidence.receiptId} /></dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Evidence hash (anchor / PGL event)</dt><dd className="mt-1 space-y-1"><CopyValue value={result?.evidence.anchorId} />{result?.evidence.pglEventHash ? <CopyValue value={result.evidence.pglEventHash} /> : null}</dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Mount</dt><dd className="mt-1"><CopyValue value={result?.evidence.mountId} /></dd></div>
                <div><dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Readback (value · version)</dt><dd className="mt-1 font-mono text-cos-text">{result?.before && result.after ? `${result.before.value}·v${result.before.version} → ${result.after.value}·v${result.after.version}` : "—"}</dd></div>
              </dl>
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Routes {result ? `· ${result.steps.length} calls` : `· ${scenario.endpoints.length} planned`}</summary>
                {result ? (
                  <ol className="mt-2 space-y-1 font-mono text-[10px] text-cos-muted">
                    {result.steps.map((step, index) => <li key={`${step.label}-${index}`}>{index + 1}. {step.label} — {step.method} {step.path} → {step.status ?? "no status"}{step.decision ? ` · ${step.decision}` : ""}{step.reason ? ` · ${step.reason}` : ""}</li>)}
                  </ol>
                ) : (
                  <ul className="mt-2 space-y-1 font-mono text-[10px] text-cos-muted">{scenario.endpoints.map((endpoint, index) => <li key={`${endpoint}-${index}`}>{endpoint}</li>)}</ul>
                )}
              </details>
            </article>
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[10px] text-cos-steel">x402 payment-authorization rehearsal is omitted: the existing X402Sandbox component calls a route (/api/m2m/execute) that this frontend does not serve and uses browser-side simulated balances.</p>
    </section>
  );
}
