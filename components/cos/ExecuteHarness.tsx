'use client';

import React, { useState } from 'react';
import { Play, Database, Activity, Terminal as TerminalIcon, Shield, Clock } from 'lucide-react';
import { ProofBadge } from './ProofBadge';
import {
  EXECUTION_LABEL,
  INTEGRITY_LABEL,
  headline,
  transportLabel,
  type CallOutcome,
} from '@/lib/cos/outcome';

interface ExecutionTrace {
  response?: string;
  provider?: string;
  model?: string;
  log_id?: string;
  execution_id?: string;
  tokens?: number;
  total_tokens?: number;
  latency_ms?: number;
}

interface ExecuteHarnessProps {
  onExecute: (body: unknown, apiKey?: string) => Promise<{ data?: unknown }>;
  outcome: CallOutcome;
  result?: unknown;
  loading: boolean;
  proof: "Verified" | "Needs proof" | "Present" | "Degraded" | "Not started" | "Manual step" | "Simulated";
}

function asTrace(value: unknown): ExecutionTrace | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as ExecutionTrace
    : null;
}

export function ExecuteHarness({ onExecute, outcome, result, loading, proof }: ExecuteHarnessProps) {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('qwen2.5:3b');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!prompt) return;
    
    setIsExecuting(true);
    setError(null);

    try {
      const { data } = await onExecute({
        prompt,
        model,
        use_memory: false,
      }, apiKey);
      const trace = asTrace(data);
      if (trace?.log_id || trace?.execution_id) {
        sessionStorage.setItem('veklom_execution_id', trace.log_id || trace.execution_id || "");
      }
    } catch (err: any) {
      setError(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">
            Execute Workspace
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-cos-text">
            Runtime Harness
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">
            Run a mounted capability through the governed runtime and observe the replayable trace.
          </p>
        </div>
        <ProofBadge status={proof} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
            <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text mb-4">
              <Shield size={14} className="text-cos-accent" />
              Authority
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">Execution Key (API Key)</label>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="byos_..."
                  className="w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
            <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text mb-4">
              <Database size={14} className="text-cos-accent" />
              Mounted Capability
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">Model Target</label>
                <select 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none"
                >
                  <option value="qwen2.5:3b">qwen2.5:3b (Local Ollama)</option>
                  <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Groq Fallback)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">Input Payload (Intent)</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter capability execution intent..."
                  rows={4}
                  className="w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none resize-none"
                />
              </div>
              <button 
                onClick={handleExecute}
                disabled={isExecuting || loading || !prompt}
                className="w-full flex items-center justify-center gap-2 bg-cos-accent text-black font-semibold uppercase tracking-wider text-[11px] py-2.5 rounded hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isExecuting ? <Activity size={14} className="animate-spin" /> : <Play size={14} />}
                {isExecuting ? 'Executing...' : 'Run Capability'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Outputs & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-cos-border bg-[#050505] overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="bg-[#0A0A0A] border-b border-[#222] p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} className="text-[#666]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#666]">Runtime Trace</span>
              </div>
              {asTrace(result) && (
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#00FF41]">
                    <Clock size={12} /> {asTrace(result)?.latency_ms ?? "—"}ms
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] text-cos-accent">
                    <Activity size={12} /> {asTrace(result)?.tokens ?? asTrace(result)?.total_tokens ?? "—"} tkns
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-5 font-mono text-[13px] leading-relaxed text-gray-300 flex-1 overflow-y-auto">
              {error && (
                <div className="text-red-400 mb-4 flex items-start gap-2">
                  <span className="text-red-500 font-bold">[ERROR]</span> 
                  {error}
                </div>
              )}

              {!result && !error && !isExecuting && outcome.transport.kind === "not-called" && (
                <div className="text-[#555] italic flex items-center gap-2">
                  <span className="w-2 h-4 bg-[#00FF41] animate-ping" style={{ animationDuration: '1s' }}></span>
                  Waiting for execution trigger...
                </div>
              )}

              {isExecuting && (
                <div className="text-[#FF6B00] animate-pulse flex items-center gap-2">
                  <Activity size={14} />
                  Initiating ZeroTrust sequence... compiling execution graph...
                </div>
              )}

              {(asTrace(result) || outcome.transport.kind !== "not-called") && !isExecuting && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="space-y-1 mb-2">
                    <div className="text-cos-accent">{'>'} {headline(outcome).pipeline}</div>
                    <div className={outcome.execution === "runtime-error" ? "text-red-400" : "text-[#00FF41]"}>
                      {'>'} {headline(outcome).result}
                    </div>
                    <div className="text-cos-muted text-[11px]">{transportLabel(outcome.transport)}</div>
                  </div>
                  <div className="bg-[#111] border border-[#222] rounded p-4 text-gray-200">
                    {asTrace(result)?.response || "Execution response did not report output."}
                  </div>
                  <div className="mt-6 border-t border-[#222] pt-4 grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest">
                    <div>
                      <div className="text-[#555] mb-1">Provider Route</div>
                      <div className="text-white">{asTrace(result)?.provider || "Not reported"} ({asTrace(result)?.model || "Not reported"})</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-1">Audit Hash (PGL)</div>
                      <div className="text-cos-accent font-bold truncate" title={asTrace(result)?.log_id}>{asTrace(result)?.log_id || "Not reported"}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 border-t border-[#222] pt-4 sm:grid-cols-3">
                    <OutcomeCell label="Transport" value={transportLabel(outcome.transport)} />
                    <OutcomeCell label="Execution" value={EXECUTION_LABEL[outcome.execution]} />
                    <OutcomeCell label="Integrity" value={INTEGRITY_LABEL[outcome.integrity]} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OutcomeCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#222] bg-[#0b0b0b] p-3">
      <div className="mb-1 text-[10px] uppercase tracking-widest text-[#555]">{label}</div>
      <div className="break-words font-mono text-[11px] uppercase text-cos-text">{value}</div>
    </div>
  );
}
