"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cloud, Cpu, Database, KeyRound, ListChecks, MapPin, Play, Plug, RefreshCw, Server } from "lucide-react";
import { RunWorkload } from "@/components/cos/RunWorkload";
import { HonestEmpty } from "@/components/cos/SectionPillars";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { SectionShell } from "@/components/cos/SectionShell";
import type { ProofStatus } from "@/lib/cos/capabilities";
import { useSandboxMode } from "@/lib/cos/sandbox";
import { useStageData } from "@/lib/cos/useStageData";

/* Shapes returned by COMPUTLESS (owned-compute fabric). */
interface FabricWorker {
  worker_id: string;
  worker_class: "owned" | "private" | "cloud";
  status: string;
  host: { hostname: string; os: string; cpu_model: string; logical_cpus: number; ram_gb: number; gpus: string[]; machine_id_hash: string };
  runtime: { kind: string; capacity_cpus: number; capacity_mem_gb: number };
  datasets: string[];
  telemetry: { cpu_pct: number | null; mem_used_pct: number | null; running_jobs: string[] };
  last_heartbeat_age_ms: number;
}
interface Candidate { worker_id: string; hostname: string; worker_class: string; eligible: boolean; reasons: string[] }
interface FabricJob {
  job_id: string;
  status: string;
  outcome: { label: string; tone: "ok" | "active" | "warn" | "bad" | "neutral" };
  spec: { workload: string; dataset: string | null; cpus: number; mem_gb: number };
  authority: { mount_id: string };
  placement: { chosen: Candidate | null; candidates: Candidate[]; cloud_used: boolean; summary: string } | null;
  supersedes: string | null;
  result: { result_hash?: string; elapsed_s?: number; cappo_reason?: string; reported_by?: string } | null;
}
interface FabricState {
  at: string;
  environment: "production" | "sandbox";
  policy: { mode: "owned_only" | "owned_first" | "cloud_heavy"; cloud_enabled: boolean };
  capacity: { cpus_total: number; cpus_reserved: number; mem_gb_total: number; mem_gb_reserved: number; gpus: string[] };
  summary: {
    machines_connected: number; machines_available: number; machines_busy: number; machines_offline: number;
    jobs_completed: number; jobs_relocated: number; lost_acks_reconciled: number; stale_attempts_refused: number;
    data_local_runs: number; runs_with_dataset: number; cloud_placements: number;
  };
  workers: FabricWorker[];
  jobs: FabricJob[];
}
interface Enrollment {
  environment: string;
  fabric_url?: string;
  cappo_url?: string;
  requirements?: string[];
  powershell?: string;
  grants_authority: boolean;
  // Customer workspaces get a one-time setup key; the owner fabric returns its join command.
  enrollment_key?: string;
  single_use?: boolean;
  expires_at?: string;
}

const MODE_LABEL: Record<FabricState["policy"]["mode"], string> = {
  owned_only: "Private only",
  owned_first: "My hardware first",
  cloud_heavy: "Cloud first",
};
const TONE: Record<FabricJob["outcome"]["tone"], string> = {
  ok: "text-cos-verified", active: "text-cos-accent", warn: "text-cos-warn", bad: "text-cos-danger", neutral: "text-cos-steel",
};
const ACTIVE = new Set(["dispatched", "running"]);

