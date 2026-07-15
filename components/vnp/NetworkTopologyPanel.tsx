"use client";
import React, { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import { fetcher, api } from "@/lib/api";
import { Server, Activity, ShieldAlert, Zap, Cpu, Clipboard, RefreshCw, Layers, Radio, Flame, CheckCircle, Terminal, Play, Lock, Database, PlayCircle, StopCircle } from "lucide-react";

interface PeerNode {
  id: string;
  name: string;
  region: string;
  status: "LEADER" | "ATTESTING" | "CHALLENGED" | "STANDBY";
  status_str?: string;
  x: number;
  y: number;
  stakeUsd: number;
  cpuMs: number;
  poolUtilization: number;
  version: string;
  tenantLock: string;
}

interface PaymentPacket {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  progress: number; // 0 to 1
  amountUsd: number;
  tenant: string;
}

interface SwarmTransaction {
  id: string;
  timestamp: string;
  tenant: string;
  amount: number;
  status: "SETTLED" | "ESCROWED" | "SLASHED" | "PENDING";
  signature: string;
  proposer?: string;
}
export default function NetworkTopologyPanel() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const { data: topologyData, mutate: refreshTopology } = useSWR<any>("/api/v1/beacon/topology", fetcher, { refreshInterval: 5000 });
  const { data: x402Config } = useSWR<any>("/api/v1/x402/config", fetcher, { refreshInterval: 30000 });
  
  // Real State from Backend
  const realTopology = topologyData?.topology;

  // UI State
  const [nodes, setNodes] = useState<PeerNode[]>([]);
  const [packets, setPackets] = useState<PaymentPacket[]>([]);
  const [eventsLog, setEventsLog] = useState<string[]>([]);
  const [ledgerFeed, setLedgerFeed] = useState<SwarmTransaction[]>([]);
  const [isActiveStorm, setIsActiveStorm] = useState(false);
  const [totalSettledUsd, setTotalSettledUsd] = useState(0);
  const [safetyGuardActive, setSafetyGuardActive] = useState(true);

  // Sync strictly real data from backend
  useEffect(() => {
    if (realTopology) {
      if (realTopology.nodes) {
        setNodes(realTopology.nodes);
        if (realTopology.nodes.length > 0 && !selectedNodeId) {
          setSelectedNodeId(realTopology.nodes[0].id);
        }
      }
      if (realTopology.eventsLog) setEventsLog(realTopology.eventsLog);
      if (realTopology.ledgerFeed) setLedgerFeed(realTopology.ledgerFeed);
      if (realTopology.totalSettledUsd !== undefined) setTotalSettledUsd(realTopology.totalSettledUsd);
      if (realTopology.isActiveStorm !== undefined) setIsActiveStorm(realTopology.isActiveStorm);
      if (realTopology.safetyGuardActive !== undefined) setSafetyGuardActive(realTopology.safetyGuardActive);
    }
  }, [realTopology]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;
  const activeNodes = Number(realTopology?.activeNodes ?? nodes.filter((node) => node.status_str === "Connected").length);
  const expectedNodes = Number(realTopology?.expectedNodes ?? 5);
  const registeredNodes = Number(realTopology?.registeredNodes ?? nodes.length);
  const topologyLabel =
    activeNodes >= expectedNodes && expectedNodes > 0
      ? "NODE MESH CONNECTED"
      : registeredNodes > 0
        ? `${registeredNodes}/${expectedNodes} REGISTERED · ${activeNodes}/${expectedNodes} CONNECTED`
        : "NODE MESH DISCONNECTED";
  const topologyLabelClass =
    activeNodes >= expectedNodes && expectedNodes > 0
      ? "text-emerald-300 bg-emerald-950/40 border-emerald-500/20"
      : registeredNodes > 0
        ? "text-amber-300 bg-amber-950/30 border-amber-500/20"
        : "text-rose-300 bg-rose-950/30 border-rose-500/20";
  const x402Enabled = Boolean(x402Config?.enabled);
  const x402Label = x402Enabled
    ? `x402 USDC Route Payments: Live (${x402Config?.network ?? "base"})`
    : "x402 USDC Route Payments: Config Incomplete";
  const settlementLabel =
    totalSettledUsd > 0 ? `${totalSettledUsd.toFixed(2)} $SETTLED` : "No ledger settlements recorded";

  // ── ACTIONS ────────────────────────────────────────────────────────────────────
  
  const triggerStorm = async () => {
    try {
      await api.post("/api/v1/admin/debug/storm", {});
      refreshTopology();
    } catch (err) {
      console.error("Failed to trigger real storm:", err);
    }
  };

  const triggerAttestationChallenge = async () => {
    try {
      await api.post("/api/v1/admin/debug/slash", { peer: selectedNodeId });
      refreshTopology();
    } catch (err) {
      console.error("Failed to trigger real slash:", err);
    }
  };

  const toggleSafetyGuard = async () => {
    try {
      await api.post("/api/v1/admin/config", { safetyGuard: !safetyGuardActive });
      refreshTopology();
    } catch(err) {
      console.error("Failed to toggle guard", err);
    }
  };

  return (
    <div id="vnp-topology-cockpit-root" className="grid grid-cols-1 lg:grid-cols-12 gap-7 animate-fade-in text-[11px] font-mono">
      
      {/* LEFT SPACE: Interactive SVG Graph Node Swarm (lg:col-span-8) */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-gradient-to-br from-[#080d15] to-[#04070a] border border-cyan-900/30 rounded-2xl p-5 relative overflow-hidden h-[570px] shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        {/* Glow Effects Filters */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="node-glow-healthy" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComponentTransfer in="blur" result="glow">
                <feFuncA type="linear" slope="0.5" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="node-glow-challenged" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComponentTransfer in="blur" result="glow">
                <feFuncA type="linear" slope="0.8" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            <radialGradient id="grad-leader" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#047857" stopOpacity="1" />
              <stop offset="70%" stopColor="#022c22" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#022c22" stopOpacity="0.4" />
            </radialGradient>
            <radialGradient id="grad-challenged" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#b91c1c" stopOpacity="1" />
              <stop offset="70%" stopColor="#450a0a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#450a0a" stopOpacity="0.4" />
            </radialGradient>
            <radialGradient id="grad-standby" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#334155" stopOpacity="1" />
              <stop offset="70%" stopColor="#0f172a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
            </radialGradient>
          </defs>
        </svg>

        {/* HUD Overlay Info Bar */}
        <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3 z-10 relative">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-sm font-sans tracking-wide text-white/90">Veklom Gateway &amp; x402 Settlement Evidence</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] uppercase tracking-widest border px-2 py-0.5 rounded shadow-[inset_0_0_10px_rgba(16,185,129,0.1)] ${topologyLabelClass}`}>
                {topologyLabel}
              </span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest px-2 py-0.5 rounded border bg-slate-900/50 border-slate-700/50 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" /> STRICT MODE
              </span>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <span className={`text-[9px] uppercase tracking-[0.2em] ${x402Enabled ? "text-emerald-400/70" : "text-amber-400/70"}`}>{x402Label}</span>
            <div className="bg-[#0b1219]/60 border border-cyan-900/40 rounded px-3 py-1 flex items-center gap-2 backdrop-blur-sm">
              <span className={`w-1.5 h-1.5 rounded-full ${totalSettledUsd > 0 ? "bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]" : "bg-slate-500"}`}></span>
              <span className={`${totalSettledUsd > 0 ? "text-emerald-400" : "text-slate-400"} font-mono text-sm tracking-tight`}>{settlementLabel}</span>
            </div>
          </div>
        </div>

        {/* The Vector map viewport area */}
        <div className="flex-1 min-h-[350px] relative mt-2 select-none">
          <svg viewBox="0 0 600 450" className="w-[100%] h-[100%] block">
            {/* Draw grid background lines */}
            <g stroke="rgba(34, 211, 238, 0.05)" strokeWidth="1">
              {Array.from({ length: 9 }).map((_, i) => (
                <line key={`grid-v-${i}`} x1={i * 70 + 20} y1="0" x2={i * 70 + 20} y2="450" />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <line key={`grid-h-${i}`} x1="0" y1={i * 70 + 15} x2="600" y2={i * 70 + 15} />
              ))}
            </g>

            {/* Draw animated fiber-optic connection lines */}
            <g>
              {nodes.map((n1, idx1) => 
                nodes.slice(idx1 + 1).map((n2) => {
                  const isLeaderCon = n1.status === "LEADER" || n2.status === "LEADER";
                  const isChallenged = n1.status === "CHALLENGED" || n2.status === "CHALLENGED";
                  
                  // Base static line
                  const strokeColor = isChallenged ? "rgba(239, 68, 68, 0.15)" : isLeaderCon ? "rgba(16, 185, 129, 0.2)" : "rgba(34, 211, 238, 0.1)";
                  const strokeWidth = isLeaderCon ? "1.5" : "1";
                  
                  return (
                    <g key={`link-${n1.id}-${n2.id}`}>
                      {/* Glow backdrop for leader connections */}
                      {isLeaderCon && !isChallenged && (
                        <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="rgba(16, 185, 129, 0.1)" strokeWidth="4" style={{ filter: "url(#laser-glow)" }} />
                      )}
                      <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke={strokeColor} strokeWidth={strokeWidth} />
                      
                      {/* Animated traffic flow (dashed line moving) */}
                      {isLeaderCon && !isChallenged && (
                        <line 
                          x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} 
                          stroke="rgba(16, 185, 129, 0.4)" 
                          strokeWidth="1.5" 
                          strokeDasharray="4 12" 
                          className="animate-[dash_3s_linear_infinite]" 
                        />
                      )}
                    </g>
                  );
                })
              )}
            </g>

            {/* Draw simulation packets if active */}
            {packets.map((p) => {
              const currentX = p.fromX + (p.toX - p.fromX) * p.progress;
              const currentY = p.fromY + (p.toY - p.fromY) * p.progress;
              const color = p.tenant === "veklom.io" ? "#10b981" : p.tenant === "tempo_global" ? "#6366f1" : "#f59e0b";

              return (
                <g key={p.id}>
                  <circle cx={currentX} cy={currentY} r="3" fill={color} style={{ filter: "url(#laser-glow)" }} />
                  <circle cx={currentX} cy={currentY} r="8" fill="none" stroke={color} strokeWidth="1" opacity={(1.0 - p.progress) * 0.8} />
                </g>
              );
            })}

            {/* Draw interactable physical nodes */}
            {nodes.map((n) => {
              const isSelected = selectedNodeId === n.id;
              let fillGradient = "url(#grad-standby)";
              let borderStroke = "rgba(34, 211, 238, 0.3)";
              let ledColor = "#94a3b8";
              let glowFilter = undefined;

              if (n.status === "LEADER") {
                fillGradient = "url(#grad-leader)";
                borderStroke = "rgba(16, 185, 129, 0.8)";
                ledColor = "#10b981";
                glowFilter = "url(#node-glow-healthy)";
              } else if (n.status === "CHALLENGED") {
                fillGradient = "url(#grad-challenged)";
                borderStroke = "rgba(239, 68, 68, 0.8)";
                ledColor = "#ef4444";
                glowFilter = "url(#node-glow-challenged)";
              }

              if (isSelected) {
                borderStroke = "#22d3ee"; // Cyan for selected
              }

              return (
                <g 
                  key={n.id} 
                  transform={`translate(${n.x}, ${n.y})`}
                  className="cursor-pointer group outline-none"
                  onClick={() => setSelectedNodeId(n.id)}
                >
                  <circle cx="0" cy="0" r="30" fill="transparent" />

                  {/* Selection Ring */}
                  {isSelected && (
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill="none"
                      stroke="rgba(34,211,238,0.5)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="animate-[spin_10s_linear_infinite]"
                    />
                  )}

                  {/* Core Base */}
                  <circle
                    cx="0"
                    cy="0"
                    r="14"
                    fill={fillGradient}
                    stroke={borderStroke}
                    strokeWidth={isSelected ? "2" : "1"}
                    style={{ filter: glowFilter }}
                    className="transition-transform duration-300 group-hover:scale-110"
                  />

                  {/* Core Inner Ring */}
                  <circle
                    cx="0"
                    cy="0"
                    r="8"
                    fill="none"
                    stroke={ledColor}
                    strokeWidth="0.5"
                    opacity="0.5"
                    className={n.status === "LEADER" ? "animate-[spin_4s_linear_infinite]" : undefined}
                    strokeDasharray="2 2"
                  />

                  {/* Status LED */}
                  <circle
                    cx="0"
                    cy="0"
                    r="2.5"
                    fill={ledColor}
                    className={n.status === "CHALLENGED" ? "animate-ping" : undefined}
                    style={{ filter: "url(#laser-glow)" }}
                  />

                  {/* Floating Identifier Label */}
                  <g transform="translate(0, 28)">
                    {/* Label background pill */}
                    <rect x="-35" y="-8" width="70" height="14" rx="4" fill="rgba(3,7,12,0.8)" stroke={borderStroke} strokeWidth="0.5" opacity="0.8" />
                    <text
                      x="0"
                      y="3"
                      fill={isSelected ? "#22d3ee" : n.status === "CHALLENGED" ? "#f87171" : "#cbd5e1"}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="font-medium tracking-tight group-hover:fill-white transition-colors"
                    >
                      {n.name.includes("-") ? n.name.split("-")[1] : n.name}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Real-time system tracing console logs bar */}
        <div className="space-y-2 mt-4">
          <div className="flex items-center gap-2 text-[10px] text-cyan-500/50 uppercase tracking-widest pb-2 border-b border-cyan-900/20">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>VNP Ledger Trace &amp; x402 Evidence Feed</span>
          </div>
          <div className="h-[75px] overflow-y-auto font-mono text-[10px] leading-relaxed text-slate-300 space-y-1.5 scrollbar-thin scrollbar-thumb-cyan-900/50 p-2 bg-[#03070c]/50 rounded border border-cyan-900/10 inset-shadow">
            {eventsLog.length === 0 ? (
              <div className="text-cyan-500/30 italic">Awaiting network events...</div>
            ) : (
              eventsLog.map((log, idx) => {
                let badge = "text-cyan-200/70";
                if (log.includes("STORM")) badge = "text-amber-400 font-bold drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]";
                if (log.includes("FAIL") || log.includes("CHALLENGE") || log.includes("slashing")) badge = "text-rose-400 font-bold";
                if (log.includes("patched") || log.includes("restored")) badge = "text-emerald-400 font-bold";
                if (log.includes("Row Level Security")) badge = "text-indigo-300";
                
                return (
                  <div key={idx} className={`${badge} break-all flex gap-2`}>
                    <span className="text-cyan-500/30 shrink-0">❯</span>
                    <span>{log}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* RIGHT SPACE: Controlling Command Center HUD (lg:col-span-4) */}
      <div className="lg:col-span-4 space-y-5 flex flex-col justify-between">
        
        {/* Validator HUD Inspector Details */}
        {selectedNode ? (
          <div className="bg-gradient-to-b from-[#080d15]/90 to-[#03070c]/90 border border-cyan-900/30 rounded-2xl p-5 space-y-5 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
            
            <div className="flex items-start gap-3 border-b border-cyan-900/30 pb-4">
              <div className={`p-2 rounded-lg border ${selectedNode.status === "LEADER" ? "bg-emerald-950/30 border-emerald-500/30" : selectedNode.status === "CHALLENGED" ? "bg-rose-950/30 border-rose-500/30" : "bg-cyan-950/20 border-cyan-900/30"}`}>
                <Server className={`${selectedNode.status === "LEADER" ? "text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]" : selectedNode.status === "CHALLENGED" ? "text-rose-400" : "text-cyan-400"} w-5 h-5`} />
              </div>
              <div className="flex-1">
                <span className="text-[9px] uppercase tracking-[0.2em] text-cyan-500/50 block mb-0.5">Consensus Node</span>
                <h3 className="text-sm font-sans font-medium text-white/90">{selectedNode.name}</h3>
              </div>
              <span className={`text-[9px] font-mono px-2.5 py-1 rounded border tracking-widest uppercase ${
                selectedNode.status === "LEADER"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                  : selectedNode.status === "CHALLENGED"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                  : selectedNode.status === "STANDBY"
                  ? "bg-slate-800/50 text-slate-400 border-slate-700"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {selectedNode.status_str || selectedNode.status}
              </span>
            </div>

            <div className="space-y-4 font-mono text-[10px] text-cyan-100/60">
              <div className="flex justify-between items-center">
                <span className="uppercase tracking-widest text-[9px] text-cyan-500/50">Jurisdiction</span>
                <span className="text-white/90 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900/30 uppercase">{selectedNode.region}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="uppercase tracking-widest text-[9px] text-cyan-500/50">Active Stake (Real)</span>
                <span className="text-emerald-400 text-[11px]">${selectedNode.stakeUsd.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="uppercase tracking-widest text-[9px] text-cyan-500/50">Latency</span>
                <span className="text-cyan-300">{selectedNode.cpuMs.toFixed(3)} ms</span>
              </div>
              
              {/* Connection Pool Meter */}
              <div className="space-y-2 bg-[#03070c]/50 p-3 rounded-lg border border-cyan-900/20">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-500/50 uppercase tracking-widest text-[8px]">sqlx::Pool Utilization</span>
                  <span className={`${selectedNode.poolUtilization > 80 ? "text-amber-400" : "text-cyan-400"}`}>{selectedNode.poolUtilization}%</span>
                </div>
                <div className="w-full bg-[#0b1219] h-1.5 rounded-full overflow-hidden border border-cyan-900/30">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${selectedNode.status === "CHALLENGED" ? "bg-rose-500" : selectedNode.poolUtilization > 80 ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]"}`} 
                    style={{ width: `${selectedNode.poolUtilization}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-cyan-900/20">
                <span className="uppercase tracking-widest text-[9px] text-cyan-500/50">Tenant Namespace Lock</span>
                <span className="text-indigo-300 max-w-[140px] truncate bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-500/20">
                  {selectedNode.tenantLock}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#080d15]/50 border border-cyan-900/30 rounded-2xl p-5 flex items-center justify-center text-cyan-500/50 text-xs italic font-mono h-[280px]">
            No live nodes connected to network.
          </div>
        )}

        {/* Live Reactor Button Deck */}
        <div className="p-5 bg-gradient-to-br from-[#080d15] to-[#04070a] border border-cyan-900/30 rounded-2xl relative space-y-5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-2 font-sans font-medium text-[13px] text-white/90 border-b border-cyan-900/20 pb-3">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Interactive Protocol Probes</span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={triggerStorm}
              disabled={isActiveStorm}
              className="w-full py-3.5 bg-gradient-to-r from-amber-900/40 to-amber-600/20 hover:from-amber-800/50 hover:to-amber-500/30 disabled:opacity-50 text-amber-200 border border-amber-500/30 hover:border-amber-400/50 rounded-xl font-mono text-[10px] tracking-widest transition-all duration-300 uppercase flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:animate-pulse" />
              <span>{isActiveStorm ? "Consensus Flooding..." : "Request Escrow Probe"}</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={triggerAttestationChallenge}
                className="py-3 px-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 rounded-xl border border-rose-900/50 hover:border-rose-500/40 transition-all duration-300 flex flex-col items-center justify-center gap-1.5 group"
                title="Requests a backend challenge for the selected node when the route is authorized"
              >
                <Flame className="w-4 h-4 text-rose-500 group-hover:animate-bounce shadow-[0_0_10px_rgba(244,63,94,0.2)] rounded-full" />
                <span className="text-[9px] font-mono uppercase tracking-widest">Challenge Attest</span>
              </button>

              <button
                onClick={toggleSafetyGuard}
                className={`py-3 px-2 rounded-xl border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 font-mono text-[9px] uppercase tracking-widest ${
                  safetyGuardActive 
                    ? "bg-emerald-950/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/30 hover:border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.05)]" 
                    : "bg-[#0b1219]/80 text-cyan-500/40 border-cyan-900/30 hover:bg-[#0b1219]"
                }`}
              >
                <Lock className={`w-4 h-4 ${safetyGuardActive ? "text-emerald-400" : "text-cyan-700"}`} />
                <span>RLS: {safetyGuardActive ? "ARMED" : "OFF"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Swarm Event trace feed */}
        <div className="bg-gradient-to-b from-[#0b1219]/90 to-[#03070c]/90 border border-cyan-900/30 rounded-2xl p-4 flex-1 flex flex-col min-h-[160px] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-cyan-900/20 pb-3 mb-3">
            <span className="text-[9px] text-cyan-100/50 font-mono uppercase tracking-[0.2em] flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              x402 Evidence Ledger
            </span>
            <span className="text-[8px] bg-indigo-950/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded uppercase tracking-widest animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.2)]">
              Anchor RLS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1.5 space-y-2 custom-scrollbar">
            {ledgerFeed.length === 0 ? (
               <div className="flex h-full items-center justify-center text-[10px] font-mono text-cyan-500/30 italic">No ledger transactions recorded.</div>
            ) : (
              ledgerFeed.map((tx) => (
                <div 
                  key={tx.id} 
                  className="p-3 bg-[#03070c]/60 border border-cyan-900/20 hover:border-cyan-700/40 rounded-lg flex items-center justify-between transition-colors duration-300 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-medium text-white/90 text-xs">{tx.tenant}</span>
                      <span className="text-[9px] text-cyan-500/40 font-mono tracking-wider">({tx.id})</span>
                    </div>
                    <span className="text-[9px] text-cyan-100/30 block font-mono">Proposer: {tx.proposer}</span>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span className={`block font-mono text-[11px] tracking-wide ${tx.status === "SLASHED" ? "text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.3)]" : tx.status === "ESCROWED" ? "text-amber-400" : "text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]"}`}>
                      ${tx.amount.toFixed(6)}
                    </span>
                    <span className="text-[8px] text-cyan-500/30 font-mono group-hover:text-cyan-500/50 transition-colors">{tx.signature}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
      
      {/* Global CSS overrides for this component */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes dash {
          to { stroke-dashoffset: -32; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(8, 145, 178, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(8, 145, 178, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(8, 145, 178, 0.4);
        }
      `}} />
    </div>
  );
}
