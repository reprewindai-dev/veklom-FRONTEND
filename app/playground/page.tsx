"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import {
  Play, Download, ChevronDown, ChevronUp, ShieldAlert, Cpu, CheckCircle,
  FlaskConical, Shield, Zap
} from 'lucide-react';

// Dynamically import Vanguard (it uses ethers + framer-motion, avoid SSR issues)
const VanguardPlayground = dynamic(
  () => import('@/components/terminal/components/VanguardPlayground'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-96 text-gray-500 animate-pulse font-mono text-sm">
      LOADING VANGUARD HYBRID GATEWAY...
    </div>
  )}
);

type ModelType = "ollama" | "groq" | "gemini";
type TabId = "compare" | "vanguard";

interface ExecutionResult {
  model: string;
  response: string;
  latency_ms: number;
  tokens: number;
  cost: number;
  error?: string;
}

const TABS: { id: TabId; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
  {
    id: "compare",
    label: "Model Compare",
    icon: FlaskConical,
    desc: "Side-by-side model comparison with Markdown rendering, cost prediction, and circuit breaker status."
  },
  {
    id: "vanguard",
    label: "Vanguard Gateway",
    icon: Shield,
    desc: "Full cognitive inline gateway — crew selection, threat injection, pipeline tracing, VNP SLA ledger."
  },
];

// ─── Model Comparison Tab ─────────────────────────────────────────────────────

