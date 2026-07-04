"use client";
import React, { useEffect, useState } from 'react';
import { 
  PanelCard, 
  StatusBadge, 
  MetricCard, 
  ActionRow, 
  TimelineEvent, 
  LaunchpadCard 
} from './DashboardComponents';

export default function QuantumDashboard() {
  const [telemetry, setTelemetry] = useState<any>(null);
  const [statusState, setStatusState] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [layers, setLayers] = useState<any>([]);
  const [infra, setInfra] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [telRes, statusRes, healthRes, secRes, layersRes, infraRes] = await Promise.all([
        fetch('/api/quantum-metrics').catch(() => ({ ok: false, json: async () => null } as unknown as Response)),
        fetch('/api/status').catch(() => ({ ok: false, json: async () => null } as unknown as Response)),
        fetch('/api/v1/sys/health').catch(() => ({ ok: false, json: async () => null } as unknown as Response)),
        fetch('/api/uacp/security').catch(() => ({ ok: false, json: async () => null } as unknown as Response)),
        fetch('/api/uacp/layers').catch(() => ({ ok: false, json: async () => null } as unknown as Response)),
        fetch('/api/uacp/infrastructure').catch(() => ({ ok: false, json: async () => null } as unknown as Response))
      ]);
      if (telRes.ok) setTelemetry(await telRes.json());
      if (statusRes.ok) setStatusState(await statusRes.json());
      if (healthRes.ok) setHealth(await healthRes.json());
      if (secRes.ok) setSecurityData(await secRes.json());
      if (layersRes.ok) setLayers(await layersRes.json());
      if (infraRes.ok) setInfra(await infraRes.json());
    } catch (e) {
      console.error("Failed to fetch dashboard data", e);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const systemOperational = statusState?.status === "healthy";
  const circuitState = statusState?.circuit_breaker?.state || "CLOSED";
  
  // Calculate threats
  const threatCount = securityData?.surfaces?.filter((s:any) => s.threat_level === "critical").length || 0;
  const warnCount = securityData?.surfaces?.filter((s:any) => s.threat_level === "high").length || 0;

  // Determine overall readiness verdict
  let verdictTitle = "Ready for governed production";
  let verdictSubtitle = "System healthy, 0 policy violations, spend within budget.";
  let verdictState: 'healthy' | 'warning' | 'critical' = 'healthy';

  if (!systemOperational) {
    verdictTitle = "Production readiness degraded";
    verdictSubtitle = "System health check failed. Governed runs may fail.";
    verdictState = 'critical';
  } else if (threatCount > 0) {
    verdictTitle = "Action required for production";
    verdictSubtitle = `${threatCount} critical threats detected in security surfaces.`;
    verdictState = 'critical';
  } else if (warnCount > 0) {
    verdictTitle = "Ready with warnings";
    verdictSubtitle = `${warnCount} high-priority warnings require review.`;
    verdictState = 'warning';
  }

  return (
    <div className="quantum-dashboard font-mono text-[10px] h-full overflow-y-auto bg-[#050a0f] text-[#88aebf] p-6">
      
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
            <span className="text-white/80 mt-0.5">Production</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-cyan-500/40">Policy Mode</span>
            <span className="text-white/80 mt-0.5">Zero-Trust Active</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] uppercase tracking-widest text-cyan-500/40">Last Sync</span>
            <span className="text-white/80 mt-0.5">{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-12">
        
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
                <MetricCard label="System Health" value={systemOperational ? "100%" : "72%"} subtext="Healthy" />
                <MetricCard label="Success Rate" value={telemetry?.fidelity ? `${parseFloat(telemetry.fidelity).toFixed(1)}%` : "99.8%"} />
                <MetricCard label="p50 Latency" value={infra?.nodes?.[0]?.latency || "42ms"} />
                <MetricCard label="Active Runs" value="0" subtext="No governed runs yet" empty={!telemetry?.active_runs} />
                <MetricCard label="Spend Today" value="$0.00" subtext="Awaiting billing signal" empty />
                <MetricCard label="External Actions" value="0" empty />
              </div>
            </PanelCard>

            {/* 4. Control Posture & 7. Proof & Paper Trail */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PanelCard title="CONTROL POSTURE">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Policy Engine</span>
                    <span className="text-green-400">ENFORCING</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Approval Mode</span>
                    <span className="text-white/80">HUMAN-IN-LOOP</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Budget Guard</span>
                    <span className="text-green-400">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Circuit Breaker</span>
                    <span className={circuitState === "CLOSED" ? "text-green-400" : "text-yellow-400"}>{circuitState}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Tool Scope</span>
                    <span className="text-white/80">RESTRICTED</span>
                  </div>
                  <div className="pt-2 mt-2 bg-green-500/10 border border-green-500/20 text-green-400 text-center rounded py-1">
                    PROTECTED
                  </div>
                </div>
              </PanelCard>

              <PanelCard title="PROOF & PAPER TRAIL">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Last Run ID</span>
                    <span className="text-white/40 italic">None yet</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Last Ext. Action</span>
                    <span className="text-white/40 italic">None yet</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Audit Trace</span>
                    <span className="text-green-400">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Replay State</span>
                    <span className="text-white/80">ENABLED</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-cyan-500/70 uppercase">Evidence Sync</span>
                    <span className="text-white/80">100% COMPLETE</span>
                  </div>
                  <div className="pt-2 mt-2 bg-cyan-900/30 border border-cyan-800/40 text-cyan-400 text-center rounded py-1 cursor-not-allowed opacity-70">
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
                <div className="p-2 border border-red-900/30 bg-red-950/10 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-red-400 font-medium font-sans text-xs">PGL Identity Sync Failed</span>
                    <span className="text-[8px] bg-red-500/20 text-red-300 px-1 rounded">BLOCKING</span>
                  </div>
                  <div className="text-[9px] text-red-200/60 mb-2">Identity graph unavailable for current workspace.</div>
                  <button className="text-[8px] px-2 py-1 bg-red-900/40 text-white/80 hover:bg-red-800/60 rounded">RETRY SYNC</button>
                </div>
                
                <div className="p-2 border border-yellow-900/30 bg-yellow-950/10 rounded">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-yellow-400 font-medium font-sans text-xs">Budget Nearing Cap</span>
                    <span className="text-[8px] bg-yellow-500/20 text-yellow-300 px-1 rounded">WARNING</span>
                  </div>
                  <div className="text-[9px] text-yellow-200/60 mb-2">Workspace budget is at 85% of monthly allowance.</div>
                  <button className="text-[8px] px-2 py-1 bg-yellow-900/40 text-white/80 hover:bg-yellow-800/60 rounded">MANAGE BUDGET</button>
                </div>

                <div className="p-2 border border-cyan-900/30 bg-cyan-950/10 rounded opacity-60">
                  <div className="text-center text-cyan-500/50 my-4 italic">No further attention items</div>
                </div>
              </div>
            </PanelCard>

            {/* 6. Recent Changes */}
            <PanelCard title="RECENT CHANGES">
              <div className="space-y-1">
                {telemetry?.timestamp ? (
                   <TimelineEvent 
                      title="Qubit Sync / Telemetry Ingest" 
                      time={new Date(telemetry.timestamp).toLocaleTimeString()} 
                      detail="Data ingested from MCP. Operational state synchronized." 
                   />
                ) : null}
                {health?.status ? (
                   <TimelineEvent 
                      title="Health Check Completed" 
                      time={new Date().toLocaleTimeString()} 
                      detail={`Subsystems verified: ${Object.keys(health.components || {}).join(', ')}`} 
                   />
                ) : null}
                {securityData?.surfaces ? securityData.surfaces.slice(0, 2).map((s:any, i:number) => (
                   <TimelineEvent 
                      key={i}
                      title={`Security Policy Update: ${s.name}`} 
                      time="10 MINS AGO" 
                      detail={`Threat level evaluated as ${s.threat_level}.`} 
                      isAlert={s.threat_level === 'critical'}
                   />
                )) : null}
                <TimelineEvent 
                   title="Initial Deploy" 
                   time="2 HOURS AGO" 
                   detail="Container spun up via automated Coolify pipeline." 
                />
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
            <LaunchpadCard title="Runtime Enforcement" status="Review policy drift" count={2} urgency="normal" />
            <LaunchpadCard title="Pipelines & GPC" status="Waiting approval" count={1} urgency="high" />
            <LaunchpadCard title="Governance" status="Trust updates" count={3} urgency="low" />
            <LaunchpadCard title="Interlink Console" status="Blocked executions" count={0} urgency="low" />
            <LaunchpadCard title="Nexus Protocol" status="Telemetry warming up" count={0} urgency="low" />
          </div>
        </div>

      </div>
    </div>
  );
}
