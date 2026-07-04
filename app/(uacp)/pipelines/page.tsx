"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import React, { useState } from 'react';
import { useApi } from "@/hooks/useApi";
import { VeklomRun } from "@/components/terminal/types";

const RunSpine = dynamicImport(
  () => import("@/components/terminal/components/RunSpine"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#030303] font-mono text-white/30 text-[10px] uppercase tracking-widest">
      <div className="w-4 h-4 rounded-full border-t-2 border-electric-cyan animate-spin mr-3" />
      Connecting to Pipeline Ledger...
    </div>
  )}
);

export default function PipelinesPage() {
  // Fetch real autonomous decisions/runs from VBB
  const { data: runs = [], isLoading } = useApi<VeklomRun[]>("/api/v1/autonomous/decisions");
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

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
    />
  );
}
