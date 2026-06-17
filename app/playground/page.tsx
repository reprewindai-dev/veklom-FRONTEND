'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, Copy, Download, AlertTriangle, CheckCircle, Clock, Zap, Cpu, Sparkles, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { Pill } from '@/components/telemetry';

interface ModelResponse {
  response: string;
  model: string;
  provider: 'ollama' | 'groq';
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

interface SystemStatus {
  status: string;
  circuit_breaker: CircuitBreakerState;
  llm_ok: boolean;
  redis_ok: boolean;
  db_ok: boolean;
}

export default function PlaygroundPage() {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [userPrompt, setUserPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(2048);
  const [temperature, setTemperature] = useState(0.7);
  const [conversationId, setConversationId] = useState('');
  const [useMemory, setUseMemory] = useState(true);

  const [modelA, setModelA] = useState('ollama');
  const [modelB, setModelB] = useState('groq');
  const [responseA, setResponseA] = useState<ModelResponse | null>(null);
  const [responseB, setResponseB] = useState<ModelResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [circuitBreaker, setCircuitBreaker] = useState<CircuitBreakerState | null>(null);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);

  // Fetch circuit breaker status via relative /api/v1/status or similar
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api<any>('/api/v1/status');
        if (data && data.circuit_breaker) {
          setCircuitBreaker(data.circuit_breaker);
        }
      } catch (err) {
        console.error('Failed to fetch circuit breaker status:', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Execute single model
  const executeModel = async (model: string, isModelA: boolean) => {
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    const targetModel = model === 'ollama' ? 'qwen2.5:3b' : 'llama-3.1-8b-instant';

    try {
      // Step 1: Predict cost
      let predictedCost = '0.00000';
      try {
        const costData = await api<any>('/api/v1/cost/predict', {
          method: 'POST',
          body: {
            operation_type: 'inference',
            provider: model,
            input_text: userPrompt,
            model: targetModel,
          }
        });
        predictedCost = costData.predicted_cost || '0.00000';
      } catch (e) {
        console.warn('Cost prediction failed', e);
      }

      // Step 2: Execute inference
      const execData = await api<ModelResponse>('/api/v1/exec', {
        method: 'POST',
        body: {
          prompt: fullPrompt,
          model: targetModel,
          conversation_id: useMemory && conversationId ? conversationId : undefined,
          use_memory: useMemory,
          max_tokens: maxTokens,
          temperature,
        }
      });

      execData.cost = predictedCost;

      if (isModelA) {
        setResponseA(execData);
      } else {
        setResponseB(execData);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      if (isModelA) {
        setResponseA({
          response: `Failed to execute: ${errMsg}`,
          model: targetModel,
          provider: model as any,
          latency_ms: 0,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost: '0.00000'
        });
      } else {
        setResponseB({
          response: `Failed to execute: ${errMsg}`,
          model: targetModel,
          provider: model as any,
          latency_ms: 0,
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
          cost: '0.00000'
        });
      }
    }
  };

  // Run both models simultaneously
  const runBoth = async () => {
    setError('');
    setLoading(true);
    try {
      await Promise.all([
        executeModel(modelA, true),
        executeModel(modelB, false),
      ]);
    } catch (e) {
      setError('An error occurred executing prompts.');
    } finally {
      setLoading(false);
    }
  };

  // Export audit log as JSON
  const exportAudit = () => {
    const auditData = {
      timestamp: new Date().toISOString(),
      system_prompt: systemPrompt,
      user_prompt: userPrompt,
      parameters: { maxTokens, temperature, conversationId, useMemory },
      responses: {
        model_a: responseA ? {
          model: responseA.model,
          provider: responseA.provider,
          latency_ms: responseA.latency_ms,
          tokens: {
            prompt: responseA.prompt_tokens,
            completion: responseA.completion_tokens,
            total: responseA.total_tokens,
          },
          cost: responseA.cost,
          log_id: responseA.log_id,
        } : null,
        model_b: responseB ? {
          model: responseB.model,
          provider: responseB.provider,
          latency_ms: responseB.latency_ms,
          tokens: {
            prompt: responseB.prompt_tokens,
            completion: responseB.completion_tokens,
            total: responseB.total_tokens,
          },
          cost: responseB.cost,
          log_id: responseB.log_id,
        } : null,
      },
    };

    const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veklom_audit_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-2">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-[0.18em] text-ink-600">
              Workspace · Execution Surface
            </span>
            <h1 className="text-[28px] font-semibold tracking-tight text-gradient">
              Sovereign Playground
            </h1>
            <p className="text-sm text-ink-400 max-w-2xl mt-1.5">
              Compare local and cloud models side-by-side with latency, parameter, and token cost diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportAudit}
              disabled={!responseA && !responseB}
              className="btn btn-ghost group text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Export Audit</span>
            </button>
          </div>
        </div>

        {/* Circuit Breaker Banner */}
        {circuitBreaker && circuitBreaker.state !== 'CLOSED' && (
          <div className="card border-brand-500/30 bg-brand-500/5 p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-brand-400 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-xs text-brand-400">Circuit Breaker Active: {circuitBreaker.state}</p>
              <p className="text-[11px] text-ink-400 mt-0.5">
                Local inference pipeline overloaded. Auto-routing to secondary cloud providers.
              </p>
            </div>
            <Pill tone="amber">Auto-fallback active</Pill>
          </div>
        )}

        {/* System Prompt Section */}
        <div className="card overflow-hidden">
          <button
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/[0.01] transition"
          >
            <span className="text-xs font-semibold text-ink-200 uppercase tracking-wider">System Prompt (Collapsible)</span>
            <ChevronDown
              className={`w-4 h-4 text-ink-500 transition-transform ${
                isSystemPromptOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isSystemPromptOpen && (
            <div className="px-5 pb-5 border-t border-[#242424] pt-4">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="input text-sm text-ink-200"
                rows={3}
                placeholder="Enter system prompt..."
              />
            </div>
          )}
        </div>

        {/* Sliders and Memory Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-ink-200">
              <span>MAX TOKENS</span>
              <span className="font-mono text-brand-400">{maxTokens}</span>
            </div>
            <input
              type="range"
              min="64"
              max="2048"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full accent-brand-400 bg-white/[0.05]"
            />
            <div className="flex justify-between text-[10px] text-ink-500 font-mono">
              <span>64</span>
              <span>2048</span>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-ink-200">
              <span>TEMPERATURE</span>
              <span className="font-mono text-brand-400">{temperature.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-brand-400 bg-white/[0.05]"
            />
            <div className="flex justify-between text-[10px] text-ink-500 font-mono">
              <span>0.0 (Strict)</span>
              <span>1.0 (Creative)</span>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-ink-200">
              <input
                type="checkbox"
                checked={useMemory}
                onChange={(e) => setUseMemory(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-bg-950 accent-brand-400"
              />
              <span>ENABLE MEMORY</span>
            </label>
            {useMemory ? (
              <input
                type="text"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                placeholder="Conversation ID (optional)"
                className="input text-xs"
              />
            ) : (
              <div className="h-9 flex items-center text-[10px] text-ink-500 font-mono">
                Isolated context execution only.
              </div>
            )}
          </div>
        </div>

        {/* User Prompt Input */}
        <div className="card p-5 space-y-4">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter execution prompt..."
            className="input text-sm h-32 focus:ring-0"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-ink-500">
              <Sparkles size={11} className="text-brand-400 animate-pulse" />
              <span>Ollama Primary ↔ Groq Fallback Network status:</span>
              <span className="text-accent-green">ONLINE</span>
            </div>
            
            <button
              onClick={runBoth}
              disabled={loading || !userPrompt.trim()}
              className="btn btn-primary text-xs px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Activity size={13} className="animate-spin mr-1.5" />
                  Running both...
                </>
              ) : (
                '▶ Run Both Models'
              )}
            </button>
          </div>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Model A */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#242424] bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider">Model A Pipeline</span>
                <select
                  value={modelA}
                  onChange={(e) => setModelA(e.target.value)}
                  className="bg-bg-950 border border-border rounded px-2.5 py-1 text-xs text-brand-400 font-mono outline-none"
                >
                  <option value="ollama">Ollama (Qwen2.5:3b)</option>
                  <option value="groq">Groq (Llama-3.1-8b)</option>
                </select>
              </div>
            </div>
            {responseA ? (
              <div className="p-5 space-y-4">
                <div className="prose prose-invert max-w-none text-xs text-ink-200 bg-black/30 p-4 rounded-xl border border-border/40 min-h-[160px] max-h-[400px] overflow-y-auto font-sans leading-relaxed">
                  <ReactMarkdown>{responseA.response}</ReactMarkdown>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
                  <div className="bg-white/[0.02] border border-border/50 p-2.5 rounded-lg">
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Latency</p>
                    <p className="text-white font-semibold mt-1 flex items-center gap-1">
                      <Clock size={11} className="text-brand-400" />
                      {responseA.latency_ms} ms
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-border/50 p-2.5 rounded-lg">
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Throughput</p>
                    <p className="text-white font-semibold mt-1">
                      {responseA.total_tokens} tokens
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-border/50 p-2.5 rounded-lg">
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Cost Calc</p>
                    <p className="text-white font-semibold mt-1">
                      ${responseA.cost || '0.00000'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-ink-500 font-mono italic">
                Awaiting execution results...
              </div>
            )}
          </div>

          {/* Model B */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#242424] bg-white/[0.01]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-ink-500 uppercase tracking-wider">Model B Pipeline</span>
                <select
                  value={modelB}
                  onChange={(e) => setModelB(e.target.value)}
                  className="bg-bg-950 border border-border rounded px-2.5 py-1 text-xs text-brand-400 font-mono outline-none"
                >
                  <option value="groq">Groq (Llama-3.1-8b)</option>
                  <option value="ollama">Ollama (Qwen2.5:3b)</option>
                </select>
              </div>
            </div>
            {responseB ? (
              <div className="p-5 space-y-4">
                <div className="prose prose-invert max-w-none text-xs text-ink-200 bg-black/30 p-4 rounded-xl border border-border/40 min-h-[160px] max-h-[400px] overflow-y-auto font-sans leading-relaxed">
                  <ReactMarkdown>{responseB.response}</ReactMarkdown>
                </div>
                <div className="grid grid-cols-3 gap-3 text-[11px] font-mono">
                  <div className="bg-white/[0.02] border border-border/50 p-2.5 rounded-lg">
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Latency</p>
                    <p className="text-white font-semibold mt-1 flex items-center gap-1">
                      <Clock size={11} className="text-brand-400" />
                      {responseB.latency_ms} ms
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-border/50 p-2.5 rounded-lg">
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Throughput</p>
                    <p className="text-white font-semibold mt-1">
                      {responseB.total_tokens} tokens
                    </p>
                  </div>
                  <div className="bg-white/[0.02] border border-border/50 p-2.5 rounded-lg">
                    <p className="text-ink-500 text-[9px] uppercase tracking-wider">Cost Calc</p>
                    <p className="text-white font-semibold mt-1">
                      ${responseB.cost || '0.00000'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-xs text-ink-500 font-mono italic">
                Awaiting execution results...
              </div>
            )}
          </div>
        </div>

      </div>
    </Shell>
  );
}
