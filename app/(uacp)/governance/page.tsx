"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import CouncilMatrix from "@/components/terminal/components/CouncilMatrix";
import { controlStore } from "@/components/terminal/data/simulation";
import { Delegate, TelemetryTick } from "@/components/terminal/types";

export default function GovernancePage() {
  const [delegates, setDelegates] = useState<Delegate[]>(controlStore.delegates);
  const [logs, setLogs] = useState<TelemetryTick[]>(controlStore.logs);
  const [liveMetrics, setLiveMetrics] = useState(controlStore.liveMetrics);

  useEffect(() => {
    return controlStore.subscribe(() => {
      setDelegates([...controlStore.delegates]);
      setLogs([...controlStore.logs]);
      setLiveMetrics({ ...controlStore.liveMetrics });
    });
  }, []);

  const handleVotePropose = (proposalName: string) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      source: 'Council',
      message: `LEGISLATURE: Motion initiated for ${proposalName}. Transmitting to backend for validation.`,
      type: 'warn' as const
    };
    setLogs(prev => [newLog, ...prev]);
  };

  return (
    <CouncilMatrix 
      delegates={delegates}
      onVotePropose={handleVotePropose}
      logs={logs}
      metrics={liveMetrics}
    />
  );
}
