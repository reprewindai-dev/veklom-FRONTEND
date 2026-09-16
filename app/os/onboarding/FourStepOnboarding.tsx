"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, CheckCircle2, Fingerprint, Layers, ShieldCheck } from "lucide-react";
import { Button, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const STEPS = [
  ["Operator Identity", Fingerprint],
  ["Workspace", Layers],
  ["Agent + Genome", Bot],
  ["Live Activation", ShieldCheck],
] as const;

type Workspace = { id: string; name: string; slug: string; tier: string };
type Agent = { agent_id: string; certificate_id: string; name: string; status: string };

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function Field({ label, value, onChange, disabled, placeholder }: {
  label: string; value: string; onChange?: (value: string) => void; disabled?: boolean; placeholder?: string;
}) {
  return <label className="block space-y-2">
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cos-muted">{label}</span>
    <input value={value} disabled={disabled} placeholder={placeholder} onChange={(event) => onChange?.(event.target.value)} className="w-full rounded-xl border border-cos-border bg-cos-bg/60 px-4 py-3 text-sm text-cos-text outline-none focus:border-cos-accent/60 disabled:opacity-70" />
  </label>;
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-full border px-3 py-2 text-xs ${active ? "border-cos-accent/60 bg-cos-accent/10 text-cos-accent" : "border-cos-border text-cos-muted"}`}>{label.replace(/_/g, " ")}</button>;
}

export default function FourStepOnboarding() {
  const router = useRouter();
  const { me, loading: authLoading, error: authError, refresh } = useAuth();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspace, setWorkspace] = useState<Workspace>();
  const [issuedAgent, setIssuedAgent] = useState<Agent>();
  const [environment, setEnvironment] = useState("production");
  const [agent, setAgent] = useState({
    name: "", jurisdiction: "CA", intendedUse: "", riskCategory: "low" as "low" | "medium" | "high",
    modelFamily: "operator-selected", modelVersion: "unbound", architecture: "tool-using-agent",
    tools: ["web_search", "file_access"], permissions: ["read"],
    safetyRules: ["human_approval_required", "audit_logging", "rate_limited"],
  });

  const profileWorkspaceId = typeof me?.workspace_id === "string" ? me.workspace_id : "";
  const operatorName = typeof me?.full_name === "string" ? me.full_name : typeof me?.name === "string" ? me.name : typeof me?.username === "string" ? me.username : "Verified operator";
  const active = String(me?.status || "").toUpperCase() === "ACTIVE";
  const ActiveIcon = STEPS[step][1];

  useEffect(() => {
    setEnvironment(window.localStorage.getItem("veklom.environment") === "sandbox" ? "sandbox" : "production");
  }, []);

  useEffect(() => {
    if (profileWorkspaceId && !workspace) setWorkspace({ id: profileWorkspaceId, name: "Existing workspace", slug: "", tier: "active" });
  }, [profileWorkspaceId, workspace]);

  function toggle(field: "tools" | "permissions" | "safetyRules", value: string) {
    setAgent((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((entry) => entry !== value) : [...current[field], value] }));
  }

  async function next() {
    setBusy(true); setError(undefined);
    try {
      if (step === 0) {
        if (!me || !active) throw new Error("LockerPhycer must confirm an ACTIVE operator before onboarding can continue.");
        setStep(1); return;
      }
      if (step === 1) {
        if (!workspace?.id) {
          if (!workspaceName.trim()) throw new Error("Enter a workspace name.");
          const created = await api<Workspace>("/api/v1/workspace", { body: { name: workspaceName.trim(), slug: slugify(workspaceName) } });
          setWorkspace(created); await refresh();
        }
        setStep(2); return;
      }
      if (step === 2) {
        const workspaceId = workspace?.id || profileWorkspaceId;
        if (!workspaceId) throw new Error("A verified workspace is required before issuing an agent certificate.");
        if (!agent.name.trim() || !agent.intendedUse.trim()) throw new Error("Agent name and intended use are required.");
        if (!agent.tools.length || !agent.permissions.length || !agent.safetyRules.length) throw new Error("Select at least one tool, permission, and safety rail.");
        const created = await api<Agent>("/api/v1/ledger/agents", { body: {
          agent_name: agent.name.trim(), creator: workspaceId, jurisdiction: agent.jurisdiction,
          genome: {
            model_family: agent.modelFamily.trim(), model_version: agent.modelVersion.trim(), architecture: agent.architecture,
            tools: agent.tools, permissions: agent.permissions, safety_rules: agent.safetyRules,
            runtime_config: { authority_owner: "CAPPO", evidence_owner: "GnomLedger" },
            intended_use: agent.intendedUse.trim(), risk_category: agent.riskCategory,
          },
          parent_agent_ids: [],
        } });
        setIssuedAgent(created); setStep(3); return;
      }
      window.localStorage.setItem("veklom.onboarding.completed", "true");
      router.push("/activate");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Onboarding could not continue.");
    } finally { setBusy(false); }
  }

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-cos-bg font-mono text-xs uppercase tracking-[0.22em] text-cos-accent">Verifying LockerPhycer identity…</div>;

  return <main className="min-h-screen bg-cos-bg text-cos-text md:grid md:grid-cols-[minmax(320px,42%)_1fr]">
    <section className="relative overflow-hidden border-b border-cos-border bg-cos-surface2/55 p-8 md:min-h-screen md:border-b-0 md:border-r lg:p-14">
      <div className="pointer-events-none absolute -left-40 top-32 h-96 w-96 rounded-full bg-cos-accent/10 blur-[120px]" />
      <div className="relative flex h-full flex-col">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">Veklom Capability OS</p><h1 className="mt-4 text-4xl font-light tracking-tight lg:text-5xl">Four verified boundaries.<br /><span className="font-semibold">No dummy proof.</span></h1><p className="mt-5 max-w-md text-sm leading-7 text-cos-muted">LockerPhycer owns identity and workspace. GnomLedger owns agent evidence. CAPPO remains the only consequence authority.</p></div>
        <div className="my-10 space-y-2 md:my-auto">{STEPS.map(([label, Icon], index) => <div key={label} className={`flex items-center gap-4 rounded-2xl border px-4 py-3 ${index === step ? "border-cos-accent/40 bg-cos-accent/10" : "border-transparent"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-full border ${index < step ? "border-emerald-400 bg-emerald-400 text-cos-bg" : index === step ? "border-cos-accent text-cos-accent" : "border-cos-border text-cos-muted"}`}>{index < step ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}</span><div><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-cos-muted">Step {index + 1}</p><p className="text-sm">{label}</p></div></div>)}</div>
        <div><div className="h-1 overflow-hidden rounded-full bg-cos-border"><div className="h-full bg-cos-accent transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div><div className="mt-3 flex justify-between font-mono text-[9px] uppercase tracking-[0.18em] text-cos-muted"><span>{environment} selected</span><span>{step + 1} / {STEPS.length}</span></div></div>
      </div>
    </section>
    <section className="flex min-h-screen items-center p-6 lg:p-16"><div className="mx-auto w-full max-w-2xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-cos-accent/30 bg-cos-accent/10 px-3 py-1.5 text-xs text-cos-accent"><ActiveIcon className="h-3.5 w-3.5" />{STEPS[step][0]}</span>
      <h2 className="mt-5 text-3xl font-medium tracking-tight">{["Confirm the authenticated operator", "Bind an owned workspace", "Issue the agent and genome together", "Continue to governed activation"][step]}</h2>
      <p className="mt-2 text-sm leading-6 text-cos-muted">{[
        "Read-only verification of the ACTIVE LockerPhycer identity. Signing in does not widen authority.",
        "The workspace establishes ownership. Policy and consequence authority remain separate.",
        "GnomLedger creates the certificate, genome, and native birth event as one operation.",
        "The existing activation flow mounts through CAPPO, proves a denial, executes an allowed consequence, and inspects persisted PGL evidence.",
      ][step]}</p>
      {(error || authError) && <div className="mt-6"><ErrorBox message={error || authError || "Unable to verify identity"} /></div>}
      <div className="mt-8 rounded-2xl border border-cos-border bg-cos-surface2/45 p-6 shadow-cos-card lg:p-8">
        {step === 0 && <div className="space-y-5"><div className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : "border-red-400/25 bg-red-400/10 text-red-300"}`}><CheckCircle2 className="h-5 w-5" />LockerPhycer status: {String(me?.status || "UNVERIFIED").toUpperCase()}</div><Field label="Operator" value={operatorName} disabled /><Field label="Verified email" value={me?.email || ""} disabled /></div>}
        {step === 1 && (workspace?.id ? <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-5"><p className="font-semibold text-emerald-300">Owned workspace confirmed</p><p className="mt-2 break-all font-mono text-xs text-cos-muted">{workspace.id}</p></div> : <Field label="Workspace name" value={workspaceName} onChange={setWorkspaceName} placeholder="Veklom Lab" />)}
        {step === 2 && <div className="space-y-5"><div className="grid gap-5 sm:grid-cols-2"><Field label="Agent name" value={agent.name} onChange={(name) => setAgent({ ...agent, name })} placeholder="Research Operator" /><label className="space-y-2"><span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cos-muted">Jurisdiction</span><select value={agent.jurisdiction} onChange={(event) => setAgent({ ...agent, jurisdiction: event.target.value })} className="w-full rounded-xl border border-cos-border bg-cos-bg/60 px-4 py-3 text-sm"><option value="CA">Canada</option><option value="US">United States</option><option value="EU">European Union</option><option value="UK">United Kingdom</option></select></label></div><Field label="Intended use" value={agent.intendedUse} onChange={(intendedUse) => setAgent({ ...agent, intendedUse })} placeholder="Governed research and bounded machine operations" /><div className="grid gap-5 sm:grid-cols-2"><Field label="Model family" value={agent.modelFamily} onChange={(modelFamily) => setAgent({ ...agent, modelFamily })} /><Field label="Model version" value={agent.modelVersion} onChange={(modelVersion) => setAgent({ ...agent, modelVersion })} /></div>{(["tools", "permissions", "safetyRules"] as const).map((field) => <div key={field}><p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-cos-muted">{field === "safetyRules" ? "Hard safety rails" : field}</p><div className="flex flex-wrap gap-2">{({ tools: ["web_search", "file_access", "api_calls", "code_execution"], permissions: ["read", "write", "execute", "network"], safetyRules: ["human_approval_required", "audit_logging", "rate_limited", "no_sensitive_data"] }[field]).map((value) => <Toggle key={value} label={value} active={agent[field].includes(value)} onClick={() => toggle(field, value)} />)}</div></div>)}</div>}
        {step === 3 && <div className="space-y-4"><div className="rounded-xl border border-emerald-400/25 bg-emerald-400/10 p-5"><p className="flex items-center gap-3 font-semibold text-emerald-300"><CheckCircle2 className="h-5 w-5" />Onboarding boundaries complete</p><p className="mt-3 break-all font-mono text-xs text-cos-muted">Certificate: {issuedAgent?.certificate_id}</p></div><div className="rounded-xl border border-cos-border bg-cos-bg/50 p-4 text-xs leading-6 text-cos-muted">Sandbox is simulation-only. The M1/P2 seal requires the production runtime path and independently persisted evidence.</div></div>}
        <div className="mt-8 flex items-center justify-between border-t border-cos-border pt-6"><button type="button" disabled={step === 0 || busy} onClick={() => setStep((value) => Math.max(0, value - 1))} className="text-xs text-cos-muted disabled:opacity-0">Back</button><Button onClick={next} loading={busy} disabled={step === 0 && !active} className="gap-2">{step === 3 ? "Open live activation" : "Continue"}<ArrowRight className="h-4 w-4" /></Button></div>
      </div>
    </div></section>
  </main>;
}
