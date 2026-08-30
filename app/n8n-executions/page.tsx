"use client";

import { useState, useEffect } from "react";
import { Activity, ShieldCheck, CheckCircle2, AlertCircle, XCircle, Clock, Server, Play, FileText, X } from "lucide-react";

const STEPS = [
  { id: "intent", label: "Intent Recognized", icon: FileText },
  { id: "policy", label: "Policy Decision", icon: ShieldCheck },
  { id: "lease", label: "Lease Issued", icon: Server },
  { id: "dispatched", label: "Execution Dispatched", icon: Play },
  { id: "consequence", label: "Consequence Verified", icon: CheckCircle2 },
  { id: "receipt", label: "Settlement Receipt", icon: Activity },
];

export default function N8NExecutionView() {
  const [data, setData] = useState<any>(null);
  const [activeExec, setActiveExec] = useState<string | null>(null);

  // Poll CAPPO state
  useEffect(() => {
    if (!activeExec) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/n8n-executions/${activeExec}`);
        if (!res.ok) throw new Error(`Projection unavailable (${res.status})`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeExec]);

  const startPipeline = async () => {
    const res = await fetch("/api/n8n-executions/latest", { cache: "no-store" });
    if (!res.ok) throw new Error(`No verified execution is available (${res.status})`);
    const json = await res.json();
    setActiveExec(json.execution_id);
    setData(json);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED": return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {status}</span>;
      case "RECONCILIATION_REQUIRED": return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {status}</span>;
      case "CANCELLED": return <span className="bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /> {status}</span>;
      case "FAILED_TERMINAL": return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1"><XCircle className="w-3 h-3" /> {status}</span>;
      default: return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold uppercase flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FB] dark:bg-[#0A0E1F] text-[#10162B] dark:text-[#F3F5FC] p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between border-b border-[#E1E5EE] dark:border-[#232B4A] pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sovereign Execution Pipeline</h1>
            <p className="text-sm text-[#545F7A] dark:text-[#8792B5] mt-1">
              Read-only projection of cryptographic execution state.
            </p>
          </div>
          <div className="flex items-center gap-4">
            {!data && (
              <button onClick={startPipeline} className="bg-[#2547D0] hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Load Latest Verified Execution
              </button>
            )}
            {data && renderStatusBadge(data.status)}
          </div>
        </div>

        {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            
            {/* Pipeline Visualization */}
            <div className="bg-white dark:bg-[#10162B] rounded-xl border border-[#E1E5EE] dark:border-[#232B4A] p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-6 text-[#545F7A] dark:text-[#8792B5]">Execution Trajectory</h2>
              <div className="relative">
                <div className="absolute top-0 bottom-0 left-[15px] w-px bg-[#E1E5EE] dark:bg-[#232B4A]" />
                <div className="space-y-6 relative">
                  {STEPS.map((step, idx) => {
                    const timeStr = data.timestamps ? data.timestamps[step.id] : null;
                    const isComplete = !!timeStr;
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex gap-4 items-start">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 bg-white dark:bg-[#10162B] ${isComplete ? 'border-[#2547D0] dark:border-[#5B7FFF] text-[#2547D0] dark:text-[#5B7FFF]' : 'border-[#E1E5EE] dark:border-[#232B4A] text-[#545F7A] dark:text-[#8792B5]'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={`text-sm font-medium ${isComplete ? 'text-[#10162B] dark:text-[#F3F5FC]' : 'text-[#545F7A] dark:text-[#8792B5]'}`}>
                            {step.label}
                          </p>
                          {isComplete && (
                            <p className="text-xs text-[#545F7A] dark:text-[#8792B5] mt-1 font-mono">
                              {timeStr}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Evidence details */}
            <div className="bg-white dark:bg-[#10162B] rounded-xl border border-[#E1E5EE] dark:border-[#232B4A] p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#545F7A] dark:text-[#8792B5]">Execution Identity</h2>
              
              <div className="grid grid-cols-3 gap-4 border-b border-[#E1E5EE] dark:border-[#232B4A] pb-4">
                <div className="col-span-1 text-sm text-[#545F7A] dark:text-[#8792B5]">Execution ID</div>
                <div className="col-span-2 text-sm font-mono">{data.execution_id}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-[#E1E5EE] dark:border-[#232B4A] pb-4">
                <div className="col-span-1 text-sm text-[#545F7A] dark:text-[#8792B5]">Lease Scope</div>
                <div className="col-span-2 text-sm font-mono">{data.lease_scope}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-[#E1E5EE] dark:border-[#232B4A] pb-4">
                <div className="col-span-1 text-sm text-[#545F7A] dark:text-[#8792B5]">Audit ID</div>
                <div className="col-span-2 text-sm font-mono">{data.audit_id}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-[#E1E5EE] dark:border-[#232B4A] pb-4">
                <div className="col-span-1 text-sm text-[#545F7A] dark:text-[#8792B5]">Evidence Hash</div>
                <div className="col-span-2 text-xs font-mono break-all">{data.evidence_hash}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="col-span-1 text-sm text-[#545F7A] dark:text-[#8792B5]">Policy Rationale</div>
                <div className="col-span-2 text-sm">{data.rationale}</div>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-[#10162B] rounded-xl border border-[#E1E5EE] dark:border-[#232B4A] p-6 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider mb-4 text-[#545F7A] dark:text-[#8792B5]">Actions</h2>
              <div className="space-y-3">
                <button 
                  disabled={!data.can_cancel}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <X className="w-4 h-4" /> Revoke Lease (Not Yet Live)
                </button>
                <button 
                  disabled={!data.can_retry}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-[#10162B] dark:text-[#F3F5FC] border border-[#E1E5EE] dark:border-[#232B4A] hover:bg-slate-50 dark:hover:bg-[#1A2240] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Activity className="w-4 h-4" /> Safe Retry (Not Yet Live)
                </button>
                <p className="text-xs text-[#545F7A] dark:text-[#8792B5] mt-3 text-center">
                  Controls remain disabled until CAPPO mutation endpoints are live and verified.
                </p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