function ModelCompareTab() {
  const [systemPrompt, setSystemPrompt] = useState("");
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [userPrompt, setUserPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);
  const [modelA, setModelA] = useState<ModelType>("ollama");
  const [modelB, setModelB] = useState<ModelType>("groq");
  const [resultA, setResultA] = useState<ExecutionResult | null>(null);
  const [resultB, setResultB] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [circuitBreakerTripped, setCircuitBreakerTripped] = useState(false);

  const handleRunBoth = async () => {
    if (!userPrompt.trim()) return;
    setIsRunning(true);
    setResultA(null);
    setResultB(null);
    setCircuitBreakerTripped(false);

    let resA: ExecutionResult = { model: modelA, response: "", latency_ms: 0, tokens: 0, cost: 0 };
    try {
      // Simulate execution — replace with real /ai/complete wire-up when backend ready
      if (modelA === "ollama") {
        await new Promise(r => setTimeout(r, 820));
        resA = { model: modelA, response: `## ${modelA.toUpperCase()} Response\n\nSovereign local execution completed. No data left the infrastructure perimeter.\n\n**Prompt:** ${userPrompt.slice(0, 80)}...`, latency_ms: 820, tokens: 162, cost: 0.00 };
      } else if (modelA === "groq") {
        await new Promise(r => setTimeout(r, 290));
        resA = { model: modelA, response: `## ${modelA.toUpperCase()} (LPU) Response\n\nHigh-speed inference complete.\n\n**Prompt:** ${userPrompt.slice(0, 80)}...`, latency_ms: 290, tokens: 118, cost: 0.0021 };
      } else {
        await new Promise(r => setTimeout(r, 540));
        resA = { model: modelA, response: `## ${modelA.toUpperCase()} Response\n\nMulti-modal reasoning complete.\n\n**Prompt:** ${userPrompt.slice(0, 80)}...`, latency_ms: 540, tokens: 204, cost: 0.0047 };
      }
      setResultA(resA);
    } catch {
      setCircuitBreakerTripped(true);
      setResultA({ ...resA, error: "Connection refused. Circuit breaker engaged." });
    }

    let resB: ExecutionResult = { model: modelB, response: "", latency_ms: 0, tokens: 0, cost: 0 };
    try {
      if (modelB === "ollama") {
        await new Promise(r => setTimeout(r, 810));
        resB = { model: modelB, response: `## ${modelB.toUpperCase()} Response\n\nSovereign local inference completed.`, latency_ms: 810, tokens: 140, cost: 0.00 };
      } else if (modelB === "groq") {
        await new Promise(r => setTimeout(r, 210));
        resB = { model: modelB, response: `## ${modelB.toUpperCase()} (LPU) Response\n\nGroq LPU inference at maximum throughput.`, latency_ms: 210, tokens: 108, cost: 0.0019 };
      } else {
        await new Promise(r => setTimeout(r, 520));
        resB = { model: modelB, response: `## ${modelB.toUpperCase()} Response\n\nGemini flash reasoning complete.`, latency_ms: 520, tokens: 196, cost: 0.0039 };
      }
      setResultB(resB);
    } catch {
      setResultB({ ...resB, error: "Execution failed." });
    }

    setIsRunning(false);
  };

  const handleExportAudit = () => {
    const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), systemPrompt, userPrompt, config: { maxTokens, temperature }, executions: { modelA: resultA, modelB: resultB } }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veklom-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MODEL_OPTIONS = [
    { value: "ollama", label: "Ollama (Local — Sovereign)" },
    { value: "groq",   label: "Groq (LPU — High Speed)"   },
    { value: "gemini", label: "Gemini (Cloud — Reasoning)" },
  ];

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <div className="bg-[#0D1117] rounded-xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setShowSystemPrompt(!showSystemPrompt)}
          className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-xs font-bold text-white tracking-widest uppercase">System Prompt</span>
          {showSystemPrompt ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {showSystemPrompt && (
          <div className="px-5 pb-4 border-t border-white/5">
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="Enter system-level instructions…"
              className="w-full mt-3 h-20 bg-black/60 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#FFB800]/50 resize-none font-mono"
            />
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { label: "Model A", model: modelA, setModel: (v: ModelType) => setModelA(v), result: resultA },
          { label: "Model B", model: modelB, setModel: (v: ModelType) => setModelB(v), result: resultB },
        ].map(({ label, model, setModel, result }) => (
          <div key={label} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
              <select
                value={model}
                onChange={e => setModel(e.target.value as ModelType)}
                className="bg-[#0D1117] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#FFB800]/50"
              >
                {MODEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div className="h-80 bg-black/50 border border-white/10 rounded-xl p-4 overflow-y-auto prose prose-invert prose-sm max-w-none font-sans">
              {isRunning && !result && (
                <div className="flex items-center justify-center h-full text-gray-600 animate-pulse font-mono text-xs">Executing…</div>
              )}
              {result?.error && <div className="text-red-400 font-mono text-xs">{result.error}</div>}
              {result?.response && <ReactMarkdown>{result.response}</ReactMarkdown>}
              {!isRunning && !result && (
                <div className="text-gray-700 italic text-xs font-mono text-center mt-16">Response renders here…</div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
              <div className="flex gap-4">
                <span>⏱ {result?.latency_ms ?? 0}ms</span>
                <span>📊 {result?.tokens ?? 0} tokens</span>
              </div>
              <span className="text-[#FFB800]">💡 ${result?.cost?.toFixed(4) ?? "0.0000"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Prompt Input + Controls */}
      <div className="bg-[#0D1117] border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex gap-4">
          <textarea
            value={userPrompt}
            onChange={e => setUserPrompt(e.target.value)}
            placeholder="Enter your prompt… (Ctrl+Enter to run)"
            className="flex-1 h-20 bg-black/60 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-[#FFB800]/50 text-sm text-white placeholder-gray-600 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRunBoth(); }}
          />
          <button
            onClick={handleRunBoth}
            disabled={isRunning || !userPrompt.trim()}
            className="w-32 bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-bold rounded-xl flex flex-col items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.97] shadow-lg shadow-[#FFB800]/20"
          >
            <Play className="w-4 h-4" />
            <span className="text-xs">Run Both</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <label className="flex items-center gap-2">
              Max Tokens
              <input type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))}
                className="bg-black/60 border border-white/10 rounded px-2 py-1 w-20 text-white focus:outline-none focus:border-[#FFB800]/50" />
            </label>
            <label className="flex items-center gap-2">
              Temp
              <input type="number" step="0.1" min="0" max="2" value={temperature} onChange={e => setTemperature(Number(e.target.value))}
                className="bg-black/60 border border-white/10 rounded px-2 py-1 w-16 text-white focus:outline-none focus:border-[#FFB800]/50" />
            </label>
          </div>
          <button
            onClick={handleExportAudit}
            disabled={!resultA && !resultB}
            className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/10 rounded-lg hover:bg-white/5 transition-colors text-xs font-medium text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit
          </button>
        </div>
      </div>

      {/* Circuit Breaker Status */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-mono transition-all ${
        circuitBreakerTripped
          ? 'border-red-500/30 bg-red-500/5 text-red-400'
          : 'border-white/5 bg-white/[0.01] text-gray-500'
      }`}>
        {circuitBreakerTripped ? (
          <><ShieldAlert className="w-4 h-4 flex-shrink-0" /> CIRCUIT BREAKER: <span className="text-red-500 font-bold ml-1">TRIPPED</span> — Ollama unreachable. Fallback: Groq activated.</>
        ) : (
          <><CheckCircle className="w-4 h-4 flex-shrink-0" /> CIRCUIT BREAKER: <span className="text-green-500 font-bold ml-1">ARMED</span> — Ollama primary / Groq fallback standing by.</>
        )}
      </div>
    </div>
  );
}

// ─── Root Hybrid Playground Page ─────────────────────────────────────────────

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<TabId>("compare");

  return (
    <div className="min-h-screen bg-[#060810] text-gray-100">
      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

        {/* Page Header */}
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 border border-[#FFB800]/20 flex items-center justify-center flex-shrink-0">
            <Cpu className="w-5 h-5 text-[#FFB800]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              VEKLOM PLAYGROUND
              <span className="ml-3 text-[10px] font-mono text-[#FFB800] bg-[#FFB800]/10 border border-[#FFB800]/20 px-2 py-0.5 rounded">
                HYBRID v2.0
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {TABS.find(t => t.id === activeTab)?.desc}
            </p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-black/40 border border-white/5 rounded-xl p-1.5 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
                  isActive
                    ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "compare" && <ModelCompareTab />}
        {activeTab === "vanguard" && (
          <div className="rounded-2xl overflow-hidden border border-white/5">
            <VanguardPlayground />
          </div>
        )}

      </div>
    </div>
  );
}
