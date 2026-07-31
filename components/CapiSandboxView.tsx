import React, { useState } from 'react';
import { Terminal, Cpu, Zap, ShieldCheck, Play, Key, CheckCircle2, AlertCircle, RefreshCw, Layers, Database, Activity, Code, DollarSign, Lock, ShieldAlert } from 'lucide-react';
import { HarnessProvider, SystemMode, CAPIInvocationResponse, SkillSpec, OllamaStatus } from '../types.js';

interface CapiSandboxViewProps {
  mode: SystemMode;
  skills: SkillSpec[];
  ollamaStatus: OllamaStatus | null;
  refreshOllama: () => void;
}

export const CapiSandboxView: React.FC<CapiSandboxViewProps> = ({
  mode,
  skills,
  ollamaStatus,
  refreshOllama
}) => {
  const [selectedHarness, setSelectedHarness] = useState<HarnessProvider>('ollama');
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || 'skill-ecc-refactor-ts');
  const [paramInput, setParamInput] = useState<string>(
    JSON.stringify({ targetFilePath: 'src/components/App.tsx', optimizationLevel: 'O2' }, null, 2)
  );
  const [customModel, setCustomModel] = useState<string>('llama3.2:latest');
  const [ollamaEndpoint, setOllamaEndpoint] = useState<string>('http://167.233.202.195:11434');
  const [byokKey, setByokKey] = useState<string>('');
  const [containsPii, setContainsPii] = useState<boolean>(false);
  const [x402LeaseToken, setX402LeaseToken] = useState<string>('');
  const [x402LeaseInfo, setX402LeaseInfo] = useState<any>(null);
  const [isAcquiringLease, setIsAcquiringLease] = useState<boolean>(false);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [invocationResult, setInvocationResult] = useState<CAPIInvocationResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  const handleSelectSkill = (skillId: string) => {
    setSelectedSkillId(skillId);
    const sk = skills.find((s) => s.id === skillId);
    if (sk) {
      const defaultParams: Record<string, any> = {};
      sk.parameters.forEach((p) => {
        defaultParams[p.name] = p.default || (p.type === 'number' ? 1 : 'sample_value');
      });
      setParamInput(JSON.stringify(defaultParams, null, 2));
    }
  };

  const handleAcquireX402Lease = async () => {
    setIsAcquiringLease(true);
    setErrorMsg(null);
    try {
      // 1. Get Offer
      const offerRes = await fetch('/api/v1/x402/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: selectedSkillId })
      });
      
      // 2. Verify payment & issue lease token
      const verifyRes = await fetch('/api/v1/x402/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkillId,
          agentIdentity: 'devin-autonomous-agent-01',
          humanOwner: 'reprewindai@gmail.com',
          ttlSeconds: 300,
          maxInvocations: 10
        })
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success && verifyData.lease) {
        setX402LeaseToken(verifyData.lease.token);
        setX402LeaseInfo(verifyData.lease);
      }
    } catch (e: any) {
      setErrorMsg(`X402 Microtransaction failed: ${e.message}`);
    } finally {
      setIsAcquiringLease(false);
    }
  };

  const handleExecuteInvocation = async () => {
    setIsExecuting(true);
    setErrorMsg(null);
    setInvocationResult(null);

    try {
      let parsedParams = {};
      try {
        parsedParams = JSON.parse(paramInput);
      } catch (e) {
        throw new Error('Invalid JSON format in parameters input.');
      }

      const response = await fetch('/api/v1/capi/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillId: selectedSkillId,
          harness: selectedHarness,
          parameters: parsedParams,
          humanRequester: 'reprewindai@gmail.com',
          mode,
          customModel: selectedHarness === 'ollama' ? customModel : undefined,
          ollamaEndpoint: selectedHarness === 'ollama' ? ollamaEndpoint : undefined,
          byokKey: byokKey.trim() ? byokKey.trim() : undefined,
          containsPii,
          quebecLaw25Compliance: containsPii,
          x402Token: x402LeaseToken.trim() ? x402LeaseToken.trim() : undefined
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `HTTP ${response.status} Invocation error`);
      }

      const data: CAPIInvocationResponse = await response.json();
      setInvocationResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invocation failed');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-medium mb-1">
            <Terminal className="w-4 h-4" /> VEKLOM cAPI CAPABILITY RUNTIME
          </div>
          <h2 className="text-2xl font-bold text-white">cAPI Universal Capability Sandbox</h2>
          <p className="text-xs text-slate-400 font-mono">
            Execute EUC (Everything Universal Code) skills & MCP tools across any IDE or agent harness (Devin, Antigravity, Ollama, Claude, Codex, Cursor, OpenCode) with Execution Identity (EI) and PGL ledger proof.
          </p>
        </div>

        {/* Mode Indicator Badge */}
        <div className="flex items-center gap-2">
          {mode === 'production' ? (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> PROD ENGINE (REAL PGL SIGNATURES)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> DEMO SANDBOX (SIMULATED PAYLOADS)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Invocation Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" /> 1. Select Harness & Skill
            </h3>

            {/* Harness Provider Grid Selector */}
            <div className="space-y-2">
              <label className="text-2xs font-mono text-slate-400 uppercase">Harness Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'ollama', name: 'Ollama (Local)', badge: '100% Local Zero-Trust', icon: Cpu },
                  { id: 'gemini', name: 'Gemini (Server)', badge: '2.5 Flash / Omni', icon: Zap },
                  { id: 'claude', name: 'Claude Code', badge: 'EUC Universal Adapter', icon: Code },
                  { id: 'devin', name: 'Devin AI Agent', badge: 'Autonomous Worker', icon: Activity },
                  { id: 'antigravity', name: 'Antigravity Agent', badge: 'DeepMind Engine', icon: ShieldCheck },
                  { id: 'codex', name: 'Codex Bridge', badge: 'OpenAI API', icon: Terminal },
                  { id: 'cursor', name: 'Cursor Agent', badge: 'Workspace IDE', icon: Layers },
                  { id: 'opencode', name: 'OpenCode', badge: 'Universal Harness', icon: ShieldCheck }
                ].map((h) => {
                  const Icon = h.icon;
                  const isSelected = selectedHarness === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => setSelectedHarness(h.id as HarnessProvider)}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-500/50 text-white shadow'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-2xs font-mono">
                        <span className="font-bold flex items-center gap-1.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                          {h.name}
                        </span>
                      </div>
                      <div className="text-3xs text-slate-400 mt-1">{h.badge}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ollama Local Settings (if selected) */}
            {selectedHarness === 'ollama' && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5 text-2xs">
                    <Cpu className="w-3.5 h-3.5" /> Ollama Local Daemon Config
                  </span>
                  <span className={`text-3xs px-2 py-0.5 rounded ${ollamaStatus?.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {ollamaStatus?.connected ? 'ONLINE' : 'STANDBY'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs text-slate-400">Daemon Endpoint URL</label>
                  <input
                    type="text"
                    value={ollamaEndpoint}
                    onChange={(e) => setOllamaEndpoint(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-2xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-3xs text-slate-400">Target Local Model</label>
                  <select
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-2xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {(ollamaStatus?.availableModels || ['llama3.2:latest', 'deepseek-r1:8b', 'codellama:latest', 'mistral:latest']).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Target Skill Selection */}
            <div className="space-y-2">
              <label className="text-2xs font-mono text-slate-400 uppercase">Registered Capability / Skill</label>
              <select
                value={selectedSkillId}
                onChange={(e) => handleSelectSkill(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.version}) - {s.eccCompatible ? 'ECC Skill' : 'cAPI Native'}
                  </option>
                ))}
              </select>
            </div>

            {/* Parameters Payload Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-2xs font-mono">
                <span className="text-slate-400 uppercase">Input Parameters (JSON)</span>
                <span className="text-cyan-400 text-3xs">veklom-skill-spec Schema</span>
              </div>
              <textarea
                rows={5}
                value={paramInput}
                onChange={(e) => setParamInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-2xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
              ></textarea>
            </div>

            {/* BYOK Key Input */}
            <div className="space-y-1.5">
              <label className="text-2xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Bring Your Own Key (Optional Vault Secret)
              </label>
              <input
                type="password"
                placeholder="sk-user-custom-key-... (Stored in Lockerphycer)"
                value={byokKey}
                onChange={(e) => setByokKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-2xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Quebec Law 25 & PII Sovereignty Enforcer Control */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-2xs font-mono font-bold text-indigo-300 flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={containsPii}
                    onChange={(e) => setContainsPii(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> Quebec Law 25 / PII Sovereignty Enforcer
                </label>
                <span className={`text-3xs px-2 py-0.5 rounded font-mono ${containsPii ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-slate-800 text-slate-500'}`}>
                  {containsPii ? 'ENFORCED_LOCAL' : 'STANDARD'}
                </span>
              </div>
              {containsPii && (
                <p className="text-3xs text-slate-400 font-mono leading-relaxed">
                  Payload flagged for PII / Law 25 compliance. Automatically forces execution to 100% Local Sovereign Ollama Node. Zero cross-border telemetry leak & zero U.S. CLOUD Act exposure.
                </p>
              )}
            </div>

            {/* X402 Microtransaction Evaporating Lease Controls */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-3 font-mono">
              <div className="flex items-center justify-between text-2xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> X402 Evaporating Lease
                </span>
                {x402LeaseInfo ? (
                  <span className="text-3xs px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold">
                    LEASE ACTIVE ({x402LeaseInfo.invocationsRemaining} LEFTOVER)
                  </span>
                ) : (
                  <span className="text-3xs text-slate-500">NO ACTIVE TOKEN</span>
                )}
              </div>

              {x402LeaseToken ? (
                <div className="p-2.5 bg-slate-900 rounded border border-emerald-500/20 text-3xs space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>Token:</span>
                    <span className="text-emerald-400 font-bold">{x402LeaseToken}</span>
                  </div>
                  {x402LeaseInfo && (
                    <div className="flex justify-between text-slate-400">
                      <span>RAR Scope:</span>
                      <span className="text-slate-300">{x402LeaseInfo.rarGrantScope}</span>
                    </div>
                  )}
                  <div className="pt-1 border-t border-slate-800 text-3xs space-y-0.5">
                    <div className="text-slate-400 font-bold flex justify-between">
                      <span>Programmable Revenue Split:</span>
                      <span className="text-emerald-300">{"T_v = α_node + β_protocol + γ_creator"}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>• Node Margin (α 70%):</span>
                      <span className="text-slate-300">${((x402LeaseInfo?.pricePaidUsdc || 0.0028) * 0.70).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>• Veklom Network (β 15%):</span>
                      <span className="text-slate-300">${((x402LeaseInfo?.pricePaidUsdc || 0.0028) * 0.15).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>• ECC Creator Royalty (γ 15%):</span>
                      <span className="text-emerald-400 font-bold">${((x402LeaseInfo?.pricePaidUsdc || 0.0028) * 0.15).toFixed(6)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAcquireX402Lease}
                  disabled={isAcquiringLease}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-2xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isAcquiringLease ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying X402 Solana Settlement...
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" /> Acquire X402 Ephemeral Lease ($0.0028 USDC)
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Action Execution Button */}
            <button
              onClick={handleExecuteInvocation}
              disabled={isExecuting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white font-bold text-xs tracking-wider uppercase shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Routing Payload through cAPI...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Invoke Capability via cAPI
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Execution Output, EI & PGL Proofs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {invocationResult ? (
            <div className="space-y-6">
              {/* Result Summary Bar */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="font-bold text-white uppercase">INVOCATION SUCCESS</span>
                    <span className="text-slate-400">({invocationResult.executionId})</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-3xs font-mono font-bold border border-cyan-500/30">
                    {invocationResult.vnpMetrics.latencyMs}ms Latency
                  </span>
                </div>

                {/* Micro Metrics Pill */}
                <div className="grid grid-cols-5 gap-2 text-center font-mono text-2xs">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-3xs">EI Token</div>
                    <div className="text-cyan-400 font-bold truncate mt-0.5">{invocationResult.eiToken}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-3xs">PGL Cert</div>
                    <div className="text-emerald-400 font-bold truncate mt-0.5">{invocationResult.pglCertificate.certId}</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-3xs">SDI Score</div>
                    <div className="text-indigo-400 font-bold mt-0.5">
                      {invocationResult.semanticDeviationIndex ? `${(invocationResult.semanticDeviationIndex * 100).toFixed(1)}%` : '3.8%'}
                      <span className="text-3xs text-emerald-400 font-normal"> (&lt;15%)</span>
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-3xs">Throughput</div>
                    <div className="text-cyan-300 font-bold mt-0.5">{invocationResult.vnpMetrics.throughputTps} TPS</div>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-3xs">Cost</div>
                    <div className="text-amber-400 font-bold mt-0.5">${invocationResult.vnpMetrics.costMicros / 1000000}</div>
                  </div>
                </div>

                {/* Adapter Execution Logs */}
                <div className="space-y-1.5">
                  <span className="text-3xs font-mono text-slate-400 uppercase">veklom-harness-adapters Bridge Trace</span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-3xs text-slate-300 space-y-1 max-h-36 overflow-y-auto">
                    {invocationResult.adapterBridgeLogs.map((log, idx) => (
                      <div key={idx} className="text-slate-300">{log}</div>
                    ))}
                  </div>
                </div>

                {/* Raw Prompt Translation */}
                <div className="space-y-1.5">
                  <span className="text-3xs font-mono text-slate-400 uppercase">Raw Prompt Translation Payload</span>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-3xs text-cyan-300 whitespace-pre-wrap overflow-x-auto">
                    {invocationResult.rawPromptTranslation}
                  </pre>
                </div>

                {/* Execution Output Payload */}
                <div className="space-y-1.5">
                  <span className="text-3xs font-mono text-slate-400 uppercase">Capability Output Response</span>
                  <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-2xs text-emerald-300 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(invocationResult.output, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Cryptographic Proof Card (GnomLedger Certificate) */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4" /> Proof-of-Graph Ledger (PGL) Non-Repudiable Certificate
                  </span>
                  <span className="text-3xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Block #{invocationResult.pglCertificate.blockIndex}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-2xs">
                  <div><span className="text-slate-400">Human Requester Binding:</span> <span className="text-slate-200 font-bold">{invocationResult.pglCertificate.humanRequester}</span></div>
                  <div><span className="text-slate-400">Merkle Root:</span> <span className="text-cyan-400">{invocationResult.pglCertificate.merkleRoot}</span></div>
                  <div><span className="text-slate-400">Non-Repudiable Hash:</span> <span className="text-emerald-400">{invocationResult.pglCertificate.nonRepudiableHash}</span></div>
                  <div><span className="text-slate-400">Verifier Signature:</span> <span className="text-indigo-400">{invocationResult.pglCertificate.verifierSignature}</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 p-12 rounded-2xl border border-slate-800/80 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Ready for Capability Invocation</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-mono">
                Select your target harness (including 100% local Ollama), pick an ECC or MCP skill, configure parameter inputs, and click "Invoke Capability via cAPI" to observe real-time execution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
