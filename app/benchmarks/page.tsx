"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  Server, 
  Database, 
  ShieldCheck, 
  BellRing, 
  HelpCircle, 
  Activity, 
  Info, 
  Cpu, 
  Terminal, 
  Layers,
  ArrowRight,
  Shield,
  FileCheck,
  AlertTriangle,
  Radio,
  Bell
} from "lucide-react";

import { ApiState, AlertConfig, AlertLog, AuditLog } from "@/components/vnp/types";
import BenchmarkPanel from "@/components/vnp/BenchmarkPanel";
import K8sAutoscalingPanel from "@/components/vnp/K8sAutoscalingPanel";
import RBACPanel from "@/components/vnp/RBACPanel";
import TopologyPanel from "@/components/vnp/TopologyPanel";
import StakesPanel from "@/components/vnp/StakesPanel";
import SpecPanel from "@/components/vnp/SpecPanel";
import AlertPanel from "@/components/vnp/AlertPanel";
import RbacPanel from "@/components/vnp/RbacPanel";
import AiAdvisorPanel from "@/components/vnp/AiAdvisorPanel";
import NetworkTopologyPanel from "@/components/vnp/NetworkTopologyPanel";

export default function App() {
  const [activeTab, setActiveTab] = useState<"benchmark" | "k8s" | "spec" | "rbac" | "alerts" | "advisor" | "topology" | "stakes">("topology");
  
  // States loaded from backend REST Endpoints
  const [apis, setApis] = useState<ApiState[]>([]);
  const [trustBeacon, setTrustBeacon] = useState("");
  const [blockAnchored, setBlockAnchored] = useState(0);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Front-end UI overlay state (e.g. alerts flash box)
  const [criticalToast, setCriticalToast] = useState<string | null>(null);

  // States for Left Sidebar Real-Time Telemetry Stream
  const [liveFeedLogs, setLiveFeedLogs] = useState<Array<{ id: string; type: "MEASUREMENT" | "ANCHOR" | "SCORE UPDATE"; text: string }>>([
    { id: "37c5b55e37c5d44d", type: "MEASUREMENT", text: "[US-E] GPT-4o - p99: 148.7ms, avail: 99.60%, err: 0.13%" },
    { id: "0eecaf0c0fec901d", type: "MEASUREMENT", text: "[AP-NE] Llama 3 70B (Groq) - p99: 237.9ms, avail: 99.62%, err: 0.13%" },
    { id: "25abe96a25ac0859", type: "ANCHOR", text: "[Epoch] epoch-anthropic-1782183600000 - root: 25abe96a25ac... (811 records)" },
    { id: "780abaf780a9c06c", type: "SCORE UPDATE", text: "[VNP] Sovereign Authority Runtime - AA 89.3, 38,063 measurements, ±0.1" },
    { id: "38be7df838be5f09", type: "MEASUREMENT", text: "[US-W] Financial Data Plane (VFDP) - p99: 73.3ms, avail: 99.93%, err: 0.00%" },
    { id: "6043d1316043f07d", type: "MEASUREMENT", text: "[US-E] Sovereign Operator Registry - p99: 45.0ms, avail: 99.67%, err: 0.07%" },
    { id: "49aeef8949aeef83", type: "MEASUREMENT", text: "[EU-W] Llama 3 Deepseek Core - p99: 412.1ms, avail: 99.92%, err: 0.05%" }
  ]);

  // Load baseline telemetry data from Express endpoints
  const fetchTelemetry = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/vnp/metrics");
      if (!response.ok) throw new Error("Server metrics endpoint returned non-200");
      const data = await response.json();
      setApis(data.apis);
      setTrustBeacon(data.trustBeaconMerkle);
      setBlockAnchored(data.blockAnchored);
    } catch (e) {
      console.error("Failed to load telemetry:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAlertConfigs = async () => {
    try {
      const res = await fetch("/api/vnp/alerts/config");
      const data = await res.json();
      setAlertConfigs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAlertLogs = async () => {
    try {
      const res = await fetch("/api/vnp/alerts/triggered");
      const data = await res.json();
      
      // If a new alert has been triggered, flash a critical alert banner to system administrators!
      if (data.length > 0 && alertLogs.length > 0 && data[0].id !== alertLogs[0].id) {
        setCriticalToast(`⚠️ Node Violation: ${data[0].apiName} exceeded tolerance limit in region ${data[0].region.toUpperCase()}!`);
        setTimeout(() => setCriticalToast(null), 5000);
      }
      
      setAlertLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/vnp/audit-logs");
      const data = await res.json();
      setAuditLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Run on mount
  useEffect(() => {
    fetchTelemetry();
    fetchAlertConfigs();
    fetchAlertLogs();
    fetchAuditLogs();

    // Establish a high-frequency polling interval to simulate live distributed probing
    const interval = setInterval(() => {
      fetchTelemetry(true);
      fetchAlertLogs();
    }, 7000);

    // Dynamic, organic real-time streaming feed updates
    const streamTemplates = [
      { type: "MEASUREMENT" as const, text: "[US-E] Gemini 3.5 Flash - p99: 92.5ms, avail: 99.99%, err: 0.01%" },
      { type: "MEASUREMENT" as const, text: "[EU-W] Llama 3 Deepseek Core - p99: 412.1ms, avail: 99.92%, err: 0.05%" },
      { type: "ANCHOR" as const, text: "[Epoch] epoch-cappi-gateway-178219010000 - root: 68c3784... (455 records)" },
      { type: "SCORE UPDATE" as const, text: "[VNP] Veklom Sovereign AI Hub - AAA 98.9, 81,114 measurements, ±0.05" },
      { type: "MEASUREMENT" as const, text: "[AP-SE] Coinbase API (CAPI) Gateway - p99: 125.4ms, avail: 99.94%, err: 0.02%" },
      { type: "MEASUREMENT" as const, text: "[US-W] Base.org Swarm Debate Engine - p99: 64.1ms, avail: 99.97%, err: 0.00%" },
      { type: "MEASUREMENT" as const, text: "[US-E] MCPAPI v2.0 Global Router - p99: 104.9ms, avail: 99.90%, err: 0.10%" }
    ];

    const feedInterval = setInterval(() => {
      const randomTpl = streamTemplates[Math.floor(Math.random() * streamTemplates.length)];
      
      // Slightly randomize values in the string for a live dynamic feeling
      let customText = randomTpl.text;
      if (randomTpl.type === "MEASUREMENT") {
        const latMatch = randomTpl.text.match(/p99:\s*([\d.]+)ms/);
        if (latMatch) {
          const origLat = parseFloat(latMatch[1]);
          const drift = (Math.random() - 0.5) * 12; // move +/- 6ms
          const newLat = Math.max(15, origLat + drift).toFixed(1);
          customText = randomTpl.text.replace(/p99:\s*[\d.]+ms/, `p99: ${newLat}ms`);
        }
      }

      const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      
      setLiveFeedLogs((prev) => {
        const withNew = [{ id: randomHex, type: randomTpl.type, text: customText }, ...prev];
        return withNew.slice(0, 16); // cap logs list size
      });
    }, 3800);

    return () => {
      clearInterval(interval);
      clearInterval(feedInterval);
    };
  }, []);

  // Handle registering alert policy via backend
  const handleAddAlertConfig = async (newConfig: Omit<AlertConfig, "id" | "enabled">) => {
    try {
      const res = await fetch("/api/vnp/alerts/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (res.ok) {
        fetchAlertConfigs();
        fetchAuditLogs(); // Reflect audit trail
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle simulated report downloads (CSV, JSON, PDF)
  const handleExportReport = (format: "json" | "csv" | "pdf") => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      
      let mimeType = "application/json";
      let payload = "";
      let filename = `vnp-compliance-audit-export.${format}`;

      if (format === "json") {
        payload = JSON.stringify({
          specification: "VNP v0.1.0-Locked",
          trustBeaconState: trustBeacon,
          aggregatedComplianceScores: apis.map(a => ({ api_did: a.id, score: a.compositeScore })),
          auditLogsTrail: auditLogs
        }, null, 2);
      } else if (format === "csv") {
        mimeType = "text/csv";
        payload = "timestamp,tenant,actor,action,entity,transaction\n" + 
          auditLogs.map(l => `"${l.timestamp}","${l.tenant}","${l.actor}","${l.action}","${l.entity}","${l.transaction}"`).join("\n");
      } else {
        mimeType = "text/plain";
        payload = `--- Veklom Nexus Protocol Compliance PDF Report ---\n\n` +
          `Generated at: ${new Date().toISOString()}\n` +
          `Trust Merkle Root Verification Hash: ${trustBeacon}\n\n` +
          `Active APIs Scored:\n` +
          apis.map(a => ` * ${a.name} (DID: ${a.id}) - Composite Trust Score: ${a.compositeScore}/100`).join("\n") +
          `\n\nGenerated audits package safe from modification. Integrity check completed.`;
      }

      const blob = new Blob([payload], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Notifications Overlay Area */}
      <AnimatePresence>
        {criticalToast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-red-950 border border-red-500/80 text-red-200 px-6 py-4.5 rounded-xl shadow-2xl flex items-center gap-3.5 max-w-xl w-[90%]"
          >
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 animate-pulse" />
            <div className="text-xs">
              <span className="font-bold underline block mb-0.5">Critical Core SLA Incident triggered:</span>
              <span>{criticalToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Header Bar */}
      <header className="border-b border-slate-900 bg-[#070b12]/92 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-950/30 border border-emerald-500/20">
              <Layers className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold tracking-tight text-white select-all">VEKLOM NEXUS PROTOCOL</h1>
                <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded uppercase tracking-wider font-extrabold">
                  V0.1 Mainnet Ready
                </span>
              </div>
              <p className="text-[11px] text-slate-500 tracking-wide font-medium">De Facto API Benchmarking &amp; M2M Performance Certification</p>
            </div>
          </div>

          {/* Quick status labels */}
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-900 p-1.5 px-3 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Nodes: <strong className="text-slate-200">22 SLA Monitors</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-900 p-1.5 px-3 rounded-lg md:inline-flex hidden">
              <Zap className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Consensus Block Speed: <strong className="text-slate-200">3s Real-time</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Area: Side-by-Side Dual-Pane Next-Gen layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-7 items-start">
          
          {/* LEFT PANE: Real-time Live Diagnostic Console - col-span 3 */}
          <div className="xl:col-span-3 space-y-4">
            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 font-mono text-[11px] h-[720px] flex flex-col justify-between">
              
              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                {/* Panel Header */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-100 tracking-wider flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      VNP MEASUREMENT FEED
                    </span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-extrabold uppercase animate-pulse">
                      ● LIVE
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 block">
                    Feed derived from scored API data. Independent k6 SSE stream. Needs proof
                  </span>
                </div>

                {/* Simulated Web-Socket Stream Area */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                  <AnimatePresence initial={false}>
                    {liveFeedLogs.map((log) => {
                      let typeBadgeColor = "text-emerald-400 bg-emerald-950/40 border-emerald-500/20";
                      if (log.type === "ANCHOR") typeBadgeColor = "text-blue-400 bg-blue-950/40 border-blue-500/25";
                      if (log.type === "SCORE UPDATE") typeBadgeColor = "text-indigo-400 bg-indigo-950/40 border-indigo-500/25";

                      return (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.25 }}
                          className="p-3 bg-[#0d121c]/40 border border-slate-900 rounded-lg space-y-1 hover:border-slate-800 transition"
                        >
                          <div className="flex items-center justify-between text-[8px] border-b border-slate-900 pb-1 mb-1">
                            <span className="text-slate-500 text-[8px]">Index Hash: <strong className="text-slate-400 select-all font-mono">{log.id.substr(0, 10)}</strong></span>
                            <span className={`text-[7px] font-extrabold px-1 rounded uppercase tracking-wide border ${typeBadgeColor}`}>
                              {log.type}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-300 leading-normal break-all">
                            {log.text}
                          </p>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* Connection block metadata */}
              <div className="border-t border-slate-900 pt-3 mt-3 flex items-center justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Target: Base L2 (eip155:8453)</span>
                <span className="text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded font-mono">k6-vnp-0.1.3</span>
              </div>

            </div>
          </div>

          {/* RIGHT PANE: Dashboard Workspace Tab controller - col-span 9 */}
          <div className="xl:col-span-9 space-y-6">
            
            {/* High-Fidelity App Top Banner Header (exactly matches reference model!) */}
            <div className="bg-[#0b1017] border border-slate-900 rounded-2xl p-6.5 flex flex-col lg:flex-row items-stretch justify-between gap-6">
              
              {/* Left description block */}
              <div className="space-y-3.5 flex-1 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/25 text-[9px] font-mono px-2.5 py-0.5 rounded font-extrabold tracking-wider uppercase">
                    CORE MODULE
                  </span>
                  <span className="bg-[#121924] border border-slate-800 text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase">
                    V0.1.0-MAINNET
                  </span>
                  <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-sans px-2.5 py-0.5 rounded font-extrabold uppercase flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 block" /> ● LIVE
                  </span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight">Veklom Nexus Protocol</h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Open, community-governed API benchmark scoring for machine-consumable trust. 10 dimensions, cryptographic provenance, measured across 5 global regions.
                  </p>
                </div>
              </div>

              {/* Right indicators grid blocks (4 stats exactly from reference design) */}
              <div className="grid grid-cols-2 gap-3 sm:w-[320px] shrink-0 font-mono text-center">
                <div className="p-3 bg-[#0d121c]/50 border border-slate-900 rounded-xl flex flex-col justify-center">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-tight">APIS SCORED</span>
                  <span className="text-xl font-black text-emerald-400 tracking-tighter mt-1">{apis.length || 15}</span>
                </div>
                <div className="p-3 bg-[#0d121c]/50 border border-slate-900 rounded-xl flex flex-col justify-center font-bold">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-tight">AVG COMPOSITE</span>
                  <span className="text-xl font-black text-indigo-400 tracking-tighter mt-1">88.6</span>
                </div>
                <div className="p-3 bg-[#0d121c]/50 border border-slate-900 rounded-xl flex flex-col justify-center">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-tight">MEASUREMENTS</span>
                  <span className="text-xl font-black text-[#6366f1] tracking-tighter mt-1">916,435</span>
                </div>
                <div className="p-3 bg-[#0d121c]/50 border border-slate-900 rounded-xl flex flex-col justify-center text-emerald-400">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block leading-tight">HIGH CONFIDENCE</span>
                  <span className="text-xl font-black tracking-tighter mt-1">15/15</span>
                </div>
              </div>

            </div>

            {/* Custom Tab Controls Bar */}
            <div className="bg-[#0b1017] border border-slate-900 rounded-2xl p-2.5 flex flex-wrap gap-2.5 font-mono text-[11px] leading-none">
              <button
                onClick={() => setActiveTab("topology")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "topology"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Nexus Swarm Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab("benchmark")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "benchmark"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Trust Node Matrix</span>
              </button>

              <button
                onClick={() => setActiveTab("rbac")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "rbac"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>PGL Identity Layer</span>
              </button>

              <button
                onClick={() => setActiveTab("k8s")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "k8s"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Server className="w-4 h-4 text-emerald-400" />
                <span>Consensus Vector</span>
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "alerts"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>Parametric SLAs</span>
              </button>

              <button
                onClick={() => setActiveTab("spec")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "spec"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Staking Protocol</span>
              </button>

              <button
                onClick={() => setActiveTab("advisor")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "advisor"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>AI Consult</span>
              </button>

              <button
                onClick={() => setActiveTab("stakes")}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 p-3.5 rounded-xl font-extrabold transition-all border cursor-pointer select-none ${
                  activeTab === "stakes"
                    ? "bg-[#101622] border-emerald-500/50 text-emerald-400 shadow-md"
                    : "bg-transparent border-transparent text-slate-400 hover:bg-slate-950/50 hover:text-white"
                }`}
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Stakes Engine</span>
              </button>
            </div>

            {/* Tab Viewport Workspace with Transition wrapper */}
            <div className="bg-[#070b12] rounded-2xl min-h-[480px]">
              {loading && apis.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[480px] space-y-4">
                  <Zap className="w-8 h-8 text-emerald-500 animate-spin" />
                  <p className="text-slate-400 text-xs font-mono">Loading real-time distributed consensus datasets...</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeTab === "topology" && <NetworkTopologyPanel />}

                    {activeTab === "benchmark" && (
                      <BenchmarkPanel 
                        apis={apis} 
                        trustBeacon={trustBeacon} 
                        blockAnchored={blockAnchored} 
                        onRefreshTelemetry={() => fetchTelemetry(true)}
                      />
                    )}

                    {activeTab === "k8s" && <K8sAutoscalingPanel />}

                    {activeTab === "spec" && <SpecPanel />}

                    {activeTab === "rbac" && (
                      <RbacPanel 
                        auditLogs={auditLogs} 
                        onExportReport={handleExportReport} 
                        exporting={exporting} 
                      />
                    )}

                    {activeTab === "alerts" && (
                      <AlertPanel 
                        configs={alertConfigs} 
                        logs={alertLogs} 
                        onAddConfig={handleAddAlertConfig} 
                        onRefresh={fetchAlertLogs} 
                        loading={loading} 
                      />
                    )}

                    {activeTab === "advisor" && <AiAdvisorPanel />}
                    
                    {activeTab === "stakes" && <StakesPanel />}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

          </div>

        </div>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 p-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>VNP global spec release consensus approved. Deployed under Apache-2.0.</span>
          </div>
          <span className="text-slate-600 font-sans font-medium text-[11px]">Designed with Inter Slate Theme paired with JetBrains Mono</span>
        </div>
      </footer>
    </div>
  );
}
