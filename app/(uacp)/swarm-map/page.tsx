"use client";

export const dynamic = "force-dynamic";

import React from 'react';
import SwarmMap from "@/components/terminal/components/SwarmMap";
import { useApi } from "@/hooks/useApi";
import { AgentNode } from "@/components/terminal/types";

export default function SwarmMapPage() {
  const { data: agents = [], isLoading } = useApi<AgentNode[]>("/api/v1/agents");

  const handleAgentUpdate = (id: string, updatedFields: Partial<AgentNode>) => {
    // In a live environment, this would PATCH to the backend.
    console.log("Agent update requested:", id, updatedFields);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-void-black text-white/40 font-mono text-sm">
        <div className="w-4 h-4 rounded-full border-t-2 border-electric-cyan animate-spin mr-3" />
        ESTABLISHING SWARM UPLINK...
      </div>
    );
  }

  return <SwarmMap agents={agents} onAgentUpdate={handleAgentUpdate} />;
}
