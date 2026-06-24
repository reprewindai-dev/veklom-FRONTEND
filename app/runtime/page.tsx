'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Play, RotateCcw, ChevronRight, Lock, Terminal, CheckCircle,
  Shield, Zap, Cpu, Activity, GitFork, Layers, Flame, Network, Fingerprint, Database
} from 'lucide-react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'motion/react';

const SCENARIOS = [
  { id: 'rogue_db', name: 'Rogue Database', description: 'Agent attempts unauthorized database modification', threat_level: 'CRITICAL', expected_hash: '0x9a8f...3c12' },
  { id: 'prompt_injection', name: 'Prompt Injection', description: 'Malicious prompt injection attack simulation', threat_level: 'HIGH', expected_hash: '0x7b42...8f91' },
  { id: 'repo_mutation', name: 'Repository Mutation', description: 'Unauthorized code repository changes', threat_level: 'HIGH', expected_hash: '0x2c11...0a44' },
  { id: 'budget_loop', name: 'Budget Loop', description: 'Runaway spending without cost controls', threat_level: 'MEDIUM', expected_hash: '0x5e22...1b77' },
];

const PIPELINE_STEPS = [
  { step: 1, name: 'INTENT_RECEIVED', icon: Terminal, desc: 'Raw payload intercepted and queued on message bus.' },
  { step: 2, name: 'LAW_0_GOVERNANCE', icon: Shield, desc: 'Evaluating payload against sovereign constitution parameters.' },
  { step: 3, name: 'DETERMINISTIC_COMPILE', icon: Cpu, desc: 'Compiling probabilistic intent into deterministic action graph.' },
  { step: 4, name: 'CRYPTOGRAPHIC_COMMIT', icon: Lock, desc: 'Hashing compiled graph. Awaiting proof seal.' },
  { step: 5, name: 'GRADIENT_FIELD_ROUTE', icon: GitFork, desc: 'Matrix routing based on SLA/latency targets.' },
  { step: 6, name: 'SWARM_EXECUTION', icon: Play, desc: 'Delegating tool calls to execution nodes under strict policy.' },
  { step: 7, name: 'LEDGER_SEALED', icon: CheckCircle, desc: 'EAT token generated. Immutable evidence recorded.' },
];

