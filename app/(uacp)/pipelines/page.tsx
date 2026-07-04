"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import React, { useState, useEffect, Suspense } from 'react';
import { useApi } from "@/hooks/useApi";
import { VeklomRun } from "@/components/terminal/types";
import { useSearchParams } from 'next/navigation';

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
  
  // Fetch real autonomous decisions/runs from VBB
  const { data: runs = [], isLoading } = useApi<VeklomRun[]>("/api/v1/autonomous/decisions");
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

  return (
    <RunSpine
      runs={runs}
      selectedRunId={selectedRunId}
      onSelectRun={setSelectedRunId}
      isFocusedFromTerminal={fromTerminal && !!runIdParam}
    />
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
