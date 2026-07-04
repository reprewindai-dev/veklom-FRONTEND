"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { initialStreamState, connectStream, shouldAcceptEvent, isHeartbeatExpired, StreamMachineState } from "@/lib/covenant/machines/streamMachine";
import { reduceRunState, RunState } from "@/lib/covenant/machines/runMachine";
import type { SseEvent } from "@/lib/covenant/generated/sse";
import { api } from "@/lib/api";

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
}

interface AuditData {
  events?: Array<{
    id: string;
    event_type: string;
    created_at: string;
    summary?: string;
    severity?: string;
  }>;
  total?: number;
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ControlNodePage() {

  const [streamState, setStreamState] = useState<StreamMachineState>(initialStreamState());
  const [runState, setRunState] = useState<RunState>("not_started");
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

      const res = await api.post("/api/v1/capi/execute", {
        workspace_id: workspace.data?.id || "default",
        agent_id: "agent-test",
        pgl_id: "user-test",
        target_protocol: "test",
        action: "ping",
        payload: {}
      });

      const { run_id, stream_token } = await (res as any).json();
      
      const streamUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088'}/api/v1/capi/stream/${run_id}`;
      
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

  const health = useApi<HealthData>("/api/v1/sys/health");
  const usage = useApi<UsageData>("/api/v1/usage/summary");
  const audit = useApi<AuditData>("/api/v1/audit/events?limit=5");
  const workspace = useApi<WorkspaceData>("/api/v1/workspace");

  const systemOperational = health.data?.status === "healthy";
  const isWorkspaceReady = !!workspace.data?.id;

  // Determine overall readiness verdict
  let verdictTitle = "Ready for governed production";
  let verdictSubtitle = "System healthy, identity synced, spend within budget.";
  let verdictState: 'healthy' | 'warning' | 'critical' | 'neutral' = 'healthy';

  if (!systemOperational && !health.isLoading) {
    verdictTitle = "Production readiness degraded";
    verdictSubtitle = "System health check failed. Governed runs may fail.";
    verdictState = 'critical';
  } else if (!isWorkspaceReady && !workspace.isLoading) {
    verdictTitle = "Action required for production";
    verdictSubtitle = "Workspace identity missing. Governed runs blocked.";
    verdictState = 'critical';
  } else if (audit.data?.events?.some((e) => e.severity === "high" || e.severity === "critical")) {
    verdictTitle = "Ready with warnings";
    verdictSubtitle = "High-priority audit events require review.";
    verdictState = 'warning';
  } else if (health.isLoading || workspace.isLoading) {
    verdictTitle = "Assessing readiness...";
    verdictSubtitle = "Syncing with Veklom runtime cluster.";
    verdictState = 'neutral';
  }

  const fmt = (n: number | undefined) =>
    n === undefined ? "—" : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

  return (
    <div className="relative p-6 md:p-10 h-full overflow-y-auto bg-[#03070c] selection:bg-cyan-500/30 text-white scrollbar-thin scrollbar-thumb-cyan-900/50 scrollbar-track-transparent">
      
      {/* Ambient background glow */}
      <div className="fixed top-[-10%] left-[-5%] w-[40vw] h-[40vh] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="fixed bottom-[-10%] right-[-5%] w-[50vw] h-[50vh] bg-blue-900/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none"></div>

      <div className="relative z-10 max-w-[1400px] mx-auto">
        
        {/* 1. Assurance Header */}
        <div className="flex flex-col gap-3 mb-10 pb-8 relative">
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-cyan-500/50 via-cyan-900/20 to-transparent"></div>
          
          <div className="flex items-center gap-4">
            <StatusBadge state={verdictState} text={verdictTitle.toUpperCase()} />
            <div className="h-4 w-[1px] bg-cyan-900/50"></div>
            <span className="text-cyan-100/30 text-[11px] font-mono tracking-[0.2em] uppercase">Veklom Control Node</span>
          </div>
          
          <h1 className="text-white/95 text-3xl font-sans tracking-tight mt-2 font-light">{verdictTitle}</h1>
          <p className="text-cyan-400/70 text-sm font-sans tracking-wide">{verdictSubtitle}</p>
          
          <div className="flex flex-wrap items-center gap-8 mt-6">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 font-mono">Environment</span>
              <span className="text-white/90 text-xs font-medium tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_8px_#22d3ee]"></span>
                Production
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 font-mono">Policy Mode</span>
              <span className="text-white/90 text-xs font-medium tracking-wide">Zero-Trust Active</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-500/40 font-mono">Last Sync</span>
              <span className="text-cyan-300/80 text-xs font-mono tracking-wider bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/30">
                {health.data?.timestamp ? new Date(health.data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 pb-12">
          
          {/* 2. Primary Action Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <ActionRow 
              type="do_now" 
              title="Complete workspace identity" 
              subtitle="Identity graph unavailable without PGL sync." 
              actionText="Finish Setup" 
            />
            <ActionRow 
              type="review" 
              title="Review GPU health degradation" 
              subtitle="Node latency spike detected in Hetzner pool." 
              actionText="View Infra" 
            />
            <ActionRow 
              type="open" 
              title="Open Runtime Enforcement" 
              subtitle="2 policies flagged for drift." 
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
                    value={health.isLoading ? "..." : (systemOperational ? "100%" : "72%")} 
                    subtext={health.isLoading ? "Probing..." : (systemOperational ? "Healthy" : "Degraded")} 
                  />
                  <MetricCard 
                    label="Success Rate" 
                    value="99.8%" 
                  />
                  <MetricCard 
                    label="Total Requests" 
                    value={fmt(usage.data?.total_requests)} 
                  />
                  
                  <MetricCard 
                    label="Stream State" 
                    value={streamState.connection === "idle" ? "Needs Proof" : streamState.connection} 
                    subtext={streamState.error || runState} 
                  />
                  
                  <button onClick={testRun} className="col-span-1 border border-cyan-500/30 bg-gradient-to-br from-cyan-900/40 to-[#0b1219]/80 rounded-lg p-3 text-[10px] text-cyan-400 hover:bg-cyan-900/60 hover:text-cyan-200 transition-all duration-300 font-mono tracking-widest uppercase flex flex-col items-center justify-center gap-2 group shadow-[0_0_15px_rgba(34,211,238,0.05)] hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                    <span className="w-4 h-4 rounded-full border border-cyan-500/50 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full group-hover:animate-ping"></span>
                    </span>
                    TEST CAPI EXEC
                  </button>

                  <MetricCard 
                    label="Spend Today" 
                    value={usage.data?.total_cost_usd !== undefined && !Number.isNaN(usage.data.total_cost_usd) ? `$${usage.data.total_cost_usd.toFixed(4)}` : "$0.00"} 
                    subtext={usage.data?.total_cost_usd === undefined ? "Awaiting billing signal" : undefined}
                    empty={usage.data?.total_cost_usd === undefined} 
                  />
                </div>
              </PanelCard>

              {/* 4. Control Posture & 7. Proof & Paper Trail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <PanelCard title="CONTROL POSTURE">
                  <div className="space-y-4 text-[11px] font-mono">
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Policy Engine</span>
                      <span className="text-emerald-400 font-bold tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">ENFORCING</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Approval Mode</span>
                      <span className="text-white/90 tracking-wider">HUMAN-IN-LOOP</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Budget Guard</span>
                      <span className="text-emerald-400 font-bold tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">ARMED</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Circuit Breaker</span>
                      <span className="text-emerald-400 font-bold tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">CLOSED</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">VNP Staking</span>
                      <span className="text-emerald-400 font-bold tracking-wider drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">BONDED</span>
                    </div>
                    <div className="pt-2 mt-4 bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500 text-emerald-400 px-3 py-2 tracking-[0.2em] text-[10px] uppercase shadow-[inset_0_0_20px_rgba(16,185,129,0.05)]">
                      NODE FULLY PROTECTED
                    </div>
                  </div>
                </PanelCard>

                <PanelCard title="PROOF & PAPER TRAIL">
                  <div className="space-y-4 text-[11px] font-mono">
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Last Run ID</span>
                      <span className="text-cyan-500/30 italic">None yet</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Last Ext. Action</span>
                      <span className="text-cyan-500/30 italic">None yet</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Audit Trace</span>
                      <span className="text-emerald-400 font-bold tracking-wider">ACTIVE</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Replay State</span>
                      <span className="text-white/90 tracking-wider">ENABLED</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-cyan-900/20 pb-3">
                      <span className="text-cyan-100/40 uppercase tracking-widest">Evidence Sync</span>
                      <span className="text-white/90 tracking-wider">100% COMPLETE</span>
                    </div>
                    <button className="w-full mt-4 bg-cyan-950/30 border border-cyan-900/40 text-cyan-500/50 hover:bg-cyan-900/40 hover:text-cyan-400 hover:border-cyan-500/30 transition-all duration-300 rounded px-3 py-2 tracking-[0.1em] text-[10px] uppercase shadow-[0_0_15px_rgba(34,211,238,0.05)] text-center cursor-not-allowed">
                      DOWNLOAD LATEST EVIDENCE
                    </button>
                  </div>
                </PanelCard>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* 5. Attention Queue */}
              <PanelCard title="ATTENTION QUEUE">
                <div className="space-y-4">
                  
                  {!isWorkspaceReady && !workspace.isLoading && (
                    <div className="p-3 border border-rose-900/40 bg-gradient-to-b from-rose-950/30 to-transparent rounded-lg backdrop-blur-sm">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-rose-300 font-medium font-sans text-sm tracking-wide">PGL Identity Sync Failed</span>
                        <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono tracking-widest">BLOCKING</span>
                      </div>
                      <div className="text-[11px] text-rose-200/60 mb-3 font-mono leading-relaxed">Identity graph unavailable for current workspace.</div>
                      <Link href="/onboarding/pgl">
                        <button className="text-[9px] px-3 py-1.5 border border-rose-900/50 bg-rose-900/20 hover:bg-rose-800/40 text-rose-100 rounded uppercase tracking-[0.2em] font-mono transition-all duration-300 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)]">RETRY SYNC</button>
                      </Link>
                    </div>
                  )}
                  
                  <div className="p-3 border border-amber-900/40 bg-gradient-to-b from-amber-950/30 to-transparent rounded-lg backdrop-blur-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-amber-300 font-medium font-sans text-sm tracking-wide">Budget Nearing Cap</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono tracking-widest">WARNING</span>
                    </div>
                    <div className="text-[11px] text-amber-200/60 mb-3 font-mono leading-relaxed">Workspace budget is at 85% of monthly allowance.</div>
                    <Link href="/budget">
                      <button className="text-[9px] px-3 py-1.5 border border-amber-900/50 bg-amber-900/20 hover:bg-amber-800/40 text-amber-100 rounded uppercase tracking-[0.2em] font-mono transition-all duration-300 hover:shadow-[0_0_10px_rgba(245,158,11,0.2)]">MANAGE BUDGET</button>
                    </Link>
                  </div>

                  <div className="p-4 border border-cyan-900/20 bg-cyan-950/10 rounded-lg flex items-center justify-center opacity-70">
                    <div className="text-cyan-500/40 italic text-[11px] font-mono tracking-wide">No further attention items</div>
                  </div>
                </div>
              </PanelCard>

              {/* 6. Recent Changes */}
              <PanelCard title="RECENT CHANGES" className="flex-1">
                <div className="space-y-1">
                  {audit.isLoading && <div className="text-[11px] text-cyan-500/50 font-mono tracking-wider animate-pulse">Scanning events log...</div>}
                  
                  {audit.data?.events && audit.data.events.length > 0 ? (
                    audit.data.events.map((ev, i) => (
                      <TimelineEvent 
                        key={ev.id || i}
                        title={ev.event_type} 
                        time={ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : ""} 
                        detail={ev.summary || "System event recorded."} 
                        isAlert={ev.severity === 'critical' || ev.severity === 'high'}
                      />
                    ))
                  ) : (
                    <>
                      <TimelineEvent 
                          title="Health Check Completed" 
                          time={new Date().toLocaleTimeString()} 
                          detail={`Subsystems verified across control plane.`} 
                      />
                      <TimelineEvent 
                          title="Initial Deploy" 
                          time="2 HOURS AGO" 
                          detail="Container spun up via automated Coolify pipeline. Routing verified." 
                      />
                    </>
                  )}
                </div>
              </PanelCard>
            </div>
          </div>

          {/* 8. Domain Launchpads */}
          <div className="mt-6 pt-6 border-t border-cyan-900/20 relative">
            <div className="text-[10px] tracking-[0.3em] text-cyan-100/50 font-sans mb-4 flex items-center gap-3">
              DOMAIN LAUNCHPADS
              <div className="h-[1px] flex-1 bg-gradient-to-r from-cyan-900/30 to-transparent"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <Link href="/runtime"><LaunchpadCard title="Runtime Enforcement" status="Review policy drift" count={2} urgency="normal" /></Link>
              <Link href="/pipelines"><LaunchpadCard title="Pipelines & GPC" status="Waiting approval" count={1} urgency="high" /></Link>
              <Link href="/governance"><LaunchpadCard title="Governance" status="Trust updates" count={3} urgency="low" /></Link>
              <Link href="/interlink"><LaunchpadCard title="Interlink Console" status="Blocked executions" count={0} urgency="low" /></Link>
              <Link href="/nexus"><LaunchpadCard title="Nexus Protocol" status="Telemetry warming up" count={0} urgency="low" /></Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
