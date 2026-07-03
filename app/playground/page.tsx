'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Copy, Download, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ModelResponse {
  response: string;
  model: string;
  provider: 'ollama' | 'groq';
  latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: string;
  log_id: string;
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

  // Fetch circuit breaker status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://api.veklom.com/status');
        const data: SystemStatus = await res.json();
        setCircuitBreaker(data.circuit_breaker);
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
    setError('');
    setLoading(true);

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    try {
      // Step 1: Predict cost
      const costRes = await fetch('http://api.veklom.com/api/v1/cost/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation_type: 'inference',
          provider: model,
          input_text: userPrompt,
          model: model === 'ollama' ? 'qwen2.5:3b' : 'llama-3.1-8b-instant',
        }),
      });
      const costData = await costRes.json();
      const predictedCost = costData.predicted_cost || '0.000000';

      // Step 2: Execute inference
      const execRes = await fetch('http://api.veklom.com/v1/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_VEKLOM_API_KEY || 'demo_key',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          model: model === 'ollama' ? 'qwen2.5:3b' : 'llama-3.1-8b-instant',
          conversation_id: useMemory && conversationId ? conversationId : undefined,
          use_memory: useMemory,
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!execRes.ok) {
        throw new Error(`Execution failed: ${execRes.statusText}`);
      }

      const execData: ModelResponse = await execRes.json();
      execData.cost = predictedCost;

      if (isModelA) {
        setResponseA(execData);
      } else {
        setResponseB(execData);
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Run both models simultaneously
  const runBoth = async () => {
    await Promise.all([
      executeModel(modelA, true),
      executeModel(modelB, false),
    ]);
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
    a.download = `audit_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🔬 VEKLOM PLAYGROUND</h1>
          <p className="text-slate-400">Compare AI models side-by-side with real-time cost analysis</p>
        </div>

        {/* Circuit Breaker Banner */}
        {circuitBreaker && (
          <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
            circuitBreaker.state === 'CLOSED'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : circuitBreaker.state === 'HALF_OPEN'
              ? 'bg-amber-950 border-amber-500 text-amber-300'
              : 'bg-red-950 border-red-500 text-red-300'
          }`}>
            {circuitBreaker.state === 'CLOSED' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <div className="flex-1">
              <p className="font-semibold">Circuit Breaker: {circuitBreaker.state}</p>
              <p className="text-sm opacity-90">
                {circuitBreaker.state === 'CLOSED'
                  ? 'Ollama local inference active ✓'
                  : circuitBreaker.state === 'OPEN'
                  ? `Ollama offline. Routing to Groq cloud fallback. Cooldown: ${circuitBreaker.cooldown_seconds}s`
                  : 'Testing Ollama recovery...'}
              </p>
            </div>
          </div>
        )}

        {/* System Prompt Section */}
        <div className="mb-6 bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700 transition"
          >
            <span className="font-semibold text-white">System Prompt</span>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition ${
                isSystemPromptOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {isSystemPromptOpen && (
            <div className="px-6 pb-6 border-t border-slate-700">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full p-4 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-none"
                rows={4}
                placeholder="Enter system prompt..."
              />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Max Tokens */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <label className="block text-sm font-semibold text-white mb-3">
              Max Tokens: {maxTokens}
            </label>
            <input
              type="range"
              min="64"
              max="4096"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-2">64 - 4096</p>
          </div>

          {/* Temperature */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <label className="block text-sm font-semibold text-white mb-3">
              Temperature: {temperature.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-2">0.0 (deterministic) - 1.0 (creative)</p>
          </div>

          {/* Conversation Memory */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useMemory}
                onChange={(e) => setUseMemory(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="font-semibold text-white">Enable Memory</span>
            </label>
            {useMemory && (
              <input
                type="text"
                value={conversationId}
                onChange={(e) => setConversationId(e.target.value)}
                placeholder="Conversation ID (optional)"
                className="w-full mt-3 p-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
              />
            )}
          </div>
        </div>

        {/* User Prompt */}
        <div className="mb-6">
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter your prompt here..."
            className="w-full p-4 bg-slate-800 text-white border border-slate-700 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            rows={6}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-500 text-red-300 rounded-lg">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={runBoth}
            disabled={loading || !userPrompt.trim()}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold rounded-lg transition disabled:cursor-not-allowed"
          >
            {loading ? 'Running...' : '▶ Run Both Models'}
          </button>
          <button
            onClick={exportAudit}
            disabled={!responseA && !responseB}
            className="px-8 py-3 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white font-semibold rounded-lg transition flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export Audit
          </button>
        </div>

        {/* Side-by-Side Responses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model A */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-700">
              <select
                value={modelA}
                onChange={(e) => setModelA(e.target.value)}
                className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="groq">Groq (Cloud)</option>
              </select>
            </div>
            {responseA ? (
              <div className="p-6">
                <div className="prose prose-invert max-w-none mb-6 text-slate-300">
                  <ReactMarkdown>{responseA.response}</ReactMarkdown>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Latency</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {responseA.latency_ms}ms
                    </p>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Tokens</p>
                    <p className="text-white font-semibold">{responseA.total_tokens}</p>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Cost</p>
                    <p className="text-white font-semibold">${responseA.cost}</p>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Provider</p>
                    <p className="text-white font-semibold">{responseA.provider}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                Run models to see response
              </div>
            )}
          </div>

          {/* Model B */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 border-b border-slate-700">
              <select
                value={modelB}
                onChange={(e) => setModelB(e.target.value)}
                className="w-full p-2 bg-slate-700 text-white border border-slate-600 rounded focus:border-blue-500 focus:outline-none"
              >
                <option value="ollama">Ollama (Local)</option>
                <option value="groq">Groq (Cloud)</option>
              </select>
            </div>
            {responseB ? (
              <div className="p-6">
                <div className="prose prose-invert max-w-none mb-6 text-slate-300">
                  <ReactMarkdown>{responseB.response}</ReactMarkdown>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Latency</p>
                    <p className="text-white font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {responseB.latency_ms}ms
                    </p>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Tokens</p>
                    <p className="text-white font-semibold">{responseB.total_tokens}</p>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Cost</p>
                    <p className="text-white font-semibold">${responseB.cost}</p>
                  </div>
                  <div className="bg-slate-700 p-3 rounded">
                    <p className="text-slate-400">Provider</p>
                    <p className="text-white font-semibold">{responseB.provider}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                Run models to see response
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
