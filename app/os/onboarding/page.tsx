"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Circle, Database, Fingerprint, Layers3, Play, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, ApiError, setTokens } from "@/lib/api";
import { Button, ErrorBox } from "@/components/ui";

const STEPS = [
  { id: "identity", label: "Operator Identity" },
  { id: "workspace", label: "Workspace" },
  { id: "agent", label: "Agent + Genome" },
  { id: "activation", label: "Live Activation" },
] as const;

type Me = {
  id?: string;
  email: string;
  username?: string;
  is_verified?: boolean;
  workspace_id?: string | null;
};

type WorkspaceResponse = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  existing?: boolean;
  access_token?: string;
  refresh_token?: string;
};

type AgentResponse = {
  agent_id: string;
  certificate_id: string;
  name: string;
  status: string;
  trust_score: number;
  risk_tier: string;
};

type LedgerState = {
  status: "Live" | "Degraded" | "Not started";
  result?: unknown;
  error?: string;
};

function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : error instanceof Error ? error.message : "Request failed";
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64);
}

function csvValues(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = true,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block text-xs text-cos-muted">
      {label}
      <input
        className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text outline-none focus:border-cos-accent"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [me, setMe] = useState<Me | null>(null);
  const [identityLoaded, setIdentityLoaded] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [agent, setAgent] = useState<AgentResponse | null>(null);
  const [ledger, setLedger] = useState<LedgerState>({ status: "Not started" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentName, setAgentName] = useState("");
  const [jurisdiction, setJurisdiction] = useState("US");
  const [intendedUse, setIntendedUse] = useState("");
  const [riskCategory, setRiskCategory] = useState("low");
  const [modelFamily, setModelFamily] = useState("");
  const [modelVersion, setModelVersion] = useState("");
  const [architecture, setArchitecture] = useState("");
  const [tools, setTools] = useState("");
  const [permissions, setPermissions] = useState("");
  const [safetyRules, setSafetyRules] = useState("");

  const boundWorkspaceId = workspaceId ?? me?.workspace_id ?? null;
  const completed = useMemo(() => [
    identityLoaded,
    Boolean(boundWorkspaceId),
    Boolean(agent),
    false,
  ], [agent, boundWorkspaceId, identityLoaded]);

  useEffect(() => {
    let active = true;
    api.get<Me>("/api/v1/auth/me")
      .then((value) => {
        if (!active) return;
        setMe({ ...value, workspace_id: value.workspace_id ?? null });
        setWorkspaceId(value.workspace_id ?? null);
        setIdentityLoaded(true);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        if (cause instanceof ApiError && (cause.status === 401 || cause.status === 403)) {
          setAuthRequired(true);
        } else {
          setError(errorMessage(cause));
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function continueStep() {
    setError(null);
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  }

  async function refreshIdentity() {
    const refreshed = await api.get<Me>("/api/v1/auth/me");
    setMe({ ...refreshed, workspace_id: refreshed.workspace_id ?? null });
  }

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await api.post<WorkspaceResponse>("/api/v1/workspace", {
        name: workspaceName,
        slug: workspaceSlug,
      });
      if (response.access_token) setTokens(response.access_token, response.refresh_token ?? null);
      setWorkspaceId(response.id);
      await refreshIdentity();
    } catch (cause: unknown) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function registerAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!boundWorkspaceId || !me) return;
    setBusy(true);
    setError(null);
    setLedger({ status: "Not started" });
    try {
      const response = await api.post<AgentResponse>("/api/pgl/agents/", {
        agent_name: agentName,
        creator: me.email,
        jurisdiction,
        genome: {
          model_family: modelFamily,
          model_version: modelVersion,
          architecture,
          tools: csvValues(tools),
          permissions: csvValues(permissions),
          safety_rules: csvValues(safetyRules),
          runtime_config: { workspace_id: boundWorkspaceId },
          intended_use: intendedUse,
          risk_category: riskCategory,
        },
        parent_agent_ids: [],
      });
      setAgent(response);
      localStorage.setItem("veklom.pgl.agent", JSON.stringify({
        agent_id: response.agent_id,
        certificate_id: response.certificate_id,
        workspace_id: boundWorkspaceId,
      }));
      try {
        const verification = await api.get(`/api/pgl/ledger/agents/${encodeURIComponent(response.agent_id)}/verify`);
        setLedger({ status: "Live", result: verification });
      } catch (cause: unknown) {
        const message = errorMessage(cause);
        setLedger({
          status: cause instanceof ApiError && cause.status === 503 ? "Degraded" : "Not started",
          error: message,
        });
        setError(message);
      }
    } catch (cause: unknown) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  const heading = [
    "Identify the operator",
    "Establish the workspace",
    "Register the agent genome",
    "Activate under real authority",
  ][step];

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-10">
      <aside className="rounded-2xl border border-cos-border bg-cos-surface2/70 p-4">
        <div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cos-accent">
          <Layers3 size={14} /> Onboarding
        </div>
        <nav className="space-y-2" aria-label="Onboarding steps">
          {STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              disabled={index > step}
              onClick={() => setStep(index)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-xs ${index === step ? "bg-cos-accent/10 text-cos-text" : "text-cos-muted"} disabled:cursor-not-allowed`}
            >
              {completed[index] ? <Check size={15} className="shrink-0 text-cos-accent" /> : <Circle size={15} className="shrink-0 text-cos-steel" />}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="min-w-0 rounded-2xl border border-cos-border bg-cos-surface2/70 p-5 shadow-cos-card md:p-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cos-accent">
              {step === 0 ? <Fingerprint size={14} /> : step === 1 ? <Database size={14} /> : step === 2 ? <ShieldCheck size={14} /> : <Play size={14} />}
              Step {step + 1} of {STEPS.length}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-cos-text md:text-3xl">{heading}</h1>
          </div>
          <span className="rounded-full border border-cos-border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-muted">{STEPS[step].label}</span>
        </div>

        {error ? <ErrorBox message={error} className="mb-5" /> : null}

        {step === 0 ? (
          <div className="space-y-5">
            {authRequired ? (
              <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-5 text-sm text-cos-muted">
                <p className="text-cos-text">Sign in required</p>
                <Link className="mt-3 inline-flex text-cos-accent hover:underline" href="/login?next=/os/onboarding">Go to sign in <ArrowRight size={14} className="ml-1" /></Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Operator</div>
                  <div className="mt-2 break-all text-sm text-cos-text">{me?.email ?? me?.username ?? "Loading identity…"}</div>
                </div>
                <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Verification state</div>
                  <div className={`mt-2 text-sm ${me?.is_verified === true ? "text-cos-accent" : "text-cos-muted"}`}>
                    {me?.is_verified === true ? "Verified by LockerPhycer" : "Email not yet verified"}
                  </div>
                </div>
              </div>
            )}
            <Button onClick={continueStep} disabled={!identityLoaded || authRequired}>Continue</Button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            {boundWorkspaceId ? (
              <div className="rounded-xl border border-cos-accent/30 bg-cos-accent/5 p-5 text-sm text-cos-text">Workspace bound: <span className="font-mono">{boundWorkspaceId}</span></div>
            ) : (
              <form onSubmit={createWorkspace} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name" value={workspaceName} onChange={(value) => { setWorkspaceName(value); if (!slugTouched) setWorkspaceSlug(slugify(value)); }} placeholder="Operating workspace" />
                  <Field label="Slug" value={workspaceSlug} onChange={(value) => { setSlugTouched(true); setWorkspaceSlug(slugify(value)); }} placeholder="operating-workspace" />
                </div>
                <Button type="submit" loading={busy} disabled={!workspaceName || !workspaceSlug}>Bind workspace</Button>
              </form>
            )}
            <p className="text-xs leading-6 text-cos-muted">Authentication established who you are. This step binds the session to a workspace. It grants no capability — authority is only issued by CAPPO at mount time.</p>
            <Button onClick={continueStep} disabled={!boundWorkspaceId}>Continue</Button>
          </div>
        ) : null}

        {step === 2 ? (
          <form onSubmit={registerAgent} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Agent name" value={agentName} onChange={setAgentName} />
              <Field label="Jurisdiction" value={jurisdiction} onChange={setJurisdiction} />
              <Field label="Intended use" value={intendedUse} onChange={setIntendedUse} />
              <label className="block text-xs text-cos-muted">Risk category<select value={riskCategory} onChange={(event) => setRiskCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"><option value="low">low</option><option value="medium">medium</option><option value="high">high</option></select></label>
              <Field label="Model family" value={modelFamily} onChange={setModelFamily} />
              <Field label="Model version" value={modelVersion} onChange={setModelVersion} />
              <Field label="Architecture" value={architecture} onChange={setArchitecture} />
              <Field label="Tools (comma-separated)" value={tools} onChange={setTools} required={false} />
              <Field label="Permissions (comma-separated)" value={permissions} onChange={setPermissions} required={false} />
              <Field label="Safety rules (comma-separated)" value={safetyRules} onChange={setSafetyRules} required={false} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" loading={busy} disabled={!boundWorkspaceId || !agentName || !me}>Register agent genome</Button>
              {agent ? <Button type="button" onClick={continueStep} disabled={!agent} variant="outline">Continue</Button> : null}
            </div>
            {agent ? (
              <div className="space-y-4 rounded-xl border border-cos-border bg-cos-bg/40 p-4 text-xs">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><span className="text-cos-steel">Agent ID</span><div className="mt-1 break-all font-mono text-cos-text">{agent.agent_id}</div></div>
                  <div><span className="text-cos-steel">Certificate ID</span><div className="mt-1 break-all font-mono text-cos-text">{agent.certificate_id}</div></div>
                </div>
                <div className="flex items-center justify-between gap-3"><span className="text-cos-steel">Ledger chain verification (returned by GnomLedger)</span><span className={`rounded-full border px-2 py-1 font-mono text-[10px] ${ledger.status === "Live" ? "border-cos-accent/40 text-cos-accent" : "border-cos-warn/40 text-cos-warn"}`}>{ledger.status}</span></div>
                {ledger.error ? <ErrorBox message={ledger.error} /> : null}
                {ledger.result ? <pre className="max-h-72 overflow-auto rounded-lg border border-cos-border bg-cos-bg p-3 font-mono text-[10px] leading-5 text-cos-muted">{JSON.stringify(ledger.result, null, 2)}</pre> : null}
              </div>
            ) : null}
          </form>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-cos-steel">Operator email</div><div className="mt-2 break-all text-sm text-cos-text">{me?.email}</div></div>
              <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-cos-steel">Workspace ID</div><div className="mt-2 break-all font-mono text-sm text-cos-text">{boundWorkspaceId}</div></div>
              <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-cos-steel">Agent ID</div><div className="mt-2 break-all font-mono text-sm text-cos-text">{agent?.agent_id}</div></div>
              <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4"><div className="text-[10px] uppercase tracking-[0.14em] text-cos-steel">Certificate ID</div><div className="mt-2 break-all font-mono text-sm text-cos-text">{agent?.certificate_id}</div></div>
            </div>
            <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-5 text-sm leading-7 text-cos-muted">
              Activation runs the real governed loop:
              <div className="mt-3 font-mono text-xs leading-6 text-cos-text">mount veklom.governed-counter@v1 → counter.reset DENY → counter.increment ALLOW → receipt → terminate → replay DENY</div>
              <p className="mt-4">The workspace field on the mount page must equal the workspace bound in Step 2.</p>
              <p className="mt-3">Sandbox vs production is selected on the mount page (project=sandbox is fixed there).</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => router.push("/os/mount")}>Open mount</Button>
              <Link className="rounded-lg border border-cos-border px-4 py-2 text-sm text-cos-text hover:border-cos-accent" href="/os/evidence">Open evidence</Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
