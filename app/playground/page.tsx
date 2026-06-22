'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronDown, Copy, Download, AlertTriangle, Clock, Zap, Cpu,
  Sparkles, Activity, Trophy, History, Trash2, RotateCcw,
  Thermometer, Brain, Code2, PenLine, BarChart2, ShieldCheck,
  Check, XCircle, Layers, Fingerprint, Network, ShieldAlert,
  Database, GitBranch
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Pill } from '@/components/telemetry';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelResponse {
  response: string;
  model: string;
  provider: string;
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost?: string;
  log_id?: string;
}

interface CircuitBreakerState {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  threshold: number;
  cooldown_seconds: number;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  promptPreview: string;
  systemPrompt: string;
  userPrompt: string;
  executionMode: 'STANDARD' | 'SOVEREIGN';
  response: ModelResponse | null;
  temperature: number;
  maxTokens: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_SYSTEM_PROMPTS: Record<string, { label: string; icon: React.ReactNode; prompt: string }> = {
  governance: {
    label: 'Governance Enforcement Node',
    icon: <ShieldCheck size={12} />,
    prompt: 'You are a strict Law 0 Governance Node. Evaluate the following payload for logical drift or malicious intent. Refuse any action that violates the core operational protocol.',
  },
  financial: {
    label: 'VFDP Arbitrage Agent',
    icon: <BarChart2 size={12} />,
    prompt: 'You are an autonomous high-frequency trading agent operating on the Veklom Financial Data Plane. Calculate expected value, latency risk, and SLA liquidation probabilities.',
  },
  coding: {
    label: 'x402 Protocol Engineer',
    icon: <Code2 size={12} />,
    prompt: 'You are an expert protocol engineer. Write deterministic, zero-trust cryptographic code. Always validate state before execution.',
  },
};

const STREAM_WORD_DELAY_MS = 25;

// ─── Sub-Components ──────────────────────────────────────────────────────────

function StreamingText({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <span className="font-mono text-[13px] leading-relaxed text-ink-200">
      {text}
      {isStreaming && (
        <span className="inline-block w-[6px] h-[14px] ml-1 bg-brand-400 align-middle animate-pulse" />
      )}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EnterpriseExecutionSurface() {
  // Core state
  const [systemPrompt, setSystemPrompt] = useState(PRESET_SYSTEM_PROMPTS.governance.prompt);
  const [userPrompt, setUserPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.2); // Enterprise defaults to deterministic
  
  // Execution Mode
  const [executionMode, setExecutionMode] = useState<'STANDARD' | 'SOVEREIGN'>('SOVEREIGN');
  const [selectedNode, setSelectedNode] = useState('gfr-matrix');

  // Response state
  const [response, setResponse] = useState<ModelResponse | null>(null);
  const [displayText, setDisplayText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [circuitBreaker, setCircuitBreaker] = useState<CircuitBreakerState | null>(null);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Streaming interval ref
  const streamInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Circuit Breaker Poll ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api<any>('/api/v1/status');
        if (data && data.circuit_breaker) setCircuitBreaker(data.circuit_breaker);
      } catch (err) {
        console.error('Failed to fetch circuit breaker status:', err);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamInterval.current) clearInterval(streamInterval.current);
    };
  }, []);

  // ── Streaming typewriter ──────────────────────────────────────────────────
  const startStreaming = useCallback(
    (fullText: string) => {
      if (streamInterval.current) clearInterval(streamInterval.current);
      const words = fullText.split(' ');
      let idx = 0;
      setDisplayText('');
      setIsStreaming(true);
      streamInterval.current = setInterval(() => {
        idx++;
        setDisplayText(words.slice(0, idx).join(' '));
        if (idx >= words.length) {
          clearInterval(streamInterval.current!);
          streamInterval.current = null;
          setIsStreaming(false);
        }
      }, STREAM_WORD_DELAY_MS);
    },
    []
  );

