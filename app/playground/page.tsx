"use client";

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Download, ShieldAlert, Cpu, RefreshCw, Fingerprint, Coins, Lock,
  Unlock, History, Eye, AlertTriangle, Layers, KeyRound, ChevronRight,
  Sparkles, Database, ChevronDown, ChevronUp, Info, Zap, TestTube2
} from 'lucide-react';
import { api, getToken } from '@/lib/api';

const Pipeline = dynamic(
  () => import('@/components/pipeline/Pipeline').then(m => ({ default: m.Pipeline })),
  { ssr: false, loading: () => <div className="h-28 animate-pulse bg-white/5 rounded-xl" /> }
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelDef {
  id: string;
  provider: string;
  name: string;
  context_window: number;
  cost_per_1k_input: number;
}

interface RunResult {
  response_text: string;
  provider: string;
  model: string;
  latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  audit_id?: number;
  cache_hit?: string | null;
  policy?: { status: string };
}

interface PhaseTrace {
  phase: number;
  name: string;
  status: 'pass' | 'fail' | 'pending';
  summary: string;
  duration_ms: number;
  detail: Record<string, unknown>;
}

interface LedgerBlock {
  index: number;
  timestamp: string;
  prevHash: string;
  hash: string;
  action: string;
  vnpStake: string;
  evidenceHash: string;
  status: 'SUCCESS' | 'SLASHED' | 'NEEDS_PROOF';
}

type ExecState = 'idle' | 'gateway' | 'inferring' | 'success' | 'blocked' | 'error';
type ThreatId = 'injection' | 'depth' | 'credentials' | null;

// Threat scenarios — these are explicitly marked as simulations
const THREAT_SCENARIOS = {
  injection: {
    label: 'Prompt Injection Override',
    icon: AlertTriangle,
    color: 'red' as const,
    description: 'Tests what happens when an agent tries to override system directives.',
    payload: { cmd: 'rm -rf /' },
    failPhase: 4,
  },
  depth: {
    label: 'Payload Nesting Overflow',
    icon: Layers,
    color: 'orange' as const,
    description: 'Tests the schema moat against recursive JSON nesting attacks.',
    payload: { a: { b: { c: { d: { e: { f: { g: 1 } } } } } } },
    failPhase: 2,
  },
  credentials: {
    label: 'Credential Leakage Swap',
    icon: KeyRound,
    color: 'yellow' as const,
    description: 'Tests the sanitization moat detecting raw secrets in payloads.',
    payload: { req: 'fetch_aws', key: 'AKIAIOSFODNN7EXAMPLE' },
    failPhase: 3,
  },
};

// Real gateway phase definitions (what cAPI actually runs)
const GATEWAY_PHASES = [
  { name: 'cAPI Intercept',    passMsg: 'Request captured. Session token extracted.',          failMsg: 'Structural analysis triggered.' },
  { name: 'Schema Moat',       passMsg: 'Payload depth verified (3/6). Structure compliant.',  failMsg: 'CRITICAL: Nesting depth >6. Call stack exhaustion risk.' },
  { name: 'Sanitization Moat', passMsg: 'Prompt clean. No credentials detected.',              failMsg: 'EXPOSURE: Raw secret found. Initiating redaction.' },
  { name: 'SEKED Policy Gate', passMsg: 'Intent matches approved templates. Approved.',        failMsg: 'VETO: Override command detected. Prompt halted.' },
  { name: 'x402 Token Swap',   passMsg: 'Static secret swapped with short-lived nonce.',      failMsg: 'Swap aborted — policy veto upstream.' },
];

const INITIAL_LEDGER: LedgerBlock[] = [];

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PlaygroundPage() {

  // Config
  const [systemPrompt, setSystemPrompt]   = useState('');
  const [showSys, setShowSys]             = useState(false);
  const [userPrompt, setUserPrompt]       = useState('');
  const [modelAId, setModelAId]           = useState('llama3.2:latest');
  const [modelBId, setModelBId]           = useState('llama-3.1-8b-instant');
  const [maxTokens, setMaxTokens]         = useState(2048);
  const [temperature, setTemperature]     = useState(0.7);
  const [dailyVolume, setDailyVolume]     = useState(1000);

  // Available models (loaded from backend)
  const [models, setModels]               = useState<ModelDef[]>([]);

  // Exec state
  const [execState, setExecState]         = useState<ExecState>('idle');
  const [isSimulation, setIsSimulation]   = useState(false);
  const [activeThreat, setActiveThreat]   = useState<ThreatId>(null);
  const [trace, setTrace]                 = useState<PhaseTrace[] | null>(null);
  const [runId, setRunId]                 = useState(0);
  const [logs, setLogs]                   = useState<string[]>([]);
  const [resultA, setResultA]             = useState<RunResult | null>(null);
  const [resultB, setResultB]             = useState<RunResult | null>(null);
  const [execError, setExecError]         = useState<string | null>(null);

  // Cost projection (real from backend)
  const [costA, setCostA]                 = useState<number | null>(null);
  const [costB, setCostB]                 = useState<number | null>(null);

  // Identity vault
  const [nonce, setNonce]                 = useState('');
  const [isRotating, setIsRotating]       = useState(false);

  // VNP ledger
  const [ledger, setLedger]               = useState<LedgerBlock[]>(INITIAL_LEDGER);
  const [vnpBalance, setVnpBalance]       = useState<number | null>(null);
  const [slashedStake, setSlashedStake]   = useState(0);
  const [floatingVal, setFloatingVal]     = useState<string | null>(null);
  const [floatingColor, setFloatingColor] = useState('text-green-400');
  const [lastStatus, setLastStatus]       = useState('No backend run yet');

  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // Load models from backend
  useEffect(() => {
    api<ModelDef[]>('/api/v1/ai/models').then(data => {
      if (Array.isArray(data)) setModels(data);
    }).catch(() => setModels([]));
  }, []);

  // Load real wallet balance
  useEffect(() => {
    api<{ balance_usd: number }>('/api/v1/billing/wallet/balance').then(data => {
      setVnpBalance(data?.balance_usd ?? 0);
    }).catch(() => { /* not critical */ });
  }, []);

  // Real cost projection — fires when model selection or volume changes
  useEffect(() => {
    const fetchCost = async (modelId: string, setter: (v: number) => void) => {
      try {
        const data = await api<{ estimated_cost_usd: number }>('/api/v1/ai/predict-cost', {
          method: 'POST',
          body: { model: modelId, input_tokens: 500, output_tokens: 300 },
        });
        setter(data.estimated_cost_usd);
      } catch { /* not critical */ }
    };
    if (modelAId) fetchCost(modelAId, setCostA);
    if (modelBId) fetchCost(modelBId, setCostB);
  }, [modelAId, modelBId]);

  // Append ledger block
  const appendLedger = (action: string, stake: string, status: LedgerBlock['status'], evidenceHash?: string) => {
    if (!evidenceHash) return;
    setLedger(prev => {
      const last = prev[0];
      return [{ index: last ? last.index + 1 : 1, timestamp: new Date().toISOString(),
        prevHash: last?.hash || '', hash: evidenceHash, action, vnpStake: stake,
        evidenceHash, status }, ...prev];
    });
  };

  // ── Run gateway simulation for threat scenarios ──
  const runGatewaySimulation = async (failAtPhase: number): Promise<boolean> => {
    const traceArr: PhaseTrace[] = [];
    for (let i = 0; i < GATEWAY_PHASES.length; i++) {
      await new Promise(r => setTimeout(r, 100 + Math.random() * 80));
      const fail = i + 1 === failAtPhase;
      const ph: PhaseTrace = {
        phase: i + 1, name: GATEWAY_PHASES[i].name,
        status: fail ? 'fail' : 'pass',
        summary: fail ? GATEWAY_PHASES[i].failMsg : GATEWAY_PHASES[i].passMsg,
        duration_ms: 80 + i * 30, detail: {},
      };
      traceArr.push(ph);
      setTrace([...traceArr]);
      setLogs(p => [...p, `[GATEWAY] Phase ${i + 1} ${ph.name}: ${ph.summary}`]);
      if (fail) return false;
    }
    return true;
  };

  // ── Run real inference via backend ──
  const runInference = async (modelId: string, systemPr: string, userPr: string): Promise<RunResult> => {
    const messages = [];
    if (systemPr.trim()) messages.push({ role: 'system', content: systemPr });
    messages.push({ role: 'user', content: userPr });

    const data = await api<any>('/api/v1/ai/inference', {
      method: 'POST',
      body: { model: modelId, messages, temperature, max_tokens: maxTokens },
    });
    return data as RunResult;
  };

  // ── Master execute handler ──
  const handleRun = async (threat: ThreatId) => {
    const isSim = threat !== null;
    setIsSimulation(isSim);
    setActiveThreat(threat);
    setExecState('gateway');
    setTrace([]);
    setLogs([]);
    setResultA(null);
    setResultB(null);
    setSlashedStake(0);
    setFloatingVal(null);
    setExecError(null);
    setRunId(Date.now());

    try {
      let capiEvidenceHash = '';

      if (isSim) {
        // ── SIMULATION PATH — threat scenario test ──
        const scenario = THREAT_SCENARIOS[threat!];
        setLogs(p => [...p, `[SIMULATION] Testing: ${scenario.label}`, `[SIMULATION] Injecting threat payload...`]);

        const passed = await runGatewaySimulation(scenario.failPhase);
        if (!passed) {
          setExecState('blocked');
          setSlashedStake(250);
          setFloatingVal('-250 VNP');
          setFloatingColor('text-red-500 font-bold');
          setLastStatus('Simulation blocked. No backend ledger write.');
          return;
        }
      } else {
        // ── REAL PATH — actual backend inference ──
        if (!userPrompt.trim()) {
          setExecState('idle');
          return;
        }

        // Build real gateway trace from cAPI execute.
        setLogs(p => [...p, '[GATEWAY] Initiating cAPI inline execution...']);

        const token = getToken();
        const capiRes = await fetch('/api/v1/capi/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ agent_id: 'playground', pgl_id: 'valid_pgl', target_protocol: 'mcp', action: 'prompt_run', payload: { prompt: userPrompt } }),
          signal: AbortSignal.timeout(12000),
        });
        const capiPayload = await capiRes.json().catch(() => ({}));
        if (!capiRes.ok) {
          throw new Error(capiPayload?.error || capiPayload?.detail || `cAPI execute failed: HTTP ${capiRes.status}`);
        }
        if (capiPayload?.status === 'error') {
          throw new Error(capiPayload?.error || 'cAPI returned error status');
        }

        capiEvidenceHash = capiPayload?.evidence_hash || capiPayload?.result?.evidence_hash || '';
        const backendTrace = Array.isArray(capiPayload?.trace)
          ? capiPayload.trace
          : Array.isArray(capiPayload?.result?.trace)
          ? capiPayload.result.trace
          : [];
        const traceArr: PhaseTrace[] = backendTrace.length
          ? backendTrace.map((item: any, index: number) => ({
              phase: Number(item.phase ?? index + 1),
              name: String(item.name ?? item.stage ?? `cAPI Phase ${index + 1}`),
              status: item.status === 'error' || item.ok === false ? 'fail' : 'pass',
              summary: String(item.summary ?? item.message ?? item.status ?? 'cAPI phase returned.'),
              duration_ms: Number(item.duration_ms ?? item.latency_ms ?? 0),
              detail: typeof item === 'object' && item ? item : {},
            }))
          : [{
              phase: 1,
              name: 'cAPI Execute',
              status: 'pass',
              summary: capiEvidenceHash ? `Evidence hash emitted: ${capiEvidenceHash}` : 'cAPI accepted the governed request without an evidence hash.',
              duration_ms: 0,
              detail: capiPayload,
            }];
        setTrace(traceArr);
        setLogs(p => [...p, `[GATEWAY] cAPI returned ${traceArr.length} proof phase(s).`]);
      }

      // ── Dispatch to real inference ──
      setExecState('inferring');
      setLogs(p => [...p, '[SYSTEM] Gateway cleared. Dispatching to inference providers...']);

      const [resA, resB] = await Promise.allSettled([
        runInference(modelAId, systemPrompt, userPrompt),
        runInference(modelBId, systemPrompt, userPrompt),
      ]);

      if (resA.status === 'fulfilled') {
        setResultA(resA.value);
        setLogs(p => [...p, `[SYSTEM] Model A (${resA.value.provider}): ${resA.value.latency_ms}ms · ${(resA.value.input_tokens + resA.value.output_tokens)} tokens · $${resA.value.cost_usd?.toFixed(5)}`]);
      } else {
        setResultA({ response_text: `❌ ${resA.reason?.message ?? 'Inference failed'}`, provider: modelAId, model: modelAId, latency_ms: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 });
      }

      if (resB.status === 'fulfilled') {
        setResultB(resB.value);
        setLogs(p => [...p, `[SYSTEM] Model B (${resB.value.provider}): ${resB.value.latency_ms}ms · ${(resB.value.input_tokens + resB.value.output_tokens)} tokens · $${resB.value.cost_usd?.toFixed(5)}`]);
      } else {
        setResultB({ response_text: `❌ ${resB.reason?.message ?? 'Inference failed'}`, provider: modelBId, model: modelBId, latency_ms: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 });
      }

      setExecState('success');
      setFloatingVal('+10 VNP');
      setFloatingColor('text-green-400 font-bold');
      const auditEvidence = capiEvidenceHash || String(resultA?.audit_id || resultB?.audit_id || '');
      setLastStatus(auditEvidence ? 'Backend audit recorded' : 'Needs backend evidence hash');
      appendLedger('GOVERNED_RUN', auditEvidence ? 'Backend audit recorded' : 'Needs proof', auditEvidence ? 'SUCCESS' : 'NEEDS_PROOF', auditEvidence);
      setLogs(p => [...p, auditEvidence ? '[SYSTEM] Execution settled with backend evidence.' : '[SYSTEM] Inference returned without backend evidence hash.']);

    } catch (err: any) {
      setExecState('error');
      setExecError(err?.message ?? 'Unexpected error');
      setLogs(p => [...p, `[ERROR] ${err?.message ?? 'Execution failed'}`]);
    }
  };

  const handleReset = () => {
    setExecState('idle'); setIsSimulation(false); setActiveThreat(null);
    setTrace(null); setLogs([]); setResultA(null); setResultB(null);
    setSlashedStake(0); setFloatingVal(null); setExecError(null);
    setLastStatus('No backend run yet');
  };

  const handleExportAudit = () => {
    const blob = new Blob([JSON.stringify({
      timestamp: new Date().toISOString(), systemPrompt, userPrompt, is_simulation: isSimulation,
      config: { modelA: modelAId, modelB: modelBId, maxTokens, temperature },
      gateway_trace: trace, results: { A: resultA, B: resultB },
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `veklom-audit-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleRotateNonce = () => {
    setIsRotating(true);
    setTimeout(() => {
      setNonce('');
      setIsRotating(false);
    }, 900);
  };

  const isRunning = execState === 'gateway' || execState === 'inferring';
  const modelA = models.find(m => m.id === modelAId);
  const modelB = models.find(m => m.id === modelBId);

  // Cost delta at daily volume
  const projCostA = costA != null ? costA * dailyVolume * 30 : null;
  const projCostB = costB != null ? costB * dailyVolume * 30 : null;
  const cheaper = projCostA != null && projCostB != null
    ? projCostA < projCostB ? 'A' : projCostB < projCostA ? 'B' : null
    : null;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#030303] text-[#a4c5d4] font-mono p-4 xl:p-5 overflow-y-auto relative select-none">
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#b8860b]/5 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* ── Header ── */}
      <div className="border border-white/10 rounded-2xl bg-[#090D14]/85 backdrop-blur-xl px-5 py-4 mb-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 px-2.5 py-1 text-[9px] font-mono border-l border-b border-white/10 text-[#b8860b] bg-black/40 rounded-bl-xl">
          VEKLOM_PLAYGROUND_v2.0
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#b8860b]/10 border border-[#b8860b]/30 flex items-center justify-center text-[#b8860b]">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wider flex flex-wrap items-center gap-2">
                VEKLOM GOVERNED PLAYGROUND
                <span className="text-[9px] bg-[#b8860b]/20 text-[#b8860b] px-2 py-0.5 rounded border border-[#b8860b]/30">COGNITIVE INLINE GATEWAY</span>
                {isSimulation && (
                  <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 animate-pulse flex items-center gap-1">
                    <TestTube2 className="w-3 h-3" /> SIMULATION MODE
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {isSimulation
                  ? 'Testing how the gateway handles adversarial input — not a real inference run.'
                  : 'Every prompt passes through 5 real security moats before hitting a real model. Always.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {vnpBalance !== null && (
              <div className="px-3 py-1.5 bg-black/50 border border-white/5 rounded-xl text-center">
                <div className="text-[8px] text-gray-500 uppercase">Balance</div>
                <div className="text-white font-bold text-[10px]">${vnpBalance.toFixed(2)}</div>
              </div>
            )}
            <div className={`px-3 py-1.5 rounded-xl border text-center transition-all ${
              execState === 'blocked' ? 'border-red-500/30 bg-red-500/5' :
              execState === 'success' ? 'border-green-500/30 bg-green-500/5' :
              isRunning              ? 'border-[#b8860b]/30 bg-[#b8860b]/5 animate-pulse' :
              'border-white/5 bg-black/30'
            }`}>
              <div className="text-[8px] text-gray-500 uppercase">Status</div>
              <div className={`font-bold text-[9px] ${
                execState === 'blocked' ? 'text-red-400' : execState === 'success' ? 'text-green-400' :
                execState === 'gateway' ? 'text-[#b8860b]' : execState === 'inferring' ? 'text-cyan-400' :
                execState === 'error' ? 'text-red-500' : 'text-gray-500'
              }`}>
                {execState === 'idle' ? 'ARMED' : execState === 'gateway' ? 'TRACING' :
                 execState === 'inferring' ? 'INFERRING' : execState === 'success' ? 'SETTLED' :
                 execState === 'blocked' ? 'BLOCKED' : 'ERROR'}
              </div>
            </div>
            <button onClick={handleReset} className="flex items-center gap-1 border border-white/10 hover:border-white/20 text-[9px] px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-gray-400 active:scale-[0.97]">
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── 3-Column Body ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

        {/* ═══ LEFT: Configure ═══ */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-4 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-bold text-white tracking-widest flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#b8860b]" /> 1. CONFIGURE
              </span>
            </div>

            {/* Model selectors with real pricing */}
            {(['A', 'B'] as const).map((key) => {
              const selId = key === 'A' ? modelAId : modelBId;
              const setSel = key === 'A' ? setModelAId : setModelBId;
              const projCost = key === 'A' ? projCostA : projCostB;
              const isCheaper = cheaper === key;
              return (
                <div key={key} className={`space-y-1 p-2.5 rounded-xl border ${isCheaper ? 'border-green-500/20 bg-green-500/[0.03]' : 'border-white/5 bg-black/20'}`}>
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] text-gray-500 uppercase tracking-wider">Model {key}</label>
                    {isCheaper && <span className="text-[8px] text-green-400 font-bold">✓ CHEAPER</span>}
                  </div>
                  <select
                    value={selId}
                    onChange={e => setSel(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-[10px] text-white outline-none focus:border-[#b8860b]/50"
                  >
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  {projCost !== null && (
                    <div className="text-[8.5px] text-gray-500 flex justify-between">
                      <span>${(costA !== null && key === 'A' ? costA : costB ?? 0).toFixed(6)}/call</span>
                      <span className={isCheaper ? 'text-green-400' : 'text-gray-400'}>${projCost.toFixed(2)}/mo at {dailyVolume}/day</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Volume slider for projection */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[9px] text-gray-500 uppercase tracking-wider">Daily Volume (for cost projection)</label>
                <span className="text-[9px] text-white">{dailyVolume.toLocaleString()}/day</span>
              </div>
              <input type="range" min="100" max="50000" step="100" value={dailyVolume} onChange={e => setDailyVolume(Number(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded appearance-none cursor-pointer" />
            </div>

            {/* Params */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase">Max Tokens</label>
                <input type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-[10px] text-white outline-none focus:border-[#b8860b]/50" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase">Temperature</label>
                <input type="number" step="0.1" min="0" max="2" value={temperature} onChange={e => setTemperature(Number(e.target.value))}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-[10px] text-white outline-none focus:border-[#b8860b]/50" />
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-1">
              <button onClick={() => setShowSys(!showSys)} className="flex items-center gap-1 w-full text-[9px] text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors">
                System Prompt {showSys ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showSys && (
                <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                  placeholder="Optional system instructions…" rows={3}
                  className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none focus:border-[#b8860b]/50 resize-none" />
              )}
            </div>

            {/* Prompt */}
            <div className="space-y-1">
              <label className="text-[9px] text-gray-500 uppercase">Your Prompt</label>
              <textarea
                value={userPrompt} onChange={e => setUserPrompt(e.target.value)}
                rows={5} spellCheck={false}
                placeholder="Enter your prompt here. Hit Run — it goes through the real Veklom gateway before reaching the model."
                className="w-full bg-black/60 border border-white/10 rounded-lg p-2.5 text-[11px] text-[#00E5FF] outline-none focus:border-[#b8860b]/50 resize-none"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRun(null); }}
              />
            </div>

            {/* Run */}
            <button onClick={() => handleRun(null)} disabled={isRunning || !userPrompt.trim()}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black py-2.5 rounded-xl font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] shadow-lg">
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? (execState === 'gateway' ? 'Running Gateway…' : 'Inferring…') : 'Run Governed Prompt  ⌘↵'}
            </button>

            {/* Threat Scenarios — explicitly labeled as simulation */}
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[9px] text-gray-500 uppercase tracking-wider">
                <TestTube2 className="w-3 h-3 text-orange-400" />
                Gateway Simulation Tests
                <span className="text-[8px] text-orange-400 border border-orange-500/20 px-1 rounded ml-1">SIMULATED</span>
              </div>
              <p className="text-[8.5px] text-gray-600 leading-relaxed">
                These inject adversarial payloads to show you how the gateway would block real threats. Not a live inference.
              </p>
              {(Object.entries(THREAT_SCENARIOS) as [ThreatId, typeof THREAT_SCENARIOS[keyof typeof THREAT_SCENARIOS]][]).map(([id, sc]) => {
                const Icon = sc.icon;
                return (
                  <button key={id} onClick={() => handleRun(id)} disabled={isRunning}
                    className={`w-full flex items-start gap-2 p-2.5 rounded-xl border text-left text-[9px] transition-all disabled:opacity-40
                      ${sc.color === 'red'    ? 'border-red-500/20 bg-red-500/[0.02] hover:bg-red-500/5 text-red-400' : ''}
                      ${sc.color === 'orange' ? 'border-orange-500/20 bg-orange-500/[0.02] hover:bg-orange-500/5 text-orange-400' : ''}
                      ${sc.color === 'yellow' ? 'border-yellow-500/20 bg-yellow-500/[0.02] hover:bg-yellow-500/5 text-yellow-400' : ''}
                    `}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">{sc.label}</div>
                      <div className="text-[8px] opacity-60 mt-0.5">{sc.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: Gateway + Responses ═══ */}
        <div className="xl:col-span-6 flex flex-col gap-4">

          {/* Gateway Pipeline */}
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-[10px] font-bold text-white tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> 2. COGNITIVE GATEWAY
              </span>
              {isSimulation && (
                <span className="text-[8px] text-orange-400 border border-orange-500/20 bg-orange-500/5 px-2 py-0.5 rounded">SIMULATION</span>
              )}
            </div>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 min-h-[100px] relative overflow-hidden mb-2">
              {trace === null ? (
                <div className="flex items-center justify-center h-20 text-gray-600 text-[9px]">
                  <Eye className="w-3.5 h-3.5 mr-1.5" /> Hit Run to see your prompt pass through the gateway
                </div>
              ) : (
                <Pipeline trace={trace as any} runId={runId} />
              )}
            </div>
            <div className="bg-black rounded-xl p-2.5 h-20 overflow-y-auto border border-white/5 text-[8.5px] leading-relaxed select-text">
              {logs.length === 0 ? <div className="text-gray-700 italic h-full flex items-center justify-center">Console output…</div>
              : logs.map((l, i) => (
                <div key={i} className={
                  l.startsWith('[SYSTEM]')     ? 'text-cyan-400' :
                  l.startsWith('[ERROR]')      ? 'text-red-500 font-bold' :
                  l.startsWith('[GATEWAY]')    ? 'text-[#b8860b]' :
                  l.startsWith('[SIMULATION]') ? 'text-orange-400' :
                  'text-gray-400'
                }>{l}</div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>

          {/* Model Responses — real data from /ai/inference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              { key: 'A', modelId: modelAId, result: resultA },
              { key: 'B', modelId: modelBId, result: resultB },
            ] as const).map(({ key, modelId, result }) => {
              const modelDef = models.find(m => m.id === modelId);
              return (
                <div key={key} className="border border-white/10 rounded-2xl bg-[#090D14]/70 backdrop-blur-xl p-4 shadow-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b8860b]" />
                      Model {key}{modelDef ? ` — ${modelDef.provider}` : ''}
                    </span>
                    {result && (
                      <div className="text-[8px] text-gray-500 font-mono text-right">
                        <div>{result.latency_ms}ms</div>
                        <div>{result.input_tokens + result.output_tokens}t · ${result.cost_usd?.toFixed(5)}</div>
                      </div>
                    )}
                  </div>

                  <div className="h-52 overflow-y-auto scrollbar-thin pr-1">
                    {isRunning && !result && (
                      <div className="h-full flex items-center justify-center text-gray-600 text-[9px] animate-pulse">
                        {execState === 'gateway' ? 'Awaiting gateway clearance…' : 'Calling real model…'}
                      </div>
                    )}
                    {execState === 'blocked' && !result && (
                      <div className="h-full flex flex-col items-center justify-center text-red-500/60 text-[9px] font-bold text-center px-4 gap-2">
                        <ShieldAlert className="w-6 h-6" />
                        GATEWAY BLOCKED
                        <span className="font-normal text-gray-600">Threat was caught. Inference never dispatched.</span>
                      </div>
                    )}
                    {result?.response_text && (
                      <div className="prose prose-invert prose-xs max-w-none text-[11px] font-sans">
                        <ReactMarkdown>{result.response_text}</ReactMarkdown>
                      </div>
                    )}
                    {execState === 'idle' && !result && (
                      <div className="h-full flex items-center justify-center text-gray-700 text-[9px] font-mono text-center">Real model response appears here</div>
                    )}
                  </div>

                  {/* Run Receipt — appears after success */}
                  {result && execState === 'success' && (
                    <div className="border-t border-white/5 pt-2 space-y-1">
                      <div className="text-[8px] text-gray-500 uppercase tracking-wider">Run Receipt</div>
                      <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono">
                        <div className="text-gray-500">Provider <span className="text-white">{result.provider}</span></div>
                        <div className="text-gray-500">Model <span className="text-white">{result.model?.split(':')[0]}</span></div>
                        <div className="text-gray-500">Latency <span className="text-white">{result.latency_ms}ms</span></div>
                        <div className="text-gray-500">Cost <span className="text-white">${result.cost_usd?.toFixed(5)}</span></div>
                        {result.cache_hit && <div className="col-span-2 text-cyan-400">⚡ Cache hit: {result.cache_hit}</div>}
                        {result.audit_id && <div className="col-span-2 text-gray-600">Audit #{result.audit_id}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions row */}
          {execState === 'success' && (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleExportAudit}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#090D14] border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-[9px] font-bold text-gray-300">
                <Download className="w-3 h-3" /> Export Audit Package
              </button>
              <a href="/workspace" className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#b8860b]/10 border border-[#b8860b]/20 rounded-xl hover:bg-[#b8860b]/20 transition-colors text-[9px] font-bold text-[#b8860b]">
                <Zap className="w-3 h-3" /> Deploy This Config →
              </a>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Identity + VNP Ledger ═══ */}
        <div className="xl:col-span-3 flex flex-col gap-4">

          {/* Machine Identity Vault */}
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-[10px] font-bold text-white tracking-widest flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> 3. IDENTITY VAULT
              </span>
              <span className="text-[9px] text-[#b8860b] font-mono">SEKED_SWAP</span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5">
                <span className="text-[8px] text-gray-500 uppercase">Model sees (shielded)</span>
                <div className="text-[9px] font-mono text-cyan-400 mt-1.5 bg-cyan-950/20 p-1.5 rounded border border-cyan-500/10 break-all leading-relaxed">
                  {execState === 'success' && activeThreat === 'credentials'
                    ? <span className="text-yellow-400 font-bold">Simulation redaction preview</span>
                    : execState === 'success'
                    ? <span className="text-green-400">{nonce || 'No nonce emitted by backend response'}</span>
                    : <span className="text-gray-600 italic">Waiting for backend receipt.</span>
                  }
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-black/50 border border-[#b8860b]/15">
                <span className="text-[8px] text-[#b8860b] uppercase font-bold">cAPI Gateway dispatch</span>
                <div className="text-[9px] font-mono text-gray-400 mt-1.5 bg-[#b8860b]/5 p-1.5 rounded border border-[#b8860b]/10 break-all">
                  {execState === 'success'
                    ? <span className="text-[#b8860b] font-bold">Backend receipt required for this panel.</span>
                    : 'GATEWAY: No backend receipt yet.'}
                </div>
              </div>
              <button onClick={handleRotateNonce} disabled={isRotating}
                className="w-full flex items-center justify-center gap-1.5 border border-[#b8860b]/20 hover:border-[#b8860b]/40 bg-[#b8860b]/5 hover:bg-[#b8860b]/10 text-[#b8860b] py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all disabled:opacity-50">
                <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
                {isRotating ? 'Rotating…' : 'Rotate Nonce'}
              </button>
            </div>
          </div>

          {/* VNP SLA Ledger */}
          <div className="border border-white/10 rounded-2xl bg-[#090D14]/80 backdrop-blur-xl p-4 shadow-xl flex-1 relative overflow-hidden">
            <AnimatePresence>
              {floatingVal && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: -25 }} exit={{ opacity: 0 }}
                  transition={{ duration: 1.5 }}
                  className={`absolute right-4 top-1/4 text-xs ${floatingColor} bg-black/80 px-2 py-1 rounded border border-white/10 z-10`}>
                  {floatingVal}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
              <span className="text-[10px] font-bold text-white tracking-widest flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-orange-400 animate-pulse" /> 4. BACKEND EVIDENCE
              </span>
              <span className="text-[9px] text-orange-400 font-mono">NO LOCAL FAKE HASHES</span>
            </div>
            <div className={`p-2 rounded-lg border text-[8.5px] mb-3 ${slashedStake > 0 ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-white/5'}`}>
              <span className="text-[8px] text-gray-500 uppercase block">Last run</span>
              <span className={`font-bold block ${slashedStake > 0 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>{lastStatus}</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
              {ledger.length === 0 && (
                <div className="p-3 rounded border border-white/5 bg-black/30 text-[9px] text-gray-500">
                  No backend evidence rows recorded in this browser session.
                </div>
              )}
              {ledger.map(block => {
                const slashed = block.status === 'SLASHED';
                return (
                  <div key={block.index} className={`p-2 rounded border text-[8px] font-mono leading-relaxed ${slashed ? 'border-red-500/25 bg-red-950/10 text-red-400' : 'border-white/5 bg-black/40 text-gray-400'}`}>
                    <div className="flex justify-between font-bold mb-0.5">
                      <span>#{block.index}</span>
                      <span className={slashed ? 'text-red-500' : 'text-green-400'}>{block.vnpStake}</span>
                    </div>
                    <div className="text-gray-600 flex justify-between border-b border-white/5 pb-1 mb-1">
                      <span>{block.timestamp}</span>
                      <span>{block.action}</span>
                    </div>
                    <div className="text-[7px] text-gray-700 truncate">HASH: {block.hash}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