function Panel({ title, icon: Icon, proof, children }: { title: string; icon: typeof Server; proof: ProofStatus; children: React.ReactNode }) {
  return (
    <article className="min-w-0 rounded-2xl border border-cos-border bg-cos-surface/80 p-5 shadow-cos-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2"><Icon size={15} className="text-cos-accent" /><h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-cos-text">{title}</h2></div>
        <ProofBadge status={proof} />
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex items-baseline justify-between gap-3 py-1 text-sm"><span className="text-cos-muted">{k}</span><span className="text-right font-mono tabular-nums text-cos-text">{v}</span></div>;
}

function Headline({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="min-w-0"><div className="font-mono text-xl tabular-nums text-cos-text">{value}</div><div className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel">{label}</div></div>;
}

/** Placement reasons from COMPUTLESS, rendered as the operator-facing checklist. */
function whyItems(job: FabricJob): { text: string; ok: boolean }[] {
  const chosen = job.placement?.chosen;
  if (!chosen) return [];
  const items: { text: string; ok: boolean }[] = [];
  for (const r of chosen.reasons) {
    const m = r.match(/^(\w+) tier, ([\d.]+) CPU \/ ([\d.]+) GB free$/);
    if (r.startsWith("holds dataset")) {
      items.push({ text: "Dataset already on this machine", ok: true }, { text: "No data transfer required", ok: true });
    } else if (r.startsWith("does not hold dataset")) {
      items.push({ text: "Dataset not on this machine (data would move)", ok: false });
    } else if (m) {
      items.push({ text: `${m[2]} CPU available`, ok: true }, { text: `${m[3]} GB RAM available`, ok: true },
        { text: m[1] === "cloud" ? "Cloud capacity" : "Owned capacity", ok: m[1] !== "cloud" });
    }
  }
  items.push({ text: job.placement?.cloud_used ? "Cloud compute used" : "No cloud compute used", ok: !job.placement?.cloud_used });
  return items;
}

export default function PrivateCloudPage() {
  const sandbox = useSandboxMode();
  const expected = sandbox ? "sandbox" : "production";
  const data = useStageData("computeless");
  const { call, stage } = data;
  const [state, setState] = useState<FabricState | null>(null);
  const [mismatch, setMismatch] = useState<string | null>(null);
  // A signed-in account with no workspace yet: machines connect to a workspace, so it must make one first.
  const [needsWorkspace, setNeedsWorkspace] = useState(false);
  // Private Cloud is in a limited beta and this account is not in it yet.
  const [betaOnly, setBetaOnly] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const endpoint = useCallback(
    (method: string, path: string) => stage.endpoints.find((e) => e.method === method && e.path === path),
    [stage],
  );

  const refresh = useCallback(async () => {
    const ep = endpoint("GET", "/api/fabric/state");
    if (!ep) return;
    const result = await call<FabricState>(ep);
    if (result.record.status === 403 && /WORKSPACE_REQUIRED/.test(result.record.error || "")) {
      setState(null);
      setNeedsWorkspace(true);
      return;
    }
    if (result.record.status === 403 && /PRIVATE_CLOUD_BETA_ONLY/.test(result.record.error || "")) {
      setState(null);
      setBetaOnly(true);
      return;
    }
    const payload = result.data;
    if (!payload || !Array.isArray(payload.workers)) return;
    setNeedsWorkspace(false);
    setBetaOnly(false);
    // Never render one environment's machines under the other environment's label.
    if (payload.environment !== expected) {
      setState(null);
      setMismatch(`The ${expected} view received the ${payload.environment ?? "unlabelled"} fabric; nothing is shown.`);
      return;
    }
    setMismatch(null);
    setState(payload);
  }, [call, endpoint, expected]);

  useEffect(() => {
    setState(null);
    setEnrollment(null);
    setEnrollError(null);
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const setMode = async (mode: FabricState["policy"]["mode"]) => {
    const ep = endpoint("PUT", "/api/fabric/policy");
    if (!ep) return;
    setPolicyError(null);
    const result = await call(ep, { mode });
    if (result.record.observation.kind === "failed") setPolicyError(result.record.error || "Policy change was refused");
    await refresh();
  };

  // A customer gets a one-time setup key for its own workspace. The fabric owner has no
  // customer key route (404) and uses the owner join command instead.
  const loadEnrollment = async () => {
    const keyEp = endpoint("POST", "/api/fabric/enrollment-keys");
    const ownerEp = endpoint("GET", "/api/fabric/enrollment");
    if (!keyEp || !ownerEp) return;
    setEnrollError(null);
    const keyed = await call<Enrollment>(keyEp, {});
    if (keyed.data && typeof keyed.data.enrollment_key === "string") { setEnrollment(keyed.data); return; }
    if (keyed.record.status !== 404) { setEnrollError(keyed.record.error || "Setup key was not returned"); return; }
    const owner = await call<Enrollment>(ownerEp);
    if (owner.data && typeof owner.data.powershell === "string") setEnrollment(owner.data);
    else setEnrollError(owner.record.error || "Join command was not returned");
  };

  const proof = data.stageProof;
  // Each panel carries the proof of the call it renders, not the aggregate of uncalled routes.
  const recordFor = (method: string, path: string) => data.records.find((r) => r.method === method && r.path === path);
  const liveProof = recordFor("GET", "/api/fabric/state")?.proof ?? proof;
  const enrollProof = (recordFor("POST", "/api/fabric/enrollment-keys") ?? recordFor("GET", "/api/fabric/enrollment"))?.proof ?? proof;
  const envLabel = sandbox ? "Sandbox fabric · separate machines and workloads; nothing here touches production" : "Production fabric";

  if (!state && betaOnly) {
    return (
      <SectionShell stage={stage} proof={proof} records={data.records}>
        <div className="xl:col-span-2 rounded-xl border border-dashed border-cos-border bg-cos-bg/45 p-4">
          <h3 className="text-sm text-cos-text">Private Cloud is in a limited beta</h3>
          <p className="mt-2 text-xs leading-5 text-cos-muted">
            Connecting your own machines and running governed workloads on them is open to beta
            accounts only for now, and your account is not one of them yet. Nothing has been set up
            or charged.
          </p>
          <code className="mt-3 block break-all font-mono text-[10px] tabular-nums text-cos-warn">GET /api/fabric/state · 403 PRIVATE_CLOUD_BETA_ONLY</code>
        </div>
      </SectionShell>
    );
  }

  if (!state && needsWorkspace) {
    return (
      <SectionShell stage={stage} proof={proof} records={data.records}>
        <div className="xl:col-span-2 rounded-xl border border-dashed border-cos-border bg-cos-bg/45 p-4">
          <h3 className="text-sm text-cos-text">Create your workspace first</h3>
          <p className="mt-2 text-xs leading-5 text-cos-muted">
            Machines connect to a workspace, and only that workspace can see or use them. Your account
            has no workspace yet. Create one in <Link href="/os/onboarding" className="text-cos-accent underline">onboarding</Link>,
            then come back here to connect a machine.
          </p>
          <code className="mt-3 block break-all font-mono text-[10px] tabular-nums text-cos-warn">GET /api/fabric/state · 403 WORKSPACE_REQUIRED</code>
        </div>
      </SectionShell>
    );
  }

  if (!state) {
    return (
      <SectionShell stage={stage} proof={proof} records={data.records}>
        <div className="xl:col-span-2">
          <HonestEmpty
            title={mismatch ? "Fabric environment mismatch" : `Private Cloud ${expected} state not returned`}
            route="GET /api/fabric/state"
            detail={mismatch ?? `No machine, capacity or workload claim is rendered until the ${expected} COMPUTLESS fabric returns its state.`}
          />
        </div>
      </SectionShell>
    );
  }

  const s = state.summary;
  const c = state.capacity;
  const running = state.jobs.filter((j) => ACTIVE.has(j.status));
  const recentRelocations = state.jobs.filter((j) => j.supersedes).slice(0, 5);
  const datasetsByMachine = new Map<string, Set<string>>();
  for (const w of state.workers) {
    const set = datasetsByMachine.get(w.host.hostname) ?? new Set<string>();
    w.datasets.forEach((d) => set.add(d));
    datasetsByMachine.set(w.host.hostname, set);
  }

  return (
    <SectionShell
      stage={stage}
      proof={proof}
      records={data.records}
      primaryAction={
        <div className="flex flex-col items-start gap-2 md:items-end">
          <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${sandbox ? "text-cos-warn" : "text-cos-steel"}`}>{envLabel}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Placement policy">
            {(["owned_only", "owned_first"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={state.policy.mode === mode}
                onClick={() => void setMode(mode)}
                className={`rounded-full border px-4 py-2 text-xs transition ${state.policy.mode === mode ? "border-cos-accent bg-cos-accent/15 text-cos-text" : "border-cos-border text-cos-steel hover:border-cos-accent/50 hover:text-cos-text"}`}
              >
                {MODE_LABEL[mode]}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="xl:col-span-2">
        <div className="grid grid-cols-2 gap-5 rounded-2xl border border-cos-border bg-cos-surface/80 p-5 shadow-cos-card sm:grid-cols-4 xl:grid-cols-7">
          <Headline label="Machines connected" value={s.machines_connected} />
          <Headline label="Available" value={s.machines_available} />
          <Headline label="CPU cores free" value={(c.cpus_total - c.cpus_reserved).toFixed(1)} />
          <Headline label="GPUs" value={c.gpus.length} />
          <Headline label="Workloads running" value={running.length} />
          <Headline label="Relocated" value={s.jobs_relocated} />
          <Headline label="Cloud usage" value={state.policy.cloud_enabled ? "On" : "Off"} />
        </div>
      </div>

      <div className="grid min-w-0 content-start gap-4">
        <Panel title="Machines" icon={Server} proof={liveProof}>
          <div className="grid gap-3 md:grid-cols-2">
            {state.workers.map((w) => {
              return (
                <div key={w.worker_id} className="min-w-0 rounded-xl border border-cos-border bg-cos-bg/45 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate text-sm font-medium text-cos-text">{w.host.hostname}</h3>
                    <span className={`font-mono text-[10px] uppercase ${w.status === "offline" ? "text-cos-danger" : w.status === "idle" ? "text-cos-verified" : "text-cos-accent"}`}>{w.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-cos-muted">{w.worker_class} · {w.host.os}</p>
                  <p className="mt-2 break-words text-xs text-cos-text">{w.host.cpu_model} · {w.host.logical_cpus} threads · {w.host.ram_gb} GB</p>
                  <p className="mt-1 font-mono text-[10px] text-cos-steel">machine {w.host.machine_id_hash.slice(0, 8)} · usable {w.runtime.capacity_cpus} CPU / {w.runtime.capacity_mem_gb} GB</p>
                  <p className="mt-1 font-mono text-[10px] text-cos-steel">
                    CPU {w.telemetry.cpu_pct == null ? "–" : `${w.telemetry.cpu_pct.toFixed(0)}%`} · mem {w.telemetry.mem_used_pct == null ? "–" : `${w.telemetry.mem_used_pct.toFixed(0)}%`} · heartbeat {(w.last_heartbeat_age_ms / 1000).toFixed(1)}s ago
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.host.gpus.map((g) => <span key={g} className="rounded-full border border-cos-border px-2 py-0.5 text-[10px] text-cos-muted">GPU {g}</span>)}
                    {w.datasets.map((d) => <span key={d} className="rounded-full border border-cos-border px-2 py-0.5 text-[10px] text-cos-muted">data {d}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 content-start gap-4">
        <Panel title="Authority" icon={KeyRound} proof={liveProof}>
          {state.workers.map((w) => {
            const held = running.filter((j) => j.placement?.chosen?.worker_id === w.worker_id);
            return (
              <div key={w.worker_id} className="border-b border-cos-border py-2 last:border-b-0">
                <div className="text-sm text-cos-text">{w.host.hostname}</div>
                {held.length
                  ? held.map((j) => <div key={j.job_id} className="font-mono text-[10px] text-cos-accent">authorized for {j.job_id} · single-use grant {j.authority.mount_id.slice(0, 14)}…</div>)
                  : <div className="font-mono text-[10px] text-cos-steel">connected · no authority</div>}
              </div>
            );
          })}
          <p className="mt-3 text-[11px] leading-5 text-cos-steel">Connecting a machine grants nothing. CAPPO issues one single-use grant per workload, sealed to the chosen machine; it ends when the workload commits or is fenced.</p>
        </Panel>
      </div>

      <div className="min-w-0 xl:col-span-2">
        <Panel title="Workloads" icon={ListChecks} proof={liveProof}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel"><th className="pb-2 pr-3">Workload</th><th className="pb-2 pr-3">Outcome</th><th className="pb-2 pr-3">Ran on</th><th className="pb-2 pr-3">Why Veklom chose this machine</th><th className="pb-2">Result</th></tr></thead>
              <tbody>
                {state.jobs.length === 0 ? (
                  <tr className="border-t border-cos-border"><td colSpan={5} className="py-4 text-xs text-cos-muted">No workloads have been placed on this {expected} fabric yet.</td></tr>
                ) : null}
                {state.jobs.slice(0, 25).map((j) => (
                  <tr key={j.job_id} className="border-t border-cos-border align-top">
                    <td className="py-3 pr-3"><code className="font-mono text-xs text-cos-text">{j.job_id}</code><div className="text-xs text-cos-muted">{j.spec.workload}{j.spec.dataset ? ` · ${j.spec.dataset}` : ""} · {j.spec.cpus} CPU / {j.spec.mem_gb} GB</div></td>
                    <td className={`py-3 pr-3 text-xs ${TONE[j.outcome.tone]}`}>{j.outcome.label}{j.supersedes ? <div className="text-[11px] text-cos-steel">relocated from {j.supersedes}</div> : null}</td>
                    <td className="py-3 pr-3 text-xs text-cos-text">{j.placement?.chosen?.hostname ?? "–"}</td>
                    <td className="py-3 pr-3"><ul className="space-y-0.5 text-xs">{whyItems(j).map((it) => <li key={it.text} className={it.ok ? "text-cos-text" : "text-cos-warn"}>{it.ok ? "✓" : "✕"} {it.text}</li>)}</ul></td>
                    <td className="py-3 text-xs">
                      {j.status === "completed" && j.result?.result_hash
                        ? <><code className="font-mono text-cos-text">{j.result.result_hash.slice(0, 12)}…</code><div className="text-[11px] text-cos-steel">committed via CAPPO · {j.result.elapsed_s}s</div></>
                        : j.result?.reported_by ? <><span className="text-cos-danger">not committed</span><div className="text-[11px] text-cos-steel">{j.result.cappo_reason || "refused by CAPPO"}</div></> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="grid min-w-0 content-start gap-4 md:grid-cols-2 xl:col-span-2 xl:grid-cols-3">
        <Panel title="Capacity" icon={Cpu} proof={liveProof}>
          <Row k="Available / busy / offline" v={`${s.machines_available} / ${s.machines_busy} / ${s.machines_offline}`} />
          <Row k="CPU free / total" v={`${(c.cpus_total - c.cpus_reserved).toFixed(1)} / ${c.cpus_total}`} />
          <Row k="Memory free / total" v={`${(c.mem_gb_total - c.mem_gb_reserved).toFixed(1)} / ${c.mem_gb_total.toFixed(1)} GB`} />
          <Row k="GPUs" v={c.gpus.length} />
          <Row k="Workloads completed" v={s.jobs_completed} />
          <p className="mt-3 text-[11px] leading-5 text-cos-steel">Physical machines are counted once, however many workers each runs.</p>
        </Panel>

        <Panel title="Placement" icon={MapPin} proof={liveProof}>
          <Row k="Policy" v={MODE_LABEL[state.policy.mode]} />
          <Row k="Cloud" v={state.policy.cloud_enabled ? "allowed" : "not allowed"} />
          <p className="mt-3 text-[11px] leading-5 text-cos-steel">Placement runs only after CAPPO has issued the workload&apos;s grant: it chooses where, never whether.</p>
          {policyError ? <p className="mt-2 text-xs text-cos-danger">{policyError}</p> : null}
        </Panel>

        <Panel title="Failover" icon={RefreshCw} proof={liveProof}>
          <Row k="Automatically relocated" v={s.jobs_relocated} />
          <Row k="Lost acks reconciled (no re-run)" v={s.lost_acks_reconciled} />
          <Row k="Stale attempts refused by CAPPO" v={s.stale_attempts_refused} />
          {recentRelocations.length ? (
            <ul className="mt-3 space-y-1 font-mono text-[10px] text-cos-steel">
              {recentRelocations.map((j) => <li key={j.job_id} className="break-all">{j.supersedes} → {j.job_id} ({j.placement?.chosen?.hostname ?? "unplaced"})</li>)}
            </ul>
          ) : null}
        </Panel>

        <Panel title="Data locality" icon={Database} proof={liveProof}>
          <Row k="Ran beside their data" v={`${s.data_local_runs} of ${s.runs_with_dataset}`} />
          {[...datasetsByMachine.entries()].map(([host, ds]) => <Row key={host} k={host} v={[...ds].join(", ") || "no datasets"} />)}
        </Panel>

        <Panel title="Cloud" icon={Cloud} proof={liveProof}>
          <Row k="Cloud compute used" v={s.cloud_placements ? `${s.cloud_placements} placements` : "none"} />
          <Row k="Cloud workers connected" v={state.workers.filter((w) => w.worker_class === "cloud").length} />
          <p className="mt-3 text-[11px] leading-5 text-cos-steel">Private only runs with no hyperscaler dependency. Cloud is never the control plane, authority or evidence store.</p>
        </Panel>

        <Panel title="Connect a machine" icon={Plug} proof={enrollProof}>
          {enrollment ? (
            <div className="space-y-3">
              {enrollment.requirements ? <ul className="space-y-1 text-xs text-cos-muted">{enrollment.requirements.map((r) => <li key={r}>• {r}</li>)}</ul> : null}
              <code className="block break-all rounded-lg border border-cos-border bg-cos-bg/60 p-3 font-mono text-[10px] leading-5 text-cos-text">{enrollment.powershell ?? enrollment.enrollment_key}</code>
              {enrollment.enrollment_key ? (
                <p className="text-[11px] leading-5 text-cos-steel">Your one-time setup key: it connects one machine to your own workspace only, works once, and expires {enrollment.expires_at ? new Date(enrollment.expires_at).toLocaleTimeString() : "soon"}. It is shown only now.</p>
              ) : null}
              <p className="text-[11px] leading-5 text-cos-steel">Run in PowerShell on the machine. It joins the {enrollment.environment} fabric; joining grants no authority.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <button type="button" onClick={() => void loadEnrollment()} className="rounded-lg bg-cos-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg">Connect a machine</button>
              {enrollError ? <p className="text-xs text-cos-danger">{enrollError}</p> : null}
            </div>
          )}
        </Panel>

        {!sandbox ? (
          <Panel title="Run a workload" icon={Play} proof={liveProof}>
            <RunWorkload hasMachines={s.machines_available > 0} />
          </Panel>
        ) : null}
      </div>

    </SectionShell>
  );
}
