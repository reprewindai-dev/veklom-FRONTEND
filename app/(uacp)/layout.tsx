"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { controlStore } from '@/components/terminal/data/simulation';
import { AgentNode, VeklomRun, Delegate, TelemetryTick } from '@/components/terminal/types';
import Sidebar from '@/components/terminal/components/Sidebar';

export default function UACPLayout({ children }: { children: React.ReactNode }) {
  // Real-time ticking UTC clock for Geometric Balance theme
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLandingPage, setIsLandingPage] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, '0');
      setCurrentTime(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    if (typeof window !== "undefined") {
      setIsLandingPage(window.location.pathname === "/");
    }
    
    return () => clearInterval(interval);
  }, []);

  // Local Reactive State mirroring our central control simulation store
  const [agents, setAgents] = useState<AgentNode[]>(controlStore.agents);
  const [liveMetrics, setLiveMetrics] = useState(controlStore.liveMetrics);

  useEffect(() => {
    return controlStore.subscribe(() => {
      setAgents([...controlStore.agents]);
      setLiveMetrics({ ...controlStore.liveMetrics });
    });
  }, []);

  return (
    <div className="w-screen h-screen border-4 border-[#0A0A0C] bg-[#030303] text-white/90 overflow-hidden flex flex-col font-sans relative">
      
      {/* 1. Futuristic Scanline CRT overlay for cinematic feel */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-electric-cyan/2 w-full animate-scanline pointer-events-none z-50" />
      
      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md z-50 shrink-0 select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></div>
            <span className="text-xs font-bold tracking-[0.2em] uppercase">UACP v5 Control Plane</span>
          </div>
          <div className="h-4 w-px bg-white/20"></div>
          <div className="flex items-center gap-4 font-mono text-[10px] text-white/50 bg-black/50 px-2 py-1 rounded border border-white/10">
            <span className="text-white/30">CAPI_NODE:</span>
            <select 
              className="bg-transparent text-white/80 outline-none cursor-pointer hover:text-white transition-colors"
              onChange={(e) => {
                import('@/components/terminal/data/pglLoader').then(m => m.setCapiBaseUrl(e.target.value));
              }}
              defaultValue="https://api.veklom.com"
            >
              <option value="https://api.veklom.com" className="bg-black text-white">Veklom Cloud (api.veklom.com)</option>
              <option value="http://localhost:8088" className="bg-black text-white">Veklom Local (8088)</option>
              <option value="http://localhost:8080" className="bg-black text-white">Interlink Rust (8080)</option>
              <option value="https://cappo.veklom.com" className="bg-black text-white">CAPPO Cloud (cappo-backend)</option>
              <option value="http://localhost:8001" className="bg-black text-white">CAPPO Local (8001)</option>
            </select>
            <div className="w-px h-3 bg-white/20"></div>
            <span>LATENCY: 4MS</span>
            <span className="text-[#00FF66]">OS_HEALTH: 100%</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {!isLandingPage && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[9px] text-white/40 leading-none uppercase">ARBITEROS STATUS</div>
                <div className="text-[10px] font-mono text-[#00FF66] uppercase">ENFORCING / MODE_01</div>
              </div>
              <div className="w-24 h-1.5 bg-white/10 overflow-hidden">
                <div className="w-3/4 h-full bg-[#00FF66] shadow-[0_0_4px_#00FF66]"></div>
              </div>
            </div>
          )}
          <div className="text-xs font-mono tabular-nums text-white/70">{currentTime}</div>
          <div className="ml-4">
            {/* eslint-disable-next-line */}
            {/* @ts-ignore - appkit-button is a Reown Web Component */}
            <appkit-button />
          </div>
        </div>
      </header>

      {/* Main Content Split Frame */}
      <div className="flex-grow flex overflow-hidden relative">
        {/* Primary Navigation Sidebar */}
        <Sidebar
          mcpHeartbeat={liveMetrics.mcpIOHeartbeat}
          throughput={liveMetrics.throughput}
          agentsCount={agents.length}
        />

        {/* Central Application Viewport */}
        <main className="flex-grow flex flex-col justify-between overflow-y-auto overflow-x-hidden relative min-w-0 border-l border-white/5">
          <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-[#030303]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
