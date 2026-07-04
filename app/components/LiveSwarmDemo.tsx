"use client";

import React, { useEffect, useState } from "react";
import SwarmMap from "@/components/terminal/components/SwarmMap";
import { useApi } from "@/hooks/useApi";
import { AgentNode } from "@/components/terminal/types";
import { ArrowUpRight } from "lucide-react";

const TERMINAL_URL = 'https://terminal.veklom.com';

export default function LiveSwarmDemo() {
  const { data: realAgents = [] } = useApi<AgentNode[]>("/api/v1/agents");
  const [agents, setAgents] = useState<AgentNode[]>([]);

  // If we get real agents from the backend, use them. Otherwise fallback to some demo nodes so the map lights up!
  useEffect(() => {
    if (realAgents && realAgents.length > 0) {
      setAgents(realAgents);
    } else {
      // Mock data so the landing page map always looks alive
      setAgents([
        { id: "demo-1", name: "AlphaRouter", status: "idle", type: "router", lastActive: new Date().toISOString() },
        { id: "demo-2", name: "SecurityGuard", status: "active", type: "guard", lastActive: new Date().toISOString() },
        { id: "demo-3", name: "PGL-Oracle", status: "error", type: "oracle", lastActive: new Date().toISOString() },
        { id: "demo-4", name: "QueryOptimizer", status: "active", type: "optimizer", lastActive: new Date().toISOString() },
      ]);
    }
  }, [realAgents]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[450px] border border-white/10 rounded-2xl overflow-hidden bg-[#0A0A0C] shadow-2xl relative mb-8">
        <div className="absolute inset-0 z-0">
          <SwarmMap agents={agents} onAgentUpdate={() => {}} />
        </div>
        
        {/* Subtle overlay gradient to blend with the page */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#060608] via-transparent to-transparent z-10" />
      </div>

      <div className="relative z-20 text-center px-8 -mt-16">
        <div className="inline-flex items-center gap-2 text-[#00E5FF] text-xs font-bold uppercase tracking-widest bg-[#00E5FF]/10 backdrop-blur-md border border-[#00E5FF]/30 px-4 py-1.5 rounded-full mb-5 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
          Standalone Swarm Intelligence Interface
        </div>
        
        <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
          Real-time multi-agent coordination, live telemetry, swarm map, and governance controls — connected live to the Veklom backend.
        </p>
        
        <a
          href={TERMINAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00E5FF]/10 backdrop-blur-md border border-[#00E5FF]/30 text-[#00E5FF] font-bold text-sm rounded-lg hover:bg-[#00E5FF]/20 hover:border-[#00E5FF]/60 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all duration-300 font-mono"
        >
          Launch Swarm Terminal <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
