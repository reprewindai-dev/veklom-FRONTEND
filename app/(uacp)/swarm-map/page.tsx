"use client";


import React from 'react';
import SwarmMap from "@/components/terminal/components/SwarmMap";
import { useApi } from "@/hooks/useApi";
import { AgentNode } from "@/components/terminal/types";
import { AlertTriangle } from "lucide-react";

interface SwarmMapSource {
  agents: AgentNode[];
  proof: {
    state: "verified" | "empty" | "needs_proof" | "error";
    source: string;
    reason: string;
    generated_at: string;
    routes: {
      registry: string;
      health: string;
      metrics: string;
    };
  };
  monitoring?: {
    health?: unknown;
    metrics?: unknown;
  };
}

export default function SwarmMapPage() {
  const { data, isLoading, error, mutate } = useApi<SwarmMapSource>("/api/swarm-map/agents", {
    refreshInterval: 15000,
  });

  const handleAgentUpdate = (id: string, updatedFields: Partial<AgentNode>) => {
    mutate((current) => {
      if (!current) return current;
      return {
        ...current,
        agents: current.agents.map((agent) =>
          agent.id === id ? { ...agent, ...updatedFields } : agent,
        ),
      };
    }, false);
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-void-black text-white/40 font-mono text-sm">
        <div className="w-4 h-4 rounded-full border-t-2 border-electric-cyan animate-spin mr-3" />
        ESTABLISHING SWARM UPLINK...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-void-black p-6">
        <div className="max-w-xl border border-hazard-amber/30 bg-hazard-amber/5 p-5 font-mono text-sm text-hazard-amber">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white">
            <AlertTriangle className="h-4 w-4" />
            Swarm Map Needs Proof
          </div>
          <p className="text-xs leading-relaxed text-white/60">
            The BYOS agent registry could not be verified. No local or simulated swarm will be rendered.
          </p>
          <pre className="mt-3 overflow-auto border border-white/10 bg-black/50 p-3 text-[11px] text-white/70">
            {error.message}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <SwarmMap
      agents={data?.agents || []}
      onAgentUpdate={handleAgentUpdate}
      sourceProof={data?.proof}
    />
  );
}
