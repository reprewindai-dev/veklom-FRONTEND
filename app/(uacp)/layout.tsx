"use client";


import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/terminal/components/Sidebar';

// Clean layout — no prototype terminal state, no controlStore, no simulation imports.
// The Sidebar is the nav component. Live metrics come from the real API.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function UACPLayout({ children }: { children: React.ReactNode }) {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isLandingPage, setIsLandingPage] = useState<boolean>(false);
  const [mcpHeartbeat, setMcpHeartbeat] = useState<string>('offline');
  const [throughput, setThroughput] = useState<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      setCurrentTime(`${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    if (typeof window !== "undefined") {
      setIsLandingPage(window.location.pathname === "/");
    }
    return () => clearInterval(interval);
  }, []);

  // Poll real health endpoint for sidebar status
  useEffect(() => {
    const poll = async () => {
      try {
        const base = API_BASE || (typeof window !== "undefined" ? window.location.origin : "");
        const res = await fetch(`${base}/api/v1/sys/health`, { cache: 'no-store' });
        if (res.ok) {
          setMcpHeartbeat('online');
          // Use latency as a proxy for throughput display
          setThroughput(0); // Real metric unavailable
        } else {
          setMcpHeartbeat('degraded');
        }
      } catch {
        setMcpHeartbeat('offline');
      }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-screen h-screen border-4 border-[#0A0A0C] bg-[#030303] text-white/90 overflow-hidden flex flex-col font-sans relative">

      {/* Scanline overlay */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-electric-cyan/2 w-full animate-scanline pointer-events-none z-50" />

      {/* Top Navigation Bar */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 backdrop-blur-md z-50 shrink-0 select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase">UACP V5 Control Plane</span>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <div className="flex items-center gap-4 font-mono text-[10px] text-white/50 bg-black/50 px-2 py-1 rounded border border-white/10">
            <span className="text-white/30">API:</span>
            <span className="text-electric-cyan">api.veklom.com</span>
            <div className="w-px h-3 bg-white/20" />
            <span className={mcpHeartbeat === 'online' ? 'text-[#00FF66]' : 'text-red-400'}>
              {mcpHeartbeat === 'online' ? '● LIVE' : '○ CONNECTING'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {!isLandingPage && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-[9px] text-white/40 leading-none uppercase">ZERO-TRUST ENFORCEMENT</div>
                <div className="text-[10px] font-mono text-[#00FF66] uppercase">ACTIVE / MODE_01</div>
              </div>
              <div className="w-24 h-1.5 bg-white/10 overflow-hidden">
                <div className="w-3/4 h-full bg-[#00FF66] shadow-[0_0_4px_#00FF66]" />
              </div>
            </div>
          )}
          <div className="text-xs font-mono tabular-nums text-white/70">{currentTime}</div>
          <div className="ml-4">
            {/* @ts-ignore - appkit-button is a Reown Web Component */}
            <appkit-button />
          </div>
        </div>
      </header>

      {/* Main Content Split Frame */}
      <div className="flex-grow flex overflow-hidden relative">
        <Sidebar
          mcpHeartbeat={mcpHeartbeat}
          throughput={throughput}
          agentsCount={0}
        />

        <main className="flex-grow flex flex-col justify-between overflow-y-auto overflow-x-hidden relative min-w-0 border-l border-white/5">
          <div className="flex-grow overflow-y-auto overflow-x-hidden relative bg-[#030303]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
