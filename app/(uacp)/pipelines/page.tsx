"use client";


import dynamicImport from "next/dynamic";
import React, { useState, useEffect, Suspense } from 'react';
import { useApi } from "@/hooks/useApi";
import { VeklomRun } from "@/components/terminal/types";
import { useSearchParams } from 'next/navigation';

type ProofState = "verified" | "partial" | "empty" | "needs_proof" | "error";

interface PipelinesGpcData {
  runs: VeklomRun[];
  proof: {
    state: ProofState;
    source: string;
    reason: string;
    generated_at: string;
    routes: Record<string, string>;
    probes: {
      ok: boolean;
      status: number;
      route: string;
      error?: string;
    }[];
  };
  pipelines: unknown[];
  gpc: {
    events?: unknown;
    signals?: unknown;
    stats?: unknown;
  };
}

const RunSpine = dynamicImport(
  () => import("@/components/terminal/components/RunSpine"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#030303] font-mono text-white/30 text-[10px] uppercase tracking-widest">
      <div className="w-4 h-4 rounded-full border-t-2 border-electric-cyan animate-spin mr-3" />
      Connecting to Pipeline Ledger...
    </div>
  )}
);

function PipelinesPageContent() {
  const searchParams = useSearchParams();
  const runIdParam = searchParams.get('run');
  const fromTerminal = searchParams.get('from') === 'terminal';

  const { data, error, isLoading } = useApi<PipelinesGpcData>("/api/pipelines-gpc/runs", {
    refreshInterval: 15000,
  });
  const runs = data?.runs ?? [];
  const [selectedRunId, setSelectedRunId] = useState<string | null>(runIdParam || null);

  useEffect(() => {
    if (runIdParam && runIdParam !== selectedRunId) {
      setSelectedRunId(runIdParam);
    }
  }, [runIdParam]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#030303] font-mono text-white/30 text-[10px] uppercase tracking-widest">
        <div className="w-4 h-4 rounded-full border-t-2 border-electric-cyan animate-spin mr-3" />
        Connecting to Pipeline Ledger...
      </div>
    );
  }

  const proof = data?.proof;
  const degraded = Boolean(error) || proof?.state !== "verified";

  return (
    <div className="w-full h-full flex flex-col bg-[#030303]">
      {degraded && (
        <div className="border-b border-[#ffab00]/20 bg-[#ffab00]/5 px-4 py-2 font-mono text-[10px] text-[#ffab00]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-black uppercase tracking-widest">
              {proof?.state ? proof.state.replace("_", " ") : "needs proof"}
            </span>
            <span className="text-white/55">
              {error ? "Pipeline proof adapter failed to load." : proof?.reason}
            </span>
          </div>
          {proof?.probes?.length ? (
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-white/35">
              {proof.probes.map((probe) => (
                <span key={probe.route}>
                  {probe.route}: {probe.ok ? "ok" : `${probe.status || "error"} ${probe.error ?? ""}`}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <RunSpine
          runs={runs}
          selectedRunId={selectedRunId}
          onSelectRun={(id) => setSelectedRunId(id || null)}
          isFocusedFromTerminal={fromTerminal && !!runIdParam}
        />
      </div>
    </div>
  );
}

export default function PipelinesPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-[#030303] font-mono text-white/30 text-[10px] uppercase tracking-widest">
        <div className="w-4 h-4 rounded-full border-t-2 border-electric-cyan animate-spin mr-3" />
        Connecting to Pipeline Ledger...
      </div>
    }>
      <PipelinesPageContent />
    </Suspense>
  );
}
