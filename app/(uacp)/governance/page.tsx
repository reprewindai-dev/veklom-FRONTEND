"use client";

export const dynamic = "force-dynamic";

import React, { useState } from 'react';
import CouncilMatrix from "@/components/terminal/components/CouncilMatrix";
import { useApi } from "@/hooks/useApi";
import { Delegate, TelemetryTick } from "@/components/terminal/types";

export default function GovernancePage() {
  const { data: pglIdentities = [], isLoading } = useApi<any[]>("/api/v1/pgl/registry");
  const [logs, setLogs] = useState<TelemetryTick[]>([]);

  // Map PGL Identities to the Delegate format expected by CouncilMatrix
  const delegates: Delegate[] = pglIdentities.map(identity => ({
    id: identity.id,
    name: identity.agent_name || "Unknown Identity",
    reputation: 100, // Default base reputation
    status: identity.status?.toLowerCase() === 'quarantined' ? 'offline' : 'active',
    lastSync: identity.created_at || new Date().toISOString(),
    department: 'Engineering',
    weight: 1,
    vote: 'pending',
    lastAttestation: new Date().toISOString(),
    influence: 10
  }));

  const handleVotePropose = (proposalName: string) => {
    const newLog = {
      timestamp: new Date().toISOString(),
      source: 'PGL Matrix',
      message: `LEGISLATURE: Motion initiated for ${proposalName}. Transmitting to backend for zero-trust validation.`,
      type: 'warn' as const
    };
    setLogs(prev => [newLog, ...prev]);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-void-black text-white/40 font-mono text-sm">
        <div className="w-4 h-4 rounded-full border-t-2 border-electric-cyan animate-spin mr-3" />
        RESOLVING PGL IDENTITIES...
      </div>
    );
  }

  return (
    <CouncilMatrix 
      delegates={delegates}
      onVotePropose={handleVotePropose}
      logs={logs}
      metrics={{
        throughput: 1.2,
        attestationRate: 99.98,
        gasSaved: 12500,
        activeQueue: 0,
        uptime: "99.99%",
        totalExecutions: 15420
      }}
    />
  );
}
