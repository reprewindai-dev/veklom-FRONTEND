"use client";


import { useState, useEffect, useRef } from "react";
import { initialStreamState, connectStream, shouldAcceptEvent, isHeartbeatExpired, StreamMachineState } from "@/lib/covenant/machines/streamMachine";
import { reduceRunState, RunState } from "@/lib/covenant/machines/runMachine";
import type { SseEvent } from "@/lib/covenant/generated/sse";
import { api, apiUrl } from "@/lib/api";

import { useApi } from "@/hooks/useApi";
import {
  PanelCard,
  StatusBadge,
  MetricCard,
  ActionRow,
  TimelineEvent,
  LaunchpadCard
} from "@/components/terminal/components/DashboardComponents";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────────────────

interface HealthData {
  status: string;
  score?: number;
  version?: string;
  service?: string;
  timestamp?: string;
  components?: Record<string, { status: string; latency?: string }>;
}

interface UsageData {
  total_requests?: number;
  total_tokens?: number;
  total_cost_usd?: number;
  period?: string;
  active_pipelines?: number;
  active_deployments?: number;
  proof_count?: number;
}

interface AuditData {
  events?: Array<{
    id: string;
    event_type: string;
    created_at: string;
    summary?: string;
    severity?: string;
  }>;
  logs?: Array<{
    id: string;
    action?: string;
    created_at: string;
    resource?: string;
    status?: string;
  }>;
  total?: number;
}

interface ProbeResult<T = unknown> {
  ok: boolean;
  status: number | null;
  route: string;
  latency_ms: number;
  data?: T;
  error?: string;
}

interface BackendSourceState {
  id: "byos" | "cappo";
  label: string;
  repo: string;
  role: string;
  base_url: string;
  health: ProbeResult;
  overview: ProbeResult;
  source_of_truth?: ProbeResult;
  proof_signal: string;
  state: "healthy" | "degraded" | "needs_proof";
}

interface CanonicalBackendsData {
  generated_at: string;
  canonical_source_count: number;
  healthy_source_count: number;
  degraded_source_count: number;
  state: "healthy" | "degraded" | "needs_proof";
  usage: UsageData;
  sources: BackendSourceState[];
}

interface WorkspaceData {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  genome_hash?: string;
  ledger_root?: string;
  created_at?: string;
}

interface CapiExecutionStart {
  run_id: string;
  stream_token?: string;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ControlNodePage() {

  const [streamState, setStreamState] = useState<StreamMachineState>(initialStreamState());
  const [runState, setRunState] = useState<RunState>("not_started");
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  function handleEvent(evt: SseEvent, generation: number) {
    setStreamState(prev => {
      if (!shouldAcceptEvent(prev, generation, evt)) return prev;
      return {
        ...prev,
        connection: evt.event === "run.done" ? "completed" : "connected",
        lastSequence: evt.sequence,
        lastEventId: evt.event_id,
        heartbeatAt: Date.now(),
        error: undefined,
      };
    });

    setRunState(prev => reduceRunState(prev, evt));
  }

  async function testRun() {
    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const ac = new AbortController();
      abortControllerRef.current = ac;

      setStreamState(prev => ({ ...prev, connection: "connecting", generation: prev.generation + 1, lastSequence: -1 }));
      setRunState("not_started");

      const res = await api.post<CapiExecutionStart>("/api/v1/capi/execute", {
        workspace_id: workspace.data?.id || "default",
        agent_id: "agent-test",
        pgl_id: "user-test",
        target_protocol: "test",
        action: "ping",
        payload: {}
      });

      const { run_id, stream_token } = res;
      setLastRunId(run_id);
      if (!stream_token) {
        setRunState("succeeded");
        setStreamState(prev => ({ ...prev, connection: "completed" }));
        return;
      }
      const streamUrl = apiUrl(`/api/v1/capi/stream/${run_id}`);

      setStreamState(prev => ({ ...prev, connection: "connected" }));

      await connectStream({
        url: streamUrl,
        token: stream_token,
        generation: streamState.generation + 1,
        onEvent: handleEvent,
        onProtocolError: (detail) => {
          setStreamState(prev => ({ ...prev, error: detail, connection: "failed" }));
        },
        signal: ac.signal
      });
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setStreamState(prev => ({ ...prev, error: err.message, connection: err.message === "AUTH_FORBIDDEN" ? "failed_authz" : "failed" }));
    }
  }

