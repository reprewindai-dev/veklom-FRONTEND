"use client";

import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

export default function InfrastructurePage() {
  const stage = getStage("infrastructure");
  const data = useStageData("infrastructure", { autoGet: true });

  const hostData = data.payloads["GET /api/v1/infrastructure/host"] as any;
  const runtimeData = data.payloads["GET /api/v1/infrastructure/runtime"] as any;
  const topologyData = data.payloads["GET /api/v1/infrastructure/topology"] as any;
  const connectivityData = data.payloads["GET /api/v1/infrastructure/connectivity"] as any;

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2 space-y-4">
        <Pillar title="Host" proof={data.stageProof}>
          {hostData ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2 rounded-lg border border-theme-border p-3 bg-theme-surface flex items-center justify-between">
                <span className="text-theme-inkDim uppercase tracking-widest text-[10px]">Proof Class</span>
                <span className="text-theme-ink font-mono text-[10px] bg-theme-border/50 px-2 py-0.5 rounded">{hostData.evidence_class}</span>
              </div>
              <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Hostname</div>
                <div className="text-theme-ink font-mono">{hostData.hostname}</div>
              </div>
              <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">OS / Architecture</div>
                <div className="text-theme-ink font-mono">{hostData.os} {hostData.release} ({hostData.architecture})</div>
              </div>
              <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">CPU ({hostData.measurement_scope?.cpu_source})</div>
                <div className="text-theme-ink font-mono">{hostData.cpu_cores} Cores @ {hostData.cpu_usage_percent}%</div>
              </div>
              <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Memory ({hostData.measurement_scope?.memory_source})</div>
                <div className="text-theme-ink font-mono">{hostData.memory_total_gb} GB ({hostData.memory_used_percent}% used)</div>
              </div>
            </div>
          ) : (
            <HonestEmpty title="Host metrics unverified" route="GET /api/v1/infrastructure/host" detail="No active physical host proof." />
          )}
        </Pillar>
        <Pillar title="Runtime" proof={data.stageProof}>
          {runtimeData ? (
            <div className="space-y-4 text-sm">
               <div className="flex justify-between rounded-lg border border-theme-border p-4 bg-theme-surface">
                  <div>
                    <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Engine</div>
                    <div className="text-theme-ink font-mono uppercase">{runtimeData.engine}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Orchestrator</div>
                    <div className="text-theme-ink font-mono uppercase">{runtimeData.orchestrator}</div>
                  </div>
               </div>
               <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                  <div className="text-theme-inkDim mb-2 uppercase tracking-widest text-[10px]">Active Capabilities</div>
                  <ul className="space-y-1">
                    {runtimeData.active_capabilities.map((cap: string) => (
                      <li key={cap} className="flex items-center gap-2 text-theme-ink font-mono text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-theme-verified shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                        {cap}
                      </li>
                    ))}
                  </ul>
               </div>
            </div>
          ) : (
            <HonestEmpty title="Runtime metrics unverified" route="GET /api/v1/infrastructure/runtime" detail="No runtime execution evidence." />
          )}
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Topology" proof={data.stageProof}>
          {topologyData ? (
             <div className="space-y-4 text-sm">
               <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                 <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Mesh Type</div>
                 <div className="text-theme-ink font-mono text-xs">{topologyData.mesh_type}</div>
               </div>
               <div className="rounded-lg border-l-2 border-l-theme-accent/50 border-theme-border p-3 bg-theme-surface">
                 <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">{topologyData.discovery_mechanism} ({topologyData.evidence_class})</div>
                 <div className="text-theme-ink font-mono text-xs opacity-75">{topologyData.discovery_limitation}</div>
               </div>
               <div className="rounded-lg border border-theme-border p-4 bg-theme-surface space-y-3">
                  <div className="text-theme-inkDim uppercase tracking-widest text-[10px]">Active Nodes</div>
                  {topologyData.nodes.map((node: any) => (
                    <div key={node.id} className="flex flex-col border-b border-theme-border pb-2 last:border-0 last:pb-0">
                       <div className="flex items-center justify-between">
                         <span className="font-mono text-[11px] text-theme-ink">{node.role}</span>
                         <span className="h-2 w-2 rounded-full bg-theme-verified shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                       </div>
                       <div className="text-[10px] text-theme-inkDim font-mono opacity-60">{node.ip}</div>
                    </div>
                  ))}
               </div>
             </div>
          ) : (
            <HonestEmpty title="Topology unverified" route="GET /api/v1/infrastructure/topology" detail="Network topology layout missing." />
          )}
        </Pillar>
        <Pillar title="Connectivity" proof={data.stageProof}>
          {connectivityData ? (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Status</div>
                <div className="text-theme-verified font-mono uppercase font-bold">{connectivityData.status}</div>
              </div>
              <div className="rounded-lg border border-theme-border p-4 bg-theme-surface">
                <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Latency</div>
                <div className="text-theme-ink font-mono">{connectivityData.latency_ms}ms</div>
              </div>
              <div className="col-span-2 rounded-lg border border-theme-border p-4 bg-theme-surface">
                <div className="text-theme-inkDim mb-1 uppercase tracking-widest text-[10px]">Supported Protocols</div>
                <div className="text-theme-ink font-mono text-xs opacity-75">{connectivityData.protocols.join(" • ")}</div>
              </div>
            </div>
          ) : (
            <HonestEmpty title="Connectivity unverified" route="GET /api/v1/infrastructure/connectivity" detail="No active connection metrics." />
          )}
        </Pillar>
      </div>
    </SectionShell>
  );
}
