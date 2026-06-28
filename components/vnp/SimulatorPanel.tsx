import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, RotateCcw, Shield, Lock, Terminal, Zap,
  CheckCircle, Clock, AlertTriangle, Network,
  FileText, Cpu, GitCommit, Package,
  Activity, Copy, ShieldAlert, XCircle,
  Radio, Settings, Database, Eye,
} from 'lucide-react';
import { useWebMCP } from '@/hooks/useWebMCP';

// ── Types ──────────────────────────────────────────────────────────────────
type StepStatus = 'pending' | 'running' | 'completed' | 'blocked' | 'quarantined';
type ThreatLevel = 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type SEKEDDirective = 'HALT' | 'WAIT' | 'STABILIZE' | 'GRIND' | 'CLARIFY' | 'FORTIFY' | 'EXECUTE' | 'EXPAND';

interface PipelineStep {
  id: number;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  status: StepStatus;
  duration_ms?: number;
  hash?: string;
}

interface PresetIntent {
  id: string;
  label: string;
  description: string;
  threat: ThreatLevel;
  action: string;
  payload: Record<string, any>;
}

// ── Pipeline Definitions ───────────────────────────────────────────────────
const PIPELINE_DEFS: Omit<PipelineStep, 'status' | 'duration_ms' | 'hash'>[] = [
  { id: 0, name: 'IDENTITY & SECURITY', subtitle: 'Agent resolution + Signature + Replay check',   icon: Radio },
  { id: 1, name: 'CAPABILITY & POLICY', subtitle: 'Policy composition + Temporal + Delegation',  icon: Shield },
  { id: 2, name: 'SAFETY & ANOMALY',    subtitle: 'Behavioral baseline + Anomaly detection',     icon: Activity },
  { id: 3, name: 'COST & BUDGET',       subtitle: 'Cost model lookup + Spend limits',            icon: Zap },
  { id: 4, name: 'APPROVAL WORKFLOW',   subtitle: 'M-of-N quorum + Quarantine state',            icon: CheckCircle },
  { id: 5, name: 'EXECUTION',           subtitle: 'Sandboxed capability run',                    icon: Terminal },
  { id: 6, name: 'EVIDENCE & PROOF',    subtitle: 'PGL Merkle proof generation + EAT issue',     icon: Lock },
  { id: 7, name: 'AUDIT & COMPLIANCE',  subtitle: 'Trust score update + Behavioral learning',    icon: FileText },
  { id: 8, name: 'RESPONSE',            subtitle: 'Result Egress + Metadata sync',               icon: Network },
];

// ── Threat Scenarios ───────────────────────────────────────────────────────
const PRESETS: PresetIntent[] = [
  {
    id: 'clean_run',
    label: 'Governed Execution',
    description: 'Standard agent task within all policy bounds',
    threat: 'CLEAN',
    action: 'email.send',
    payload: { to: 'team@company.com', subject: 'Digest' }
  },
  {
    id: 'rogue_db',
    label: 'Rogue DB Write',
    description: 'Agent attempts unauthorized database modification',
    threat: 'CRITICAL',
    action: 'db.drop_tables',
    payload: { table: 'users' }
  },
  {
    id: 'anomaly_quarantine',
    label: 'Syscall Escalation',
    description: 'Agent attempts raw syscall execution requiring quorum',
    threat: 'MEDIUM',
    action: 'syscall_execute',
    payload: { command: 'rm -rf /' }
  }
];

const SEKED_STYLES: Record<SEKEDDirective, string> = {
  HALT:      'text-[#FF003C] bg-[#FF003C]/10 border-[#FF003C]/30',
  WAIT:      'text-[#FFAB00] bg-[#FFAB00]/10 border-[#FFAB00]/30',
  STABILIZE: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  GRIND:     'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/30',
  CLARIFY:   'text-[#00E5FF] bg-[#00E5FF]/10 border-[#00E5FF]/30',
  FORTIFY:   'text-violet-400 bg-violet-400/10 border-violet-400/30',
  EXECUTE:   'text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30',
  EXPAND:    'text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/30',
};

