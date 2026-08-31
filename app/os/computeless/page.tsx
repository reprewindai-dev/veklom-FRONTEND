"use client";

import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { useState } from "react";

export default function ComputelessPage() {
  const stage = getStage("computeless");
  const data = useStageData("computeless", { autoGet: true });
  
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);

  const telemetryData = data.payloads["GET /api/v1/computeless/telemetry"] as any;
  const evidenceData = data.payloads["GET /api/v1/computeless/evidence"] as any;

  const handleExecute = async () => {
    setExecuting(true);
    const endpoint = stage.endpoints.find(e => e.method === "POST" && e.path.includes("/execute"));
    if (endpoint) {
       const res = await data.call<any>(endpoint, { operation: "test_run" });
       if (res.data) setExecResult(res.data);
    }
    setExecuting(false);
  };

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2 space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <div className="rounded-lg border border-theme-border bg-theme-surface p-8 text-center flex flex-col items-center">
             <div className="h-16 w-16 mb-4 rounded-full border border-theme-accent/30 bg-theme-accent/5 flex items-center justify-center">
               <svg className="w-8 h-8 text-theme-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
               </svg>
             </div>
             <h3 className="text-theme-ink font-semibold mb-2">Simulate Execution (Demo)</h3>
             <p className="text-theme-inkDim text-sm mb-6 max-w-sm">
               Trigger a mock execution to inspect the unsigned LOCAL_RECEIPT response format.
             </p>
             <button
               onClick={handleExecute}
               disabled={executing}
               className="px-6 py-2 rounded-lg bg-theme-accent text-theme-bg font-bold text-sm tracking-wider uppercase disabled:opacity-50 transition-opacity hover:opacity-90"
             >
               {executing ? "Dispatching..." : "Run Demo Simulation"}
             </button>
             
             {execResult && (
               <div className="mt-8 text-left w-full max-w-md bg-theme-surface-2 p-4 rounded border border-theme-border font-mono text-xs overflow-hidden">
                 <div className="text-theme-verified mb-2 font-bold uppercase tracking-widest">Execution Receipt</div>
                 <div className="truncate text-theme-ink"><span className="text-theme-inkDim">ID:</span> {execResult.receipt_id}</div>
                 <div className="truncate text-theme-ink"><span className="text-theme-inkDim">SIG:</span> {execResult.signature}</div>
               </div>
             )}
          </div>
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Telemetry" proof={data.stageProof}>
          {telemetryData ? (
             <div className="grid grid-cols-2 gap-3 text-sm">
               <div className="rounded border border-theme-border p-3 bg-theme-surface">
                 <div className="text-theme-inkDim text-[10px] uppercase tracking-widest mb-1">Latency</div>
                 <div className="text-theme-ink font-mono">{telemetryData.latency_ms} ms</div>
               </div>
               <div className="rounded border border-theme-border p-3 bg-theme-surface">
                 <div className="text-theme-inkDim text-[10px] uppercase tracking-widest mb-1">Throughput</div>
                 <div className="text-theme-ink font-mono">{telemetryData.throughput_tps} TPS</div>
               </div>
               <div className="rounded border border-theme-border p-3 bg-theme-surface col-span-2 flex justify-between">
                 <div>
                   <div className="text-theme-inkDim text-[10px] uppercase tracking-widest mb-1">Active Sessions</div>
                   <div className="text-theme-ink font-mono">{telemetryData.active_sessions}</div>
                 </div>
                 <div className="text-right">
                   <div className="text-theme-inkDim text-[10px] uppercase tracking-widest mb-1">Burn Rate</div>
                   <div className="text-theme-ink font-mono">{telemetryData.compute_cost_credits} µCredits/s</div>
                 </div>
               </div>
             </div>
          ) : (
             <HonestEmpty title="Telemetry unverified" route="GET /api/v1/computeless/telemetry" detail="Awaiting backend sync." />
          )}
        </Pillar>
        <Pillar title="Evidence" proof={data.stageProof}>
          {evidenceData ? (
             <div className="rounded border border-theme-border p-4 bg-theme-surface text-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-theme-inkDim uppercase tracking-widest text-[10px]">{evidenceData.evidence_class}</span>
                  <span className="text-amber-500 uppercase tracking-widest text-[10px] border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded">{evidenceData.status}</span>
                </div>
                <div className="text-[10px] text-theme-inkDim mb-1 uppercase tracking-widest">Evidence Hash</div>
                <div className="font-mono text-[10px] text-theme-accent break-all mb-4 bg-theme-accent/5 p-2 rounded">
                  {evidenceData.evidence_hash}
                </div>
                <div className="text-[10px] text-theme-inkDim mb-1 uppercase tracking-widest">Limitation</div>
                <div className="font-mono text-xs text-theme-ink opacity-70 border-l-2 border-l-amber-500/50 pl-2 mt-1">
                  {evidenceData.limitation}
                </div>
             </div>
          ) : (
             <HonestEmpty title="No evidence payload observed" route="GET /api/v1/computeless/evidence" detail="The compute-less execution left no proof yet." />
          )}
        </Pillar>
      </div>
    </SectionShell>
  );
}