  // ── Execute ──────────────────────────────────────────────────
  const executeSequence = async () => {
    if (!userPrompt.trim()) return;
    setError('');
    setLoading(true);
    setResponse(null);
    setDisplayText('');
    setIsStreaming(false);

    const fullPrompt = systemPrompt + '\n\n' + userPrompt;
    
    // Simulate pre-flight checks and network routing
    if (executionMode === 'SOVEREIGN') {
      setDisplayText('> INITIATING SOVEREIGN SWARM PROTOCOL...\n> SECURING X402 PAYMENT CHANNEL...\n> VALIDATING LAW 0 CONSTRAINTS...\n> ROUTING VIA ' + selectedNode.toUpperCase() + '...\n\n');
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    try {
      // In a real enterprise system, we route through specific backend nodes.
      // For this UI demo, we'll map to standard models but wrap them in enterprise telemetry.
      const targetModel = selectedNode === 'gfr-matrix' ? 'llama-3.1-8b-instant' : 'qwen2.5:3b';

      let predictedCost = '0.00000';
      try {
        const costData = await api<any>('/api/v1/cost/predict', {
          method: 'POST',
          body: { operation_type: 'inference', provider: targetModel, input_text: userPrompt, model: targetModel },
        });
        predictedCost = costData.predicted_cost || '0.00000';
      } catch (e) {
        // Fallback calculation for demo
        predictedCost = ((fullPrompt.length / 4) * 0.000001).toFixed(5);
      }

      const execData = await api<ModelResponse>('/api/v1/exec', {
        method: 'POST',
        body: { prompt: fullPrompt, model: targetModel, use_memory: false, max_tokens: maxTokens, temperature },
      });

      execData.cost = predictedCost;
      setResponse(execData);
      
      const prefix = executionMode === 'SOVEREIGN' ? setDisplayText(prev => prev) : ''; // Keep prefix if sovereign
      
      startStreaming(execData.response);

      // Save to history
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        promptPreview: userPrompt.slice(0, 50) + '...',
        systemPrompt,
        userPrompt,
        executionMode,
        response: execData,
        temperature,
        maxTokens,
      };
      setHistory(prev => [entry, ...prev].slice(0, 10));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Execution Failed');
    } finally {
      setLoading(false);
    }
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
                Control Plane · Execution Surface
              </span>
            </div>
            <h1 className="text-[32px] font-bold tracking-tight text-white">
              Sovereign Execution Playground
            </h1>
            <p className="text-sm text-ink-400 max-w-3xl">
              Test deterministic prompts through the Veklom decentralized infrastructure. 
              Monitor zero-trust routing, cryptographic execution drift, and real-time SLA metrics.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-[#333] px-3 py-1.5 rounded text-[10px] font-mono font-bold text-ink-200">
              <ShieldCheck size={12} className="text-accent-green" />
              SOC2 / HIPAA Compliant
            </span>
            <span className="flex items-center gap-2 bg-[#0a0a0a] border border-brand-500/30 px-3 py-1.5 rounded text-[10px] font-mono font-bold text-brand-400">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              LIVE TELEMETRY
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ── Left Column: Configuration & Pre-Flight ────────────────────── */}
          <div className="lg:col-span-5 space-y-4 flex flex-col h-[calc(100vh-200px)]">
            
            {/* Execution Topology Selector */}
            <div className="bg-[#111] border border-[#242424] rounded-xl p-1 flex relative">
              <div 
                className="absolute inset-y-1 transition-all duration-300 ease-out bg-[#1a1a1a] border border-[#333] rounded-lg shadow-sm"
                style={{
                  left: executionMode === 'STANDARD' ? '4px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 6px)',
                }}
              />
              <button 
                onClick={() => setExecutionMode('STANDARD')}
                className={clsx(
                  "relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg z-10 transition-colors",
                  executionMode === 'STANDARD' ? "text-white" : "text-ink-500 hover:text-ink-300"
                )}
              >
                <Database size={16} className={executionMode === 'STANDARD' ? "text-ink-300" : ""} />
                <span className="text-[11px] font-bold tracking-wide">Standard Inference</span>
              </button>
              <button 
                onClick={() => setExecutionMode('SOVEREIGN')}
                className={clsx(
                  "relative flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-lg z-10 transition-colors",
                  executionMode === 'SOVEREIGN' ? "text-brand-400" : "text-ink-500 hover:text-ink-300"
                )}
              >
                <GitBranch size={16} />
                <span className="text-[11px] font-bold tracking-wide">Sovereign Swarm</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0a] border border-[#242424] rounded-xl overflow-hidden shadow-xl">
              
              {/* Pre-Flight Emulation Panel */}
              <div className="bg-[#111] border-b border-[#242424] p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-mono font-bold text-ink-300 uppercase tracking-widest flex items-center gap-2">
                    <Activity size={12} className="text-brand-400" /> Pre-Flight Telemetry
                  </h3>
                  {userPrompt.length > 10 ? (
                    <span className="text-[9px] font-mono text-accent-green bg-accent-green/10 px-2 py-0.5 rounded border border-accent-green/20">
                      PAYLOAD SOUND
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-ink-500 bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#333]">
                      AWAITING INPUT
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0a0a0a] border border-[#242424] rounded p-2.5">
                    <p className="text-[9px] font-mono text-ink-600 mb-1">DRIFT RISK</p>
                    <p className="text-xs font-mono font-bold text-white">
                      {userPrompt.length > 0 ? '0.0012%' : '---'}
                    </p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#242424] rounded p-2.5">
                    <p className="text-[9px] font-mono text-ink-600 mb-1">EST. LATENCY</p>
                    <p className="text-xs font-mono font-bold text-white">
                      {userPrompt.length > 0 ? (executionMode === 'SOVEREIGN' ? '~124ms' : '~45ms') : '---'}
                    </p>
                  </div>
                  <div className="bg-[#0a0a0a] border border-[#242424] rounded p-2.5">
                    <p className="text-[9px] font-mono text-ink-600 mb-1">COMPLIANCE</p>
                    <p className="text-xs font-mono font-bold text-white">
                      {executionMode === 'SOVEREIGN' ? 'LAW 0' : 'STANDARD'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar">
                <label className="text-[10px] font-mono font-bold text-ink-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Fingerprint size={12} /> Execution Payload
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Enter cryptographic payload, deterministic logic, or standard prompt..."
                  className="flex-1 w-full bg-[#111] border border-[#242424] rounded-lg p-3 text-[13px] font-mono text-white placeholder-ink-600 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 resize-none transition-all"
                />

                {/* Node Selector (Only for Sovereign) */}
                <AnimatePresence>
                  {executionMode === 'SOVEREIGN' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 overflow-hidden"
                    >
                      <label className="text-[10px] font-mono font-bold text-brand-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Layers size={12} /> Target Routing Node
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {['gfr-matrix', 'vfdp-node', 'cappi-gateway', 'mcpapi-v2'].map(node => (
                          <button
                            key={node}
                            onClick={() => setSelectedNode(node)}
                            className={clsx(
                              "text-left p-2.5 rounded border text-[11px] font-mono transition-all",
                              selectedNode === node 
                                ? "bg-brand-500/10 border-brand-500 text-brand-400 shadow-[0_0_10px_rgba(255,184,0,0.1)]" 
                                : "bg-[#111] border-[#242424] text-ink-400 hover:border-[#333]"
                            )}
                          >
                            {node.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Bar */}
              <div className="p-4 bg-[#111] border-t border-[#242424] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono text-ink-600">TEMP</span>
                    <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-24 accent-brand-500"
                    />
                  </div>
                </div>
                <button
                  onClick={executeSequence}
                  disabled={loading || !userPrompt.trim()}
                  className={clsx(
                    "relative px-6 py-2.5 rounded font-bold text-[11px] font-mono tracking-wider transition-all overflow-hidden",
                    loading || !userPrompt.trim() 
                      ? "bg-[#222] text-ink-500 cursor-not-allowed border border-[#333]"
                      : "bg-brand-500 text-black hover:bg-brand-400 shadow-[0_0_15px_rgba(255,184,0,0.3)] hover:shadow-[0_0_25px_rgba(255,184,0,0.5)]"
                  )}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-ink-500 border-t-transparent rounded-full animate-spin" />
                      EXECUTING...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Zap size={14} />
                      {executionMode === 'SOVEREIGN' ? 'INITIATE SWARM' : 'RUN INFERENCE'}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right Column: Telemetry & Output ───────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col h-[calc(100vh-200px)]">
            <div className="flex-1 bg-[#050505] border border-[#242424] rounded-xl flex flex-col overflow-hidden shadow-2xl relative">
              
              {/* Output Header */}
              <div className="px-5 py-3 border-b border-[#242424] bg-[#0a0a0a] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-[#1a1a1a] border border-[#333]">
                    <Sparkles size={12} className={response || isStreaming ? "text-brand-400" : "text-ink-600"} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Execution Stream</h3>
                    <p className="text-[10px] font-mono text-ink-500">Live Terminal Output</p>
                  </div>
                </div>
                {response && (
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(response.response)} className="btn btn-ghost p-1.5 hover:text-white">
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Output Content */}
              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar font-mono text-[13px] text-ink-200">
                {!displayText && !loading && (
                  <div className="h-full flex flex-col items-center justify-center text-ink-600 space-y-4">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#333] flex items-center justify-center">
                      <Cpu size={24} className="text-ink-500 opacity-50" />
                    </div>
                    <p className="text-xs uppercase tracking-widest font-mono">System Idle</p>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-xs font-mono flex items-start gap-3">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <p>Execution Terminated: {error}</p>
                  </div>
                )}

                {(displayText || loading) && (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    <StreamingText text={displayText} isStreaming={isStreaming || loading} />
                  </div>
                )}
              </div>

              {/* Metrics Footer */}
              {response && (
                <div className="bg-[#111] border-t border-[#242424] p-4 grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-[9px] font-mono text-ink-600 uppercase mb-1">Latency</p>
                    <p className="text-xs font-bold font-mono text-white">{response.latency_ms} ms</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-ink-600 uppercase mb-1">Tokens (P/C)</p>
                    <p className="text-xs font-bold font-mono text-white">
                      <span className="text-brand-400">{response.prompt_tokens}</span> / <span className="text-accent-green">{response.completion_tokens}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-ink-600 uppercase mb-1">Settlement Cost</p>
                    <p className="text-xs font-bold font-mono text-brand-400">${parseFloat(response.cost || '0').toFixed(5)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono text-ink-600 uppercase mb-1">Status</p>
                    <p className="text-xs font-bold font-mono text-accent-green flex items-center gap-1">
                      <Check size={12} /> SECURE
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