// ── Component ──────────────────────────────────────────────────────────────
export default function SimulatorPanel() {
  const { executeGovernedAction } = useWebMCP();
  
  const [scenario, setScenario] = useState<PresetIntent>(PRESETS[0]);
  const [intent, setIntent] = useState("Summarize last week's support tickets and send the digest to team@company.com");
  const [pipeline, setPipeline] = useState<PipelineStep[]>(
    PIPELINE_DEFS.map(d => ({ ...d, status: 'pending' }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [eatToken, setEatToken] = useState<string | null>(null);
  const [seked, setSeked] = useState<SEKEDDirective>('EXECUTE');
  const [blockReason, setBlockReason] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [agentModel, setAgentModel] = useState('gemini-pro');
  const [budgetCap, setBudgetCap] = useState(4.20);
  const [safetyLevel, setSafetyLevel] = useState<'standard' | 'elevated' | 'maximum'>('elevated');
  const [policyTab, setPolicyTab] = useState<'agent' | 'policy' | 'history'>('agent');
  const [runCount, setRunCount] = useState(1441);
  const [blockedCount, setBlockedCount] = useState(27);
  const [eatCount, setEatCount] = useState(1414);
  const [avgLatency, setAvgLatency] = useState(312);
  const termRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [terminalLines]);

  // Live metric flicker
  useEffect(() => {
    const t = setInterval(() => {
      if (!isRunning) {
        setRunCount(c => c + Math.floor(Math.random() * 2));
        setAvgLatency(l => Math.max(200, l + (Math.random() > 0.5 ? 6 : -6)));
      }
    }, 2500);
    return () => clearInterval(t);
  }, [isRunning]);

  const reset = useCallback(() => {
    setPipeline(PIPELINE_DEFS.map(d => ({ ...d, status: 'pending' })));
    setTerminalLines([]);
    setEatToken(null);
    setBlockReason(null);
    setSeked('EXECUTE');
  }, []);

  const run = useCallback(async () => {
    if (isRunning) return;
    reset();
    setIsRunning(true);
    setSeked('GRIND');

    const ts = () => new Date().toLocaleTimeString('en-US', { hour12: false });
    const push = (line: string) => setTerminalLines(prev => [...prev, `[${ts()}] ${line}`]);

    push(`EXEC_START — "${scenario.label}" — agent: ${agentModel}`);
    push(`Budget cap: $${budgetCap.toFixed(2)} | Safety: ${safetyLevel.toUpperCase()} | PGL identity: verified`);
    push(`[WebMCP] Routing live execution intent to backend...`);

    let finalPhase = 8;
    let isSuccess = true;
    
    try {
      // 1. Fire to the real cAPI backend
      const receipt = await executeGovernedAction({
        agent_id: 'agent-001',
        pgl_id: 'PGL_TEST_SIG',
        target_protocol: 'simulator',
        action: scenario.action,
        payload: scenario.payload
      });
      
      push(`[WebMCP] Response status: ${receipt.status.toUpperCase()}`);

      // 2. Play out the pipeline visualization dynamically based on response
      if (receipt.status === 'quarantined') {
        isSuccess = false;
        finalPhase = receipt.phase ?? 4;
        setBlockReason(`QUARANTINED: ${receipt.reason || 'Manual review required'}`);
        push(`⚠ Phase ${finalPhase + 1}: QUARANTINE — ${receipt.reason}`);
        push(`→ HTTP 202 Accepted returned. Quarantine ID: ${receipt.quarantine_id}`);
      } else if (receipt.status === 'rejected') {
        isSuccess = false;
        finalPhase = receipt.phase ?? 1;
        setBlockReason(`BLOCKED: ${receipt.error} - ${receipt.reason}`);
        push(`⚠ Phase ${finalPhase + 1}: BLOCK — ${receipt.reason}`);
        push(`✕ Execution HALTED at Phase ${finalPhase + 1}.`);
      } else {
        // Success
        push(`→ Phase 6: Executing — live sandboxed run`);
        push(`→ Phase 7: Evidence — Merkle proof generated on PGL: ${receipt.evidence_chain_id}`);
        push(`→ Phase 8: Audit — Trust score updated (${receipt.new_trust_score})`);
      }

      // Visual delay loop for pipeline steps
      for (let i = 0; i <= finalPhase; i++) {
        setPipeline(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));
        await new Promise(r => setTimeout(r, 400 + Math.random() * 200));

        if (i === finalPhase && !isSuccess) {
          if (receipt.status === 'quarantined') {
            setPipeline(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'quarantined' } : s));
            setSeked('WAIT');
          } else {
            setPipeline(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'blocked' } : s));
            setSeked('HALT');
            setBlockedCount(c => c + 1);
          }
          setIsRunning(false);
          return;
        }

        const hash = `sha256:${Math.random().toString(16).slice(2, 18)}`;
        setPipeline(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'completed', duration_ms: 100, hash } : s));
      }

      if (isSuccess) {
        setEatToken(receipt.evidence_chain_id || `EAT_${Date.now().toString(16).toUpperCase()}`);
        setSeked('EXECUTE');
        push(`→ EAT issued: ${receipt.evidence_chain_id}`);
        push(`EXEC_COMPLETE — all 9 gates cleared ✓ — evidence sealed`);
        setEatCount(c => c + 1);
        setRunCount(c => c + 1);
      }
      
    } catch(e: any) {
      push(`[WebMCP] Network Error: ${e.toString()}`);
      setPipeline(prev => prev.map((s, idx) => idx === 0 ? { ...s, status: 'blocked' } : s));
      setBlockReason(`NETWORK_ERROR: ${e.message}`);
      setSeked('HALT');
    }
    
    setIsRunning(false);
  }, [isRunning, scenario, agentModel, budgetCap, safetyLevel, reset, executeGovernedAction]);

  const stepBorderClass = (s: StepStatus) => {
    if (s === 'completed') return 'border-[#00FF66]/30 bg-[#00FF66]/[0.03]';
    if (s === 'running')   return 'border-[#FFB800]/50 bg-[#FFB800]/[0.04]';
    if (s === 'blocked')   return 'border-[#FF003C]/30 bg-[#FF003C]/[0.03]';
    if (s === 'quarantined') return 'border-[#8B5CF6]/40 bg-[#8B5CF6]/[0.04]';
    return 'border-slate-800 bg-[#101010]';
  };

  const stepNumClass = (s: StepStatus) => {
    if (s === 'completed') return 'border-[#00FF66]/30 bg-[#00FF66]/10 text-[#00FF66]';
    if (s === 'running')   return 'border-[#FFB800]/40 bg-[#FFB800]/10 text-[#FFB800]';
    if (s === 'blocked')   return 'border-[#FF003C]/30 bg-[#FF003C]/10 text-[#FF003C]';
    if (s === 'quarantined') return 'border-[#8B5CF6]/30 bg-[#8B5CF6]/10 text-[#8B5CF6]';
    return 'border-slate-800 bg-[#0A0A0A] text-slate-500';
  };

  const stepNameClass = (s: StepStatus) => {
    if (s === 'completed') return 'text-[#00FF66]';
    if (s === 'running')   return 'text-[#FFB800]';
    if (s === 'blocked')   return 'text-[#FF003C]';
    if (s === 'quarantined') return 'text-[#8B5CF6]';
    return 'text-slate-400';
  };

  const termLineClass = (line: string) => {
    if (line.includes('✕') || line.includes('⚠ BLOCK') || line.includes('HALTED')) return 'text-[#FF003C]';
    if (line.includes('⚠')) return 'text-[#FFAB00]';
    if (line.includes('✓') || line.includes('EAT') || line.includes('COMPLETE')) return 'text-[#00FF66]';
    return 'text-slate-400';
  };

  const threatBadgeClass = (t: ThreatLevel) => {
    if (t === 'CLEAN')    return 'text-[#00FF66] border-[#00FF66]/25 bg-[#00FF66]/5';
    if (t === 'CRITICAL') return 'text-[#FF003C] border-[#FF003C]/25 bg-[#FF003C]/5';
    return 'text-[#FFAB00] border-[#FFAB00]/25 bg-[#FFAB00]/5';
  };

  const sekedMetrics = {
    E: seked === 'HALT' ? 11 : seked === 'GRIND' ? 76 : 92,
    R: 94,
    C: seked === 'HALT' ? 14 : seked === 'GRIND' ? 70 : 97,
    D: 88,
    S: seked === 'HALT' ? 38 : 97,
  };

  return (
    <div className="bg-[#0b1017] rounded-2xl min-h-[480px]">
      <div className="grid grid-cols-[288px_1fr_308px] gap-5 items-start p-6">

        {/* ─────────── LEFT: Config Panel ─────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Intent */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-2">Agent Intent</div>
            <textarea
              value={intent}
              onChange={e => setIntent(e.target.value)}
              disabled={isRunning}
              rows={4}
              className="w-full bg-[#070b12] border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-slate-300 font-mono resize-none focus:outline-none focus:border-[#FFB800]/40 placeholder-slate-600 disabled:opacity-50 transition-colors"
              placeholder="Describe what the agent should do…"
            />
          </div>

          {/* Config Tabs */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex border-b border-slate-800">
              {(['agent', 'policy', 'history'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setPolicyTab(t)}
                  className={`flex-1 py-2.5 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors ${
                    policyTab === t
                      ? 'text-[#FFB800] bg-[#FFB800]/5 border-b-2 border-[#FFB800]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="p-4">
              {policyTab === 'agent' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-1.5">Model (VNP Graded)</label>
                    <select
                      value={agentModel}
                      onChange={e => setAgentModel(e.target.value)}
                      className="w-full bg-[#070b12] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-[#FFB800]/40"
                    >
                      <option value="gemini-pro">Gemini Pro — VNP 94 · T1</option>
                      <option value="gpt-4o">GPT-4o — VNP 91 · T1</option>
                      <option value="claude-3">Claude 3.7 — VNP 89 · T2</option>
                      <option value="ollama-local">Ollama Local — VNP 98 · T1</option>
                      <option value="deepseek">DeepSeek R1 — VNP 82 · T3</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-1.5">Safety Level</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['standard', 'elevated', 'maximum'] as const).map(l => (
                        <button
                          key={l}
                          onClick={() => setSafetyLevel(l)}
                          className={`py-1.5 rounded text-[9px] font-mono font-bold uppercase border transition-all ${
                            safetyLevel === l
                              ? 'bg-[#FFB800]/10 border-[#FFB800]/40 text-[#FFB800]'
                              : 'bg-[#070b12] border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mb-1.5">
                      Budget Cap: <span className="text-[#FFB800]">${budgetCap.toFixed(2)}</span>
                    </label>
                    <input
                      type="range" min={0.5} max={50} step={0.5} value={budgetCap}
                      onChange={e => setBudgetCap(parseFloat(e.target.value))}
                      className="w-full accent-[#FFB800]"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                      <span>$0.50</span><span>$50.00</span>
                    </div>
                  </div>
                </div>
              )}
              {policyTab === 'policy' && (
                <div className="space-y-2">
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Tool Access Control List</div>
                  {[
                    { tool: 'db.write',      allowed: false, note: 'READ_ONLY scope enforced' },
                    { tool: 'git.push(main)', allowed: false, note: 'Requires HITL gate' },
                    { tool: 'exec_shell',     allowed: false, note: 'BLOCKED — all environments' },
                    { tool: 'send_email',     allowed: true,  note: 'Approved domain list' },
                    { tool: 'web.search',     allowed: true,  note: 'Unrestricted' },
                    { tool: 'file.read',      allowed: true,  note: 'Sandboxed FS only' },
                  ].map(p => (
                    <div key={p.tool} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                      <div>
                        <div className="text-[10px] font-mono text-slate-300">{p.tool}</div>
                        <div className="text-[9px] font-mono text-slate-500">{p.note}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${p.allowed ? 'bg-[#00FF66]' : 'bg-[#FF003C]'}`} />
                    </div>
                  ))}
                </div>
              )}
              {policyTab === 'history' && (
                <div className="space-y-1.5">
                  <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">Recent Executions</div>
                  {[
                    { id: 'EAT_1FA3C8', status: 'sealed',  time: '2m ago',  label: 'Governed' },
                    { id: 'INC-7823',    status: 'blocked', time: '14m ago', label: 'Rogue DB' },
                    { id: 'EAT_1F9AB2', status: 'sealed',  time: '28m ago', label: 'Governed' },
                    { id: 'INC-7822',    status: 'blocked', time: '1h ago',  label: 'Prompt Inj.' },
                    { id: 'EAT_1F5D29', status: 'sealed',  time: '2h ago',  label: 'Governed' },
                  ].map(r => (
                    <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-0">
                      <div>
                        <div className={`text-[10px] font-mono ${r.status === 'sealed' ? 'text-[#00FF66]' : 'text-[#FF003C]'}`}>
                          {r.id}
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">{r.label}</div>
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">{r.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Threat Scenarios */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-3">Live Threat Testing</div>
            <div className="space-y-1.5">
              {PRESETS.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setScenario(s); reset(); }}
                  disabled={isRunning}
                  className={`w-full text-left p-3 rounded-lg border transition-all disabled:opacity-40 ${
                    scenario.id === s.id
                      ? 'border-[#FFB800]/40 bg-[#FFB800]/5'
                      : 'border-slate-800 bg-[#070b12] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[11px] font-semibold ${scenario.id === s.id ? 'text-[#FFB800]' : 'text-slate-300'}`}>
                      {s.label}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${threatBadgeClass(s.threat)}`}>
                      {s.threat}
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-500">{s.description}</div>
                </button>
              ))}
            </div>
          </div>



          {/* Run / Reset */}
          <div className="flex gap-2">
            <button
              onClick={run}
              disabled={isRunning}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FFB800] hover:bg-[#E0A100] disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-sm transition-all shadow-[0_0_24px_rgba(255,184,0,0.12)] hover:shadow-[0_0_32px_rgba(255,184,0,0.22)]"
            >
              <Play className="w-4 h-4" />
              {isRunning ? 'Running…' : 'Run Enforcement'}
            </button>
            <button
              onClick={reset}
              disabled={isRunning}
              className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 transition-all disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─────────── CENTER: Pipeline ────────────────────────────────── */}
        <div className="flex flex-col gap-3">

          {/* Header card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">7-Step Deterministic Pipeline</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Every agent action passes every gate — cryptographically enforced, in order, every single time.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono shrink-0 ml-4">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#00FF66]" /><span className="text-slate-500">SEALED</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FFB800] animate-pulse" /><span className="text-slate-500">ACTIVE</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#FF003C]" /><span className="text-slate-500">BLOCKED</span></div>
              </div>
            </div>
          </div>

          {/* Pipeline Steps */}
          <div className="relative flex flex-col gap-0">
            {pipeline.map((step, idx) => {
              const Icon = step.icon;
              const done = step.status === 'completed';
              const active = step.status === 'running';
              const blocked = step.status === 'blocked';
              const isLast = idx === pipeline.length - 1;

              return (
                <div key={step.id} className="relative flex flex-col">
                  {/* connector top */}
                  {idx > 0 && (
                    <div className={`absolute left-[27px] top-0 w-0.5 h-3 -mt-3 ${done ? 'bg-[#00FF66]/30' : 'bg-slate-800'}`} />
                  )}
                  <div className={`rounded-xl border p-4 transition-all duration-500 ${stepBorderClass(step.status)}`}>
                    <div className="flex items-center gap-3">
                      {/* Step badge */}
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 text-sm font-mono font-bold ${stepNumClass(step.status)}`}>
                        {done    ? <CheckCircle className="w-4 h-4" /> :
                         blocked ? <XCircle className="w-4 h-4" /> :
                         active  ? <Clock className="w-4 h-4 animate-spin" /> :
                         <span>{idx + 1}</span>}
                      </div>

                      {/* Icon */}
                      <div className={`p-2 rounded-lg border ${
                        done    ? 'border-[#00FF66]/20 bg-[#00FF66]/5' :
                        active  ? 'border-[#FFB800]/30 bg-[#FFB800]/5' :
                        blocked ? 'border-[#FF003C]/20 bg-[#FF003C]/5' :
                        'border-slate-800 bg-[#0A0A0A]'
                      }`}>
                        <Icon className={`w-4 h-4 ${
                          done ? 'text-[#00FF66]' : active ? 'text-[#FFB800]' : blocked ? 'text-[#FF003C]' : 'text-slate-500'
                        }`} />
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold font-mono tracking-widest uppercase ${stepNameClass(step.status)}`}>
                          {step.name}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{step.subtitle}</div>
                      </div>

                      {/* Right info */}
                      <div className="shrink-0 text-right">
                        {done && step.duration_ms && (
                          <div>
                            <div className="text-[11px] font-mono font-bold text-[#00FF66]">{step.duration_ms}ms</div>
                            <div className="text-[9px] font-mono text-slate-500 max-w-[150px] truncate">{step.hash}</div>
                          </div>
                        )}
                        {blocked && (
                          <span className="text-[9px] font-mono font-bold text-[#FF003C] bg-[#FF003C]/10 border border-[#FF003C]/20 px-2 py-1 rounded">
                            HALTED
                          </span>
                        )}
                        {active && (
                          <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full w-3/5 bg-[#FFB800] rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* connector bottom */}
                  {!isLast && (
                    <div className={`absolute left-[27px] bottom-0 w-0.5 h-3 -mb-3 z-10 ${done ? 'bg-[#00FF66]/30' : 'bg-slate-800'}`} />
                  )}
                  {/* gap spacer */}
                  {!isLast && <div className="h-3" />}
                </div>
              );
            })}
          </div>

          {/* Block reason */}
          {blockReason && (
            <div className="bg-[#FF003C]/5 border border-[#FF003C]/25 rounded-xl p-4 mt-1">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#FF003C] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-[#FF003C] mb-1 font-mono tracking-wide">
                    EXECUTION BLOCKED BY POLICY ENGINE
                  </div>
                  <div className="text-[10px] font-mono text-[#FF003C]/70 leading-relaxed">{blockReason}</div>
                </div>
              </div>
            </div>
          )}

          {/* EAT Certificate */}
          {eatToken && (
            <div className="bg-[#00FF66]/[0.03] border border-[#00FF66]/25 rounded-xl p-5 mt-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00FF66]" />
                  <span className="text-xs font-bold text-[#00FF66] font-mono tracking-widest uppercase">
                    Execution Authorization Token — Issued
                  </span>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(eatToken); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[10px] font-mono">
                <div>
                  <div className="text-slate-500 uppercase mb-1">Token ID</div>
                  <div className="text-[#00FF66] font-bold break-all">{eatToken}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase mb-1">Issued At</div>
                  <div className="text-slate-300">{new Date().toISOString()}</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase mb-1">Authorized By</div>
                  <div className="text-slate-300">veklom-policy-engine@v5</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase mb-1">Trust Delta</div>
                  <div className="text-[#00FF66] font-bold">+2 Points</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase mb-1">Risk Score</div>
                  <div className="text-slate-300">12 / 100 (LOW)</div>
                </div>
                <div>
                  <div className="text-slate-500 uppercase mb-1">Valid Until</div>
                  <div className="text-slate-300">{new Date(Date.now() + 3600000).toISOString()}</div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#00FF66]/10 text-[9px] font-mono text-slate-500">
                MERKLE ROOT · {Math.random().toString(16).slice(2, 42)} · Base L2 Block #1,442,88{eatCount % 10}
              </div>
            </div>
          )}
        </div>

        {/* ─────────── RIGHT: Telemetry + Zero-Trust ───────────────────── */}
        <div className="flex flex-col gap-4">

          {/* SEKED State */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-3">SEKED Runtime Directive</div>
            <div className={`text-center py-5 rounded-xl border font-mono font-black text-3xl tracking-widest transition-all duration-500 ${SEKED_STYLES[seked]}`}>
              {seked}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-4">
              {(Object.entries(sekedMetrics) as [string, number][]).map(([k, v]) => (
                <div key={k} className="text-center">
                  <div className="text-[9px] font-mono text-slate-500 uppercase">{k}</div>
                  <div className={`text-xs font-bold font-mono mt-0.5 ${v < 50 ? 'text-[#FF003C]' : v < 75 ? 'text-[#FFAB00]' : 'text-[#00FF66]'}`}>{v}</div>
                  <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${v < 50 ? 'bg-[#FF003C]' : v < 75 ? 'bg-[#FFAB00]' : 'bg-[#00FF66]'}`} style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#070b12]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FFB800]" />
                <span className="text-[10px] font-mono font-bold tracking-widest text-slate-300 uppercase">Execution Trace</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF003C]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#FFAB00]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#00FF66]/50" />
              </div>
            </div>
            <div ref={termRef} className="h-56 overflow-y-auto p-4 font-mono text-[10px] leading-relaxed bg-[#030303] space-y-0.5">
              {terminalLines.length === 0
                ? <span className="text-slate-500">Select a scenario and press Run Enforcement…</span>
                : terminalLines.map((line, i) => (
                  <div key={i} className={termLineClass(line)}>{line}</div>
                ))
              }
              {isRunning && <div className="text-[#FFB800] animate-pulse">█</div>}
            </div>
          </div>

          {/* Enforcement Ledger */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-3">Enforcement Ledger</div>
            <div className="space-y-2.5">
              {[
                { label: 'EAT Issued (session)',  val: eatCount.toLocaleString(),         color: 'text-[#00FF66]'  },
                { label: 'Agent Trust Score',     val: '94 / 100',                         color: 'text-[#00FF66]'  },
                { label: 'Executions Blocked',    val: blockedCount,                       color: 'text-[#FF003C]'  },
                { label: 'Avg Pipeline Latency',  val: `${Math.round(avgLatency)}ms`,      color: 'text-[#00E5FF]'  },
                { label: 'Quarantined Requests',  val: scenario.id === 'anomaly_quarantine' && !isRunning ? '1 this session' : '0 this session', color: 'text-[#8B5CF6]' },
                { label: 'Governed Compute Spend', val: '$12.40',                          color: 'text-[#FFB800]'  },
                { label: 'Budget Remaining',       val: `$${(budgetCap - 0.80).toFixed(2)}`,color:'text-[#00FF66]' },
                { label: 'Policy Violations',      val: '0 this session',                 color: 'text-slate-400'  },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">{s.label}</span>
                  <span className={`text-[10px] font-mono font-bold ${s.color}`}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Zero-Trust Status */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mb-3">Zero-Trust Enforcement Stack</div>
            <div className="space-y-2">
              {[
                { label: 'ZeroTrustMiddleware',    status: 'ENFORCING', color: 'text-[#00FF66]' },
                { label: 'BudgetCheckMiddleware',   status: 'ACTIVE',    color: 'text-[#00FF66]' },
                { label: 'JWT Validation (PGL)',    status: 'VERIFIED',  color: 'text-[#00FF66]' },
                { label: 'MELT-Guard Behavioral',   status: 'WATCHING',  color: 'text-[#00E5FF]' },
                { label: 'HITL Gate',               status: 'ARMED',     color: 'text-[#FFAB00]' },
                { label: 'OPTIONS Preflight Bypass',status: 'ALLOWED',   color: 'text-slate-400' },
              ].map(z => (
                <div key={z.label} className="flex items-center justify-between py-1 border-b border-slate-800 last:border-0">
                  <span className="text-[10px] font-mono text-slate-400">{z.label}</span>
                  <span className={`text-[9px] font-mono font-bold ${z.color}`}>{z.status}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What this is */}
          <div className="bg-[#070b12] border border-slate-800 rounded-xl p-4">
            <div className="text-[9px] font-mono text-slate-500 leading-relaxed space-y-1.5">
              <p className="text-slate-300 font-bold">WHAT VEKLOM RUNTIME DOES</p>
              <p>Veklom decides what agents are allowed to do — before they do it — and verifies whether the systems they call are trustworthy enough to receive the action.</p>
              <p>Every execution is policy-gated, budget-bounded, identity-resolved, cryptographically sealed, and stored in the immutable evidence ledger.</p>
              <p className="text-[#FFB800]">No EAT = no execution. Always.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