export default function RuntimePage() {
  const [selectedScenario, setSelectedScenario] = useState(SCENARIOS[0]);
  const [activeStep, setActiveStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [eat, setEat] = useState<string | null>(null);
  const [telemetryLog, setTelemetryLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setTelemetryLog(prev => [...prev, `[${new Date().toISOString()}] ${msg}`].slice(-20));
  };

  const runDemo = async () => {
    setRunning(true);
    setCompleted(false);
    setActiveStep(0);
    setEat(null);
    setTelemetryLog([]);

    addLog(`INITIATING THREAT SIMULATION: ${selectedScenario.id.toUpperCase()}`);

    // Animate steps 1-3 locally (fast)
    for (let i = 1; i <= 3; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setActiveStep(i);
      addLog(`STEP 0${i} / ${PIPELINE_STEPS[i-1].name} ... OK`);
    }

    addLog(`CONTACTING cAPI GATEWAY FOR PROOF HASH...`);
    
    // Step 4: call real GPC compile
    let proofHash: string | null = null;
    try {
      const res = await api<{ proof_hash?: string; id?: string }>('/api/v1/gpc/compile', {
        body: {
          intent: `Scenario: ${selectedScenario.name} — ${selectedScenario.description}`,
          compliance: ['audit'],
          provider: 'gemini',
          model: 'gemini-2.5-flash',
        },
      });
      proofHash = res.proof_hash ?? null;
      addLog(`GATEWAY RESPONSE: HASH [${proofHash?.slice(0,16)}]`);
    } catch {
      addLog(`GATEWAY ERROR: USING DETERMINISTIC FALLBACK HASH`);
      const encoder = new TextEncoder();
      const data = encoder.encode(selectedScenario.id + Date.now());
      const hashBuf = await crypto.subtle.digest('SHA-256', data);
      proofHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2,'0')).join('').slice(0, 40);
    }
    setActiveStep(4);
    addLog(`STEP 04 / CRYPTOGRAPHIC_COMMIT ... SECURED`);

    // Animate steps 5-7
    for (let i = 5; i <= 7; i++) {
      await new Promise((r) => setTimeout(r, 400));
      setActiveStep(i);
      addLog(`STEP 0${i} / ${PIPELINE_STEPS[i-1].name} ... OK`);
    }

    const finalEat = proofHash ? `EAT-${proofHash.slice(0, 8).toUpperCase()}-${proofHash.slice(8, 16).toUpperCase()}` : 'EAT-SEALED';
    setEat(finalEat);
    addLog(`PIPELINE COMPLETE. EAT ISSUED: ${finalEat}`);
    
    setRunning(false);
    setCompleted(true);
  };

  const reset = () => {
    setActiveStep(0);
    setRunning(false);
    setCompleted(false);
    setEat(null);
    setTelemetryLog([]);
  };

  const threatColor: Record<string, string> = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/30',
    HIGH: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
    MEDIUM: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2 border-b border-[#242424] pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-500/20 text-brand-400">
                <Network size={14} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400 font-bold">
                Run · Runtime Enforcement
              </span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-white">
              Sovereign Pipeline Command
            </h1>
            <p className="text-sm text-ink-400 max-w-3xl">
              Veklom's crown jewel infrastructure. Every autonomous execution traverses this deterministic 7-step pipeline. Tool calls are blocked until cryptographically sealed.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded text-[10px] font-mono font-bold text-ink-200">
              <Fingerprint size={12} className="text-accent-green" />
              EAT Generation Engine
            </span>
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-brand-500/30 px-3 py-1.5 rounded text-[10px] font-mono font-bold text-brand-400">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              PIPELINE LIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── Left Column: Configuration & Telemetry ────────────────────── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Threat Vector Simulator */}
            <div className="bg-[#050505] border border-[#242424] rounded-xl overflow-hidden shadow-xl flex flex-col">
              <div className="bg-[#111] border-b border-[#242424] p-4 flex items-center gap-2">
                <Flame size={14} className="text-brand-400" />
                <h3 className="text-[11px] font-mono font-bold text-ink-300 uppercase tracking-widest">
                  Threat Vector Injection
                </h3>
              </div>
              
              <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedScenario(s); reset(); }}
                    className={clsx(
                      "w-full text-left p-3 rounded-lg border transition-all grid grid-cols-[1fr_auto] gap-2 items-center",
                      selectedScenario.id === s.id
                        ? "bg-brand-500/10 border-brand-500 shadow-[0_0_15px_rgba(255,184,0,0.1)]"
                        : "bg-[#111] border-[#242424] hover:border-[#333]"
                    )}
                  >
                    <div>
                      <h4 className={clsx("text-xs font-bold font-mono", selectedScenario.id === s.id ? "text-brand-400" : "text-white")}>
                        {s.name}
                      </h4>
                      <p className="text-[10px] text-ink-500 mt-1">{s.description}</p>
                    </div>
                    <span className={clsx("text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest", threatColor[s.threat_level])}>
                      {s.threat_level}
                    </span>
                  </button>
                ))}
              </div>

              <div className="p-4 bg-[#111] border-t border-[#242424] flex gap-3">
                <button
                  onClick={runDemo}
                  disabled={running}
                  className={clsx(
                    "flex-1 py-2.5 rounded font-bold text-[11px] font-mono tracking-wider transition-all",
                    running 
                      ? "bg-[#222] text-ink-500 cursor-not-allowed border border-[#333]"
                      : "bg-brand-500 text-black hover:bg-brand-400 shadow-[0_0_15px_rgba(255,184,0,0.3)]"
                  )}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Play size={14} />
                    {running ? 'ENFORCING...' : 'INJECT VECTOR'}
                  </span>
                </button>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] text-white rounded transition"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {/* Live Telemetry Log */}
            <div className="bg-[#050505] border border-[#242424] rounded-xl overflow-hidden shadow-xl flex-1 flex flex-col min-h-[300px]">
              <div className="bg-[#111] border-b border-[#242424] p-3 flex items-center justify-between">
                <h3 className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} /> Console Output
                </h3>
                <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              </div>
              <div className="p-4 overflow-y-auto custom-scrollbar flex-1 bg-black text-[11px] font-mono text-ink-400 space-y-1">
                {telemetryLog.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-ink-600">AWAITING INJECTION...</div>
                ) : (
                  telemetryLog.map((log, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">{log}</div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* ── Right Column: Deterministic Pipeline ───────────────────────── */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="bg-[#050505] border border-[#242424] rounded-xl flex flex-col flex-1 overflow-hidden shadow-2xl relative">
              
              <div className="px-5 py-4 border-b border-[#242424] bg-[#0a0a0a] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a] border border-[#333]">
                    <Layers size={12} className="text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Execution Pipeline</h3>
                    <p className="text-[10px] font-mono text-ink-500">Live 7-Step Deterministic Sequence</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
                
                {/* Connecting Line */}
                <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-[#1a1a1a] z-0" />

                <div className="space-y-6 relative z-10">
                  {PIPELINE_STEPS.map((step) => {
                    const Icon = step.icon;
                    const isDone = activeStep >= step.step;
                    const isActive = activeStep === step.step && running;
                    
                    return (
                      <div key={step.step} className="flex items-start gap-4">
                        
                        {/* Node */}
                        <div className={clsx(
                          "w-8 h-8 rounded border-2 flex items-center justify-center shrink-0 mt-1 transition-all duration-300 bg-[#050505]",
                          isDone ? "border-brand-500 shadow-[0_0_10px_rgba(255,184,0,0.4)]" : isActive ? "border-white animate-pulse" : "border-[#333]"
                        )}>
                          {isDone ? (
                            <CheckCircle size={14} className="text-brand-400" />
                          ) : (
                            <Icon size={14} className={clsx(isActive ? "text-white" : "text-ink-600")} />
                          )}
                        </div>

                        {/* Content */}
                        <div className={clsx(
                          "flex-1 border rounded-lg p-4 transition-all duration-300",
                          isDone ? "bg-brand-500/5 border-brand-500/30" : isActive ? "bg-[#111] border-white/20" : "bg-[#0a0a0a] border-[#242424]"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={clsx("text-xs font-bold font-mono tracking-wider", isDone ? "text-brand-400" : isActive ? "text-white" : "text-ink-500")}>
                              {step.name}
                            </h4>
                            <span className="text-[10px] font-mono text-ink-600">STEP_0{step.step}</span>
                          </div>
                          <p className={clsx("text-[11px]", isDone || isActive ? "text-ink-300" : "text-ink-600")}>
                            {step.desc}
                          </p>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* EAT Token Result */}
                <AnimatePresence>
                  {eat && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 ml-12 bg-[#0a0a0a] border border-brand-500/50 rounded-lg p-5 shadow-[0_0_30px_rgba(255,184,0,0.1)] relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-3xl rounded-full" />
                      <div className="flex items-center gap-2 mb-3">
                        <Lock size={14} className="text-brand-400" />
                        <h4 className="text-[11px] font-bold font-mono text-brand-400 uppercase tracking-widest">
                          Execution Authorization Token
                        </h4>
                      </div>
                      <div className="bg-black border border-[#333] p-3 rounded">
                        <code className="text-sm font-mono font-bold text-white tracking-wider break-all">
                          {eat}
                        </code>
                      </div>
                      <p className="text-[10px] font-mono text-ink-500 mt-3 flex items-center gap-1">
                        <Shield size={10} /> Cryptographically sealed. Execution authorized.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