  // Periodic heartbeat check
  useEffect(() => {
    const timer = setInterval(() => {
      setStreamState(prev => {
        if (prev.connection === "connected" && isHeartbeatExpired(prev)) {
          return { ...prev, connection: "stale" };
        }
        return prev;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const audit = useApi<AuditData>("/api/v1/workspace/audit/logs?limit=5");
  const workspace = useApi<WorkspaceData>("/api/v1/workspace");
  const canonical = useApi<CanonicalBackendsData>("/api/control-node/canonical-backends", {
    refreshInterval: 15000,
  });

  const usageSummary: UsageData = canonical.data?.usage ?? {};
  const systemOperational = canonical.data?.state === "healthy";
  const isWorkspaceReady = !!workspace.data?.id;
  const proofCount = canonical.data?.usage.proof_count ?? 0;
  const expectedProofCount = canonical.data?.canonical_source_count ?? 2;
  const canonicalSources = canonical.data?.sources ?? [];
  const byosSource = canonicalSources.find((source) => source.id === "byos");
  const capiSource = canonicalSources.find((source) => source.id === "cappo");
  const byosHealthy = byosSource?.state === "healthy";
  const capiHealthy = capiSource?.state === "healthy";
  const auditRows = audit.data?.events?.map((ev) => ({
    id: ev.id,
    title: ev.event_type,
    time: ev.created_at,
    detail: ev.summary || "System event recorded.",
    isAlert: ev.severity === "critical" || ev.severity === "high",
  })) || audit.data?.logs?.map((log) => ({
    id: log.id,
    title: log.action || "audit.log",
    time: log.created_at,
    detail: log.resource || log.status || "Workspace audit log recorded.",
    isAlert: log.status === "error",
  })) || [];

  // Determine overall readiness verdict
  let verdictTitle = "Ready for governed production";
  let verdictSubtitle = "System healthy, identity synced, spend within budget.";
  let verdictState: 'healthy' | 'warning' | 'critical' | 'neutral' = 'healthy';

  if (canonical.data?.state === "needs_proof" && !canonical.isLoading) {
    verdictTitle = "Canonical backends need proof";
    verdictSubtitle = "veklom BYOS backend and interlink-cAPI/Covenant are unreachable or returned no operational proof.";
    verdictState = 'critical';
  } else if (!systemOperational && !canonical.isLoading) {
    verdictTitle = "Production readiness degraded";
    verdictSubtitle = "One or more canonical backend source checks failed. Governed runs may degrade.";
    verdictState = 'critical';
  } else if (canonical.data?.state === "degraded") {
    verdictTitle = "Ready with canonical backend warnings";
    verdictSubtitle = `${proofCount}/${expectedProofCount} canonical backends returned proof. Review source-of-truth status.`;
    verdictState = 'warning';
  } else if (!isWorkspaceReady && !workspace.isLoading) {
    verdictTitle = "Action required for production";
    verdictSubtitle = "Workspace identity missing. Governed runs blocked.";
    verdictState = 'critical';
  } else if (auditRows.some((e) => e.isAlert)) {
    verdictTitle = "Ready with warnings";
    verdictSubtitle = "High-priority audit events require review.";
    verdictState = 'warning';
  } else if (workspace.isLoading || canonical.isLoading) {
    verdictTitle = "Assessing readiness...";
    verdictSubtitle = "Syncing with veklom BYOS backend and interlink-cAPI/Covenant.";
    verdictState = 'neutral';
  }

  const fmt = (n: number | undefined) =>
    n === undefined ? "—" : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
  const spendToday = usageSummary.total_cost_usd;
  const hasSpendToday = typeof spendToday === "number" && Number.isFinite(spendToday);
  const proofLabel = (ok: boolean | undefined, loading: boolean) =>
    loading ? "SYNCING" : ok ? "OBSERVED" : "NEEDS PROOF";
  const auditTrace = audit.isLoading ? "SYNCING" : auditRows.length > 0 ? "ACTIVE" : "NEEDS PROOF";
  const evidenceSync = canonical.isLoading ? "SYNCING" : `${proofCount}/${expectedProofCount} SOURCES`;
  const nodeProtection = systemOperational && isWorkspaceReady ? "PROOF SOURCES VERIFIED" : "NEEDS PROOF";

  return (
    <div className="relative p-6 md:p-10 h-full overflow-y-auto bg-[#030303] selection:bg-[#00E5FF]/30 text-white scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

      {/* Grid overlay — terminal aesthetic */}
      <div className="fixed inset-0 grid-overlay pointer-events-none opacity-60"></div>

      {/* Ambient background glow */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vh] bg-[#00E5FF]/5 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[50vw] h-[50vh] bg-[#00E5FF]/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto">

        {/* 1. Assurance Header */}
        <div className="flex flex-col gap-3 mb-10 pb-8 relative">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#00E5FF]/50 via-[#00E5FF]/10 to-transparent"></div>

          <div className="flex items-center gap-4">
            <StatusBadge state={verdictState} text={verdictTitle.toUpperCase()} />
            <div className="h-4 w-[1px] bg-white/10"></div>
            <span className="text-white/30 text-[11px] font-mono tracking-[0.2em] uppercase">Veklom Control Node</span>
          </div>

          <h1 className="text-white/95 text-3xl font-sans tracking-tight mt-2 font-light">{verdictTitle}</h1>
          <p className="text-[#00E5FF]/70 text-sm font-sans tracking-wide">{verdictSubtitle}</p>

          <div className="flex flex-wrap items-center gap-8 mt-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#00E5FF]/40 font-mono">Environment</span>
              <span className="text-white/90 text-xs font-medium tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full shadow-[0_0_8px_#00E5FF]"></span>
                Production
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#00E5FF]/40 font-mono">Canonical Backends</span>
              <span className="text-white/90 text-xs font-medium tracking-wide">
                {canonical.isLoading ? "Syncing" : `${proofCount}/${expectedProofCount} Proof Sources`}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#00E5FF]/40 font-mono">Policy Mode</span>
              <span className="text-white/90 text-xs font-medium tracking-wide">Zero-Trust Active</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-[#00E5FF]/40 font-mono">Last Sync</span>
              <span className="text-[#00E5FF]/80 text-xs font-mono tracking-wider bg-[#00E5FF]/5 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                {canonical.data?.generated_at ? new Date(canonical.data.generated_at).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 pb-12">

          {/* 2. Primary Action Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ActionRow
              type="do_now"
              title={isWorkspaceReady ? "Workspace identity verified" : "Complete workspace identity"}
              subtitle={isWorkspaceReady ? `Workspace ${workspace.data?.id} returned by live BYOS route.` : "Identity graph unavailable from live workspace route."}
              actionText={isWorkspaceReady ? "View PGL" : "Finish Setup"}
            />
            <ActionRow
              type="review"
              title="Review cAPI proof source"
              subtitle={capiSource ? `${capiSource.label}: ${capiSource.state.replace("_", " ")}` : "interlink-cAPI source probe pending."}
              actionText="View cAPI"
            />
            <ActionRow
              type="open"
              title="Open Runtime Enforcement"
              subtitle={capiHealthy ? "Covenant runtime proof is returning from cAPI." : "Runtime enforcement needs cAPI proof."}
              actionText="Go to Queue"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-4">

            <div className="xl:col-span-2 flex flex-col gap-6">
              {/* 3. Live Readiness Metrics */}
              <PanelCard title="LIVE READINESS METRICS" className="min-h-[240px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <MetricCard
                    label="System Health"
                    value={canonical.isLoading ? "..." : (systemOperational ? "100%" : "Needs Proof")}
                    subtext={canonical.isLoading ? "Probing..." : (systemOperational ? "Canonical" : "Degraded")}
                  />
                  <MetricCard
                    label="Backend Proof"
                    value={`${proofCount}/${expectedProofCount}`}
                    subtext={canonical.data?.state || "probing"}
                  />
                  <MetricCard
                    label="Total Requests"
                    value={fmt(usageSummary.total_requests)}
                  />

                  <MetricCard
                    label="Stream State"
                    value={streamState.connection === "idle" ? "Needs Proof" : streamState.connection}
                    subtext={streamState.error || runState}
                  />

                  <button onClick={testRun} className="col-span-1 border border-[#00E5FF]/30 bg-[#00E5FF]/5 rounded-lg p-3 text-[10px] text-[#00E5FF] hover:bg-[#00E5FF]/15 hover:text-white transition-all duration-300 font-mono tracking-widest uppercase flex flex-col items-center justify-center gap-2 group hover:shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                    <span className="w-4 h-4 rounded-full border border-[#00E5FF]/50 flex items-center justify-center group-hover:bg-[#00E5FF]/20 transition-colors">
                      <span className="w-1.5 h-1.5 bg-[#00E5FF] rounded-full group-hover:animate-ping"></span>
                    </span>
                    TEST CAPI EXEC
                  </button>

                  <MetricCard
                    label="Spend Today"
                    value={hasSpendToday ? `$${spendToday.toFixed(4)}` : "Needs Proof"}
                    subtext={!hasSpendToday ? "Awaiting billing signal" : undefined}
                    empty={!hasSpendToday}
                  />
                </div>
              </PanelCard>

              {/* 4. Control Posture & 7. Proof & Paper Trail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PanelCard title="CONTROL POSTURE">
                  <div className="space-y-4 text-[11px] font-mono">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Policy Engine</span>
                      <span className={capiHealthy ? "text-[#00FF66] font-bold tracking-wider text-glow-emerald" : "text-[#FFAB00] font-bold tracking-wider"}>{proofLabel(capiHealthy, canonical.isLoading)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Approval Mode</span>
                      <span className="text-white/90 tracking-wider">{capiHealthy ? "COVENANT POLICY" : "NEEDS PROOF"}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Budget Guard</span>
                      <span className={hasSpendToday ? "text-[#00FF66] font-bold tracking-wider text-glow-emerald" : "text-[#FFAB00] font-bold tracking-wider"}>{hasSpendToday ? "OBSERVED" : "NEEDS PROOF"}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Circuit Breaker</span>
                      <span className={byosHealthy && capiHealthy ? "text-[#00FF66] font-bold tracking-wider text-glow-emerald" : "text-[#FFAB00] font-bold tracking-wider"}>{byosHealthy && capiHealthy ? "OBSERVED" : "NEEDS PROOF"}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">VNP Staking</span>
                      <span className="text-[#FFAB00] font-bold tracking-wider">NEEDS PROOF</span>
                    </div>
                    <div className={`pt-2 mt-4 bg-gradient-to-r ${nodeProtection === "PROOF SOURCES VERIFIED" ? "from-[#00FF66]/10 border-[#00FF66] text-[#00FF66]" : "from-[#FFAB00]/10 border-[#FFAB00] text-[#FFAB00]"} to-transparent border-l-2 px-3 py-2 tracking-[0.2em] text-[10px] uppercase shadow-[inset_0_0_20px_rgba(0,255,102,0.05)]`}>
                      {nodeProtection}
                    </div>
                  </div>
                </PanelCard>

                <PanelCard title="PROOF & PAPER TRAIL">
                  <div className="space-y-4 text-[11px] font-mono">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Last Run ID</span>
                      <span className="text-[#00E5FF]/70">{lastRunId || "Needs proof"}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Last Ext. Action</span>
                      <span className="text-[#00E5FF]/70">{runState === "not_started" ? "Needs proof" : runState}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Audit Trace</span>
                      <span className={auditTrace === "ACTIVE" ? "text-[#00FF66] font-bold tracking-wider text-glow-emerald" : "text-[#FFAB00] font-bold tracking-wider"}>{auditTrace}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Replay State</span>
                      <span className="text-white/90 tracking-wider">{capiHealthy ? "CAPI LEDGER" : "NEEDS PROOF"}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <span className="text-white/40 uppercase tracking-widest">Evidence Sync</span>
                      <span className="text-white/90 tracking-wider">{evidenceSync}</span>
                    </div>
                    <button className="w-full mt-4 bg-[#00E5FF]/5 border border-[#00E5FF]/20 text-[#00E5FF]/50 hover:bg-[#00E5FF]/10 hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-all duration-300 rounded px-3 py-2 tracking-[0.1em] text-[10px] uppercase text-center cursor-not-allowed">
                      DOWNLOAD LATEST EVIDENCE
                    </button>
                  </div>
                </PanelCard>
              </div>

              <PanelCard title="CANONICAL BACKEND SOURCES">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {canonicalSources.length > 0 ? canonicalSources.map((source) => {
                    const stateClass = source.state === "healthy"
                      ? "text-[#00FF66] border-[#00FF66]/25 bg-[#00FF66]/5"
                      : source.state === "degraded"
                        ? "text-[#FFAB00] border-[#FFAB00]/25 bg-[#FFAB00]/5"
                        : "text-[#FF003C] border-[#FF003C]/25 bg-[#FF003C]/5";

                    return (
                      <div key={source.id} className="rounded-lg border border-[#00E5FF]/10 bg-black/30 p-4 font-mono">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm text-white/90 font-sans">{source.label}</div>
                            <div className="mt-1 text-[10px] text-white/35">{source.repo}</div>
                          </div>
                          <span className={`rounded border px-2 py-1 text-[9px] uppercase tracking-widest ${stateClass}`}>
                            {source.state.replace("_", " ")}
                          </span>
                        </div>
                        <div className="mt-4 space-y-2 text-[10px] text-white/45">
                          <div className="flex items-center justify-between gap-3">
                            <span>Role</span>
                            <span className="text-white/70 text-right">{source.role}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Health</span>
                            <span className={source.health.ok ? "text-[#00FF66]" : "text-[#FF003C]"}>
                              {source.health.ok ? `${source.health.status} / ${source.health.latency_ms}ms` : source.health.error || "Needs proof"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span>Overview</span>
                            <span className={source.overview.ok ? "text-[#00FF66]" : "text-[#FFAB00]"}>
                              {source.overview.ok ? `${source.overview.status} / ${source.overview.latency_ms}ms` : source.overview.error || "Needs proof"}
                            </span>
                          </div>
                          <div className="border-t border-white/5 pt-2 text-[#00E5FF]/70 leading-relaxed">
                            {source.proof_signal}
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="md:col-span-2 rounded-lg border border-dashed border-[#00E5FF]/15 bg-black/20 p-4 text-[11px] text-white/40 font-mono">
                      Canonical backend probe pending.
                    </div>
                  )}
                </div>
              </PanelCard>
            </div>

            <div className="flex flex-col gap-6">
              {/* 5. Attention Queue */}
              <PanelCard title="ATTENTION QUEUE">
                <div className="space-y-4">

                  {!isWorkspaceReady && !workspace.isLoading && (
                    <div className="p-3 border border-[#FF003C]/30 bg-[#FF003C]/5 rounded-lg backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[#FF003C]/90 font-medium font-sans text-sm tracking-wide">PGL Identity Sync Failed</span>
                        <span className="text-[9px] bg-[#FF003C]/10 text-[#FF003C] border border-[#FF003C]/30 px-1.5 py-0.5 rounded font-mono tracking-widest">BLOCKING</span>
                      </div>
                      <div className="text-[11px] text-white/50 mb-3 font-mono leading-relaxed">Identity graph unavailable for current workspace.</div>
                      <Link href="/onboarding/pgl">
                        <button className="text-[9px] px-3 py-1.5 border border-[#FF003C]/40 bg-[#FF003C]/10 hover:bg-[#FF003C]/20 text-white/90 rounded uppercase tracking-[0.2em] font-mono transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,0,60,0.15)]">RETRY SYNC</button>
                      </Link>
                    </div>
                  )}

                  <div className="p-3 border border-[#FFAB00]/30 bg-[#FFAB00]/5 rounded-lg backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[#FFAB00]/90 font-medium font-sans text-sm tracking-wide">{hasSpendToday ? "Budget Signal Observed" : "Budget Proof Unavailable"}</span>
                      <span className="text-[9px] bg-[#FFAB00]/10 text-[#FFAB00] border border-[#FFAB00]/30 px-1.5 py-0.5 rounded font-mono tracking-widest">{hasSpendToday ? "OBSERVED" : "NEEDS PROOF"}</span>
                    </div>
                    <div className="text-[11px] text-white/50 mb-3 font-mono leading-relaxed">{hasSpendToday ? `Live canonical usage reports $${spendToday.toFixed(4)} spend.` : "No live billing signal returned by BYOS or cAPI canonical probes."}</div>
                    <Link href="/budget">
                      <button className="text-[9px] px-3 py-1.5 border border-[#FFAB00]/40 bg-[#FFAB00]/10 hover:bg-[#FFAB00]/20 text-white/90 rounded uppercase tracking-[0.2em] font-mono transition-all duration-300 hover:shadow-[0_0_10px_rgba(255,171,0,0.15)]">MANAGE BUDGET</button>
                    </Link>
                  </div>

                  <div className="p-4 border border-white/5 bg-[#00E5FF]/5 rounded-lg flex items-center justify-center opacity-70">
                    <div className="text-[#00E5FF]/40 italic text-[11px] font-mono tracking-wide">No further attention items</div>
                  </div>
                </div>
              </PanelCard>

              {/* 6. Recent Changes */}
              <PanelCard title="RECENT CHANGES" className="flex-1">
                <div className="space-y-1">
                  {audit.isLoading && <div className="text-[11px] text-[#00E5FF]/50 font-mono tracking-wider animate-pulse">Scanning events log...</div>}

                  {auditRows.length > 0 ? (
                    auditRows.map((ev, i) => (
                      <TimelineEvent
                        key={ev.id || i}
                        title={ev.title}
                        time={ev.time ? new Date(ev.time).toLocaleTimeString() : ""}
                        detail={ev.detail}
                        isAlert={ev.isAlert}
                      />
                    ))
                  ) : (
                    <TimelineEvent
                      title="Needs proof"
                      time=""
                      detail="Live audit route returned no events for this workspace."
                    />
                  )}
                </div>
              </PanelCard>
            </div>
          </div>

          {/* 8. Domain Launchpads */}
          <div className="mt-6 pt-6 border-t border-white/5 relative">
            <div className="text-[10px] tracking-[0.3em] text-white/50 font-sans mb-4 flex items-center gap-3">
              DOMAIN LAUNCHPADS
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#00E5FF]/20 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Link href="/runtime"><LaunchpadCard title="Runtime Enforcement" status={capiHealthy ? "cAPI proof observed" : "Needs proof"} count={capiHealthy ? 1 : 0} urgency={capiHealthy ? "low" : "normal"} /></Link>
              <Link href="/pipelines"><LaunchpadCard title="Pipelines & GPC" status={usageSummary.active_pipelines !== undefined ? "Live active pipelines" : "Needs proof"} count={usageSummary.active_pipelines ?? 0} urgency="normal" /></Link>
              <Link href="/governance"><LaunchpadCard title="Governance" status={auditRows.length ? "Audit events" : "Needs proof"} count={auditRows.length} urgency={auditRows.some((e) => e.isAlert) ? "high" : "low"} /></Link>
              <Link href="/interlink"><LaunchpadCard title="interlink-cAPI" status={capiHealthy ? "Covenant online" : "Needs proof"} count={proofCount} urgency={capiHealthy ? "low" : "normal"} /></Link>
              <Link href="/nexus"><LaunchpadCard title="Nexus Protocol" status="Needs proof" count={0} urgency="low" /></Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
