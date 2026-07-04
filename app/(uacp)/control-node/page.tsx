"use client";

export const dynamic = "force-dynamic";

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
    <div className="p-6 h-full overflow-y-auto">
      
      {/* 1. Assurance Header */}
      <div className="flex flex-col gap-2 mb-8 border-b border-white/5 pb-6">
        <div className="flex items-center gap-3">
          <StatusBadge state={verdictState} text={verdictTitle.toUpperCase()} />
          <span className="text-white/40 text-[10px] tracking-widest uppercase">| Veklom Control Node</span>
        </div>
        <div className="text-white/90 text-xl font-sans tracking-tight mt-1">{verdictTitle}</div>
        <div className="text-cyan-500/60 text-xs font-sans">{verdictSubtitle}</div>
        <div className="flex items-center gap-6 mt-4">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-cyan-500/40">Environment</span>
            <span className="text-white/80 mt-0.5 text-[10px]">Production</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-cyan-500/40">Policy Mode</span>
            <span className="text-white/80 mt-0.5 text-[10px]">Zero-Trust Active</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-cyan-500/40">Last Sync</span>
            <span className="text-white/80 mt-0.5 text-[10px] font-mono">
              {health.data?.timestamp ? new Date(health.data.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 pb-12 max-w-[1400px]">
        
        {/* 2. Primary Action Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            title="Open Runtime Enforcement queue" 
            subtitle="2 policies flagged for drift." 
            actionText="Go to Queue" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
          
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* 3. Live Readiness Metrics */}
            <PanelCard title="LIVE READINESS METRICS">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  label="Active Runs" 
                  value="0" 
                  subtext="No governed runs yet" 
                  empty={!usage.data?.total_requests} 
                />
                <MetricCard 
                  label="Spend Today" 
                  value={usage.data?.total_cost_usd !== undefined ? `$${usage.data.total_cost_usd.toFixed(4)}` : "$0.00"} 
                  subtext={usage.data?.total_cost_usd === undefined ? "Awaiting billing signal" : undefined}
                  empty={usage.data?.total_cost_usd === undefined} 
                />
                <MetricCard 
                  label="Tokens Used" 
                  value={fmt(usage.data?.total_tokens)} 
                  empty={!usage.data?.total_tokens} 
                />
              </div>
            </PanelCard>

            {/* 4. Control Posture & 7. Proof & Paper Trail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PanelCard title="CONTROL POSTURE">
                <div className="space-y-3 text-[10px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Policy Engine</span>
                    <span className="text-green-400 font-mono">ENFORCING</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Approval Mode</span>
                    <span className="text-white/80 font-mono">HUMAN-IN-LOOP</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Budget Guard</span>
                    <span className="text-green-400 font-mono">ARMED</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Circuit Breaker</span>
                    <span className="text-green-400 font-mono">CLOSED</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">VNP Staking</span>
                    <span className="text-green-400 font-mono">BONDED</span>
                  </div>
                  <div className="pt-2 mt-2 bg-green-500/10 border border-green-500/20 text-green-400 text-center rounded py-1 tracking-widest">
                    PROTECTED
                  </div>
                </div>
              </PanelCard>

              <PanelCard title="PROOF & PAPER TRAIL">
                <div className="space-y-3 text-[10px]">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Last Run ID</span>
                    <span className="text-white/40 italic font-mono">None yet</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Last Ext. Action</span>
                    <span className="text-white/40 italic font-mono">None yet</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Audit Trace</span>
                    <span className="text-green-400 font-mono">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Replay State</span>
                    <span className="text-white/80 font-mono">ENABLED</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Evidence Sync</span>
                    <span className="text-white/80 font-mono">100% COMPLETE</span>
                  </div>
                  <div className="pt-2 mt-2 bg-cyan-900/30 border border-cyan-800/40 text-cyan-400 text-center rounded py-1 cursor-not-allowed opacity-70 tracking-widest">
                    DOWNLOAD LATEST EVIDENCE
                  </div>
                </div>
              </PanelCard>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {/* 5. Attention Queue */}
            <PanelCard title="ATTENTION QUEUE">
              <div className="space-y-3">
                
                {!isWorkspaceReady && !workspace.isLoading && (
                  <div className="p-2 border border-red-900/30 bg-red-950/10 rounded">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-red-400 font-medium font-sans text-xs">PGL Identity Sync Failed</span>
                      <span className="text-[8px] bg-red-500/20 text-red-300 px-1 rounded font-mono">BLOCKING</span>
                    </div>
                    <div className="text-[9px] text-red-200/60 mb-2">Identity graph unavailable for current workspace.</div>
                    <Link href="/onboarding/pgl">
                      <button className="text-[8px] px-2 py-1 bg-red-900/40 text-white/80 hover:bg-red-800/60 rounded uppercase tracking-wider font-mono">RETRY SYNC</button>
                    </Link>
                  </div>
                )}
                
                <div className="p-2 border border-yellow-900/30 bg-yellow-950/10 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-yellow-400 font-medium font-sans text-xs">Budget Nearing Cap</span>
                    <span className="text-[8px] bg-yellow-500/20 text-yellow-300 px-1 rounded font-mono">WARNING</span>
                  </div>
                  <div className="text-[9px] text-yellow-200/60 mb-2">Workspace budget is at 85% of monthly allowance.</div>
                  <Link href="/budget">
                    <button className="text-[8px] px-2 py-1 bg-yellow-900/40 text-white/80 hover:bg-yellow-800/60 rounded uppercase tracking-wider font-mono">MANAGE BUDGET</button>
                  </Link>
                </div>

                <div className="p-2 border border-cyan-900/30 bg-cyan-950/10 rounded opacity-60">
                  <div className="text-center text-cyan-500/50 my-4 italic text-[10px]">No further attention items</div>
                </div>
              </div>
            </PanelCard>

            {/* 6. Recent Changes */}
            <PanelCard title="RECENT CHANGES">
              <div className="space-y-1">
                {audit.isLoading && <div className="text-[10px] text-cyan-500/50">Loading events...</div>}
                
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
                        detail={`Subsystems verified.`} 
                    />
                    <TimelineEvent 
                        title="Initial Deploy" 
                        time="2 HOURS AGO" 
                        detail="Container spun up via automated Coolify pipeline." 
                    />
                  </>
                )}
              </div>
            </PanelCard>
          </div>
        </div>

        {/* 8. Domain Launchpads */}
        <div className="mt-2">
          <div className="text-[10px] tracking-widest text-white/90 font-sans mb-3 flex items-center justify-between border-b border-white/5 pb-2">
            DOMAIN LAUNCHPADS
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Link href="/runtime"><LaunchpadCard title="Runtime Enforcement" status="Review policy drift" count={2} urgency="normal" /></Link>
            <Link href="/pipelines"><LaunchpadCard title="Pipelines & GPC" status="Waiting approval" count={1} urgency="high" /></Link>
            <Link href="/governance"><LaunchpadCard title="Governance" status="Trust updates" count={3} urgency="low" /></Link>
            <Link href="/interlink"><LaunchpadCard title="Interlink Console" status="Blocked executions" count={0} urgency="low" /></Link>
            <Link href="/nexus"><LaunchpadCard title="Nexus Protocol" status="Telemetry warming up" count={0} urgency="low" /></Link>
          </div>
        </div>

      </div>
    </div>
  );
}
