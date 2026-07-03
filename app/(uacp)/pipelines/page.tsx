"use client";

import React, { useState, useEffect } from 'react';
import RunSpine from "@/components/terminal/components/RunSpine";
import { controlStore } from "@/components/terminal/data/simulation";
import { VeklomRun } from "@/components/terminal/types";

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
