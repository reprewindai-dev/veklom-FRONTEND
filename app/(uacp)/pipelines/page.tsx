"use client";

export const dynamic = "force-dynamic";

import dynamicImport from "next/dynamic";
import React, { useState, useEffect } from 'react';
import { controlStore } from "@/components/terminal/data/simulation";
import { VeklomRun } from "@/components/terminal/types";

const RunSpine = dynamicImport(
  () => import("@/components/terminal/components/RunSpine"),
  { ssr: false, loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#030303] font-mono text-white/30 text-[10px] uppercase tracking-widest">
      Loading Pipeline Spine...
    </div>
  )}
);

export default function PipelinesPage() {
  const [runs, setRuns] = useState<VeklomRun[]>(controlStore.runs);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  useEffect(() => {
    return controlStore.subscribe(() => {
      setRuns([...controlStore.runs]);
    });
  }, []);

  return (
    <RunSpine
      runs={runs}
      selectedRunId={selectedRunId}
      onSelectRun={setSelectedRunId}
    />
  );
}
