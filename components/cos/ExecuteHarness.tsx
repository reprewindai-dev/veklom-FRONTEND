'use client';

import React, { useState } from 'react';
import {
  Play,
  Database,
  Activity,
  Terminal as TerminalIcon,
  Shield,
  Clock,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Lock,
  Unlock,
  ArrowRight,
} from 'lucide-react';
import { ProofBadge } from './ProofBadge';
import {
  requestVisitorCapabilityMount,
  executeVisitorConsequence,
  revokeVisitorCapability,
  verifyReplayDenial,
  type VisitorMountResponse,
  type VisitorExecuteResponse,
  type ReplayDenialProof,
} from '@/lib/cos/visitorCapability';

interface BYOKTrace {
  response: string;
  provider: string;
  model: string;
  log_id: string;
  total_tokens: number;
  latency_ms: number;
}

interface TraceLogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}

export function ExecuteHarness() {
  // Execution Mode: 'visitor' (Zero-Trust Ephemeral Lease - Steps 9-11) vs 'byok' (Custom API Key)
  const [authMode, setAuthMode] = useState<'visitor' | 'byok'>('visitor');

  // Visitor Mode State (Steps 9-11)
  const [mountData, setMountData] = useState<VisitorMountResponse | null>(null);
  const [executeData, setExecuteData] = useState<VisitorExecuteResponse | null>(null);
  const [isMounting, setIsMounting] = useState(false);
  const [isExecutingVisitor, setIsExecutingVisitor] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isTestingReplay, setIsTestingReplay] = useState(false);
  const [isRevoked, setIsRevoked] = useState(false);
  const [replayProof, setReplayProof] = useState<ReplayDenialProof | null>(null);

  // BYOK Mode State
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('Inspect active capability lease and assert bounded state transition.');
  const [model, setModel] = useState('qwen2.5:3b');
  const [isExecutingBYOK, setIsExecutingBYOK] = useState(false);
  const [byokTrace, setByokTrace] = useState<BYOKTrace | null>(null);

  // Common UI State
  const [error, setError] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<TraceLogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Zero-Trust Capability OS initialized. Ready for visitor mount.',
    },
  ]);

  const addLog = (level: TraceLogEntry['level'], message: string) => {
    setTerminalLogs((prev) => [
      ...prev,
      { timestamp: new Date().toLocaleTimeString(), level, message },
    ]);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 9: Ephemeral Capability Mount (No internal secret key required)
  // ──────────────────────────────────────────────────────────────────────────
  const handleMountCapability = async () => {
    setIsMounting(true);
    setError(null);
    setExecuteData(null);
    setReplayProof(null);
    setIsRevoked(false);

    addLog('info', 'POST /v1/capability/mounts -> Requesting ephemeral lease for veklom.test@v1...');

    try {
      const res = await requestVisitorCapabilityMount({
        workspace: 'public-preview',
        project: 'default',
      });

      setMountData(res);
      addLog(
        'success',
        `Lease Granted! Mount: ${res.mount?.id || 'granted'}, Token: ${res.token?.token_id.slice(0, 16)}..., Nonce: ${res.token?.nonce.slice(0, 8)}... (TTL: ${res.ttl_seconds || 300}s)`
      );
    } catch (err: any) {
      const msg = err.message || 'Failed to request capability mount';
      setError(msg);
      addLog('error', `Mount Request Denied: ${msg}`);
    } finally {
      setIsMounting(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STEPS 9 & 10: Execute Consequence under Lease
  // ──────────────────────────────────────────────────────────────────────────
  const handleExecuteVisitor = async () => {
    if (!mountData || !mountData.token) {
      setError('Active capability lease required. Mount a capability first.');
      return;
    }

    if (isRevoked) {
      setError('Capability lease has been revoked. Attempting reuse will verify replay denial.');
      return;
    }

    setIsExecutingVisitor(true);
    setError(null);

    const mountId = mountData.mount?.id || 'default_mount';
    const tokenId = mountData.token.token_id;
    const nonce = mountData.token.nonce;

    addLog(
      'info',
      `POST /v1/capability/mounts/${mountId}/execute -> Presenting single-use nonce [${nonce.slice(0, 8)}...] for action record.create`
    );

    try {
      const res = await executeVisitorConsequence({
        mountId,
        tokenId,
        nonce,
        action: 'record.create',
        targetRef: 'veklom.test@v1',
        resource: 'veklom.test@v1',
        intent: 'Public preview consequence execution',
      });

      setExecuteData(res);
      addLog(
        'success',
        `Consequence CONFIRMED! Authority Epoch: ${res.authority.epoch}, State: ${res.consequence.state}, PGL Receipt: ${res.consequence.receipt_id}`
      );
      addLog(
        'info',
        `Single-use Nonce Consumed: ${res.authority.nonce_consumed}. Subsequent presentations with this nonce are permanently invalidated.`
      );
    } catch (err: any) {
      const msg = err.message || 'Execution failed';
      setError(msg);
      addLog('error', `Execution Denied: ${msg}`);
    } finally {
      setIsExecutingVisitor(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 11: Revoke Capability
  // ──────────────────────────────────────────────────────────────────────────
  const handleRevoke = async () => {
    if (!mountData?.mount?.id) return;

    setIsRevoking(true);
    setError(null);

    const mountId = mountData.mount.id;
    addLog('warn', `POST /v1/capability/mounts/${mountId}/terminate -> Revoking lease with reason: user_revoked`);

    try {
      await revokeVisitorCapability(mountId, 'user_revoked');
      setIsRevoked(true);
      addLog('warn', `Mount ${mountId} terminated. Lease status: REVOKED.`);
    } catch (err: any) {
      const msg = err.message || 'Revocation failed';
      setError(msg);
      addLog('error', `Revocation error: ${msg}`);
    } finally {
      setIsRevoking(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // STEP 11: Prove Replay Denial (403 Forbidden / CAPABILITY_LEASE_NOT_ACTIVE)
  // ──────────────────────────────────────────────────────────────────────────
  const handleTestReplay = async () => {
    if (!mountData || !mountData.token) return;

    setIsTestingReplay(true);
    setError(null);

    const mountId = mountData.mount?.id || 'default_mount';
    const tokenId = mountData.token.token_id;
    const nonce = mountData.token.nonce;

    addLog(
      'info',
      `[REPLAY TEST] Attempting execution with revoked/consumed token [${tokenId.slice(0, 12)}...]`
    );

    try {
      const proof = await verifyReplayDenial(mountId, tokenId, nonce);
      setReplayProof(proof);
      addLog(
        'success',
        `[DETERMINISTIC PROOF] Denied with HTTP ${proof.status}: "${proof.reason}". Replay invariant confirmed!`
      );
    } catch (err: any) {
      const msg = err.message || 'Replay test failed';
      setError(msg);
      addLog('error', `Replay assertion error: ${msg}`);
    } finally {
      setIsTestingReplay(false);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // BYOK Flow: Custom API Key execution (Audited: Zero dummy test key fallback)
  // ──────────────────────────────────────────────────────────────────────────
  const handleExecuteBYOK = async () => {
    if (!prompt) return;

    if (!apiKey.trim()) {
      setError('Execution Key (API Key) is required in BYOK mode. For zero-trust keyless execution, select Visitor Mode.');
      return;
    }

    setIsExecutingBYOK(true);
    setError(null);
    setByokTrace(null);

    addLog('info', `POST /v1/exec -> Dispatching with authentic bearer credential (${apiKey.slice(0, 8)}...)`);

    try {
      const res = await fetch('https://api.veklom.com/v1/exec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey.trim(),
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          prompt,
          model,
          use_memory: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setByokTrace(data);
      addLog('success', `BYOK Execution Complete: ${data.model} (${data.latency_ms}ms, PGL: ${data.log_id})`);
    } catch (err: any) {
      const msg = err.message || 'Execution failed';
      setError(msg);
      addLog('error', `Execution Error: ${msg}`);
    } finally {
      setIsExecutingBYOK(false);
    }
  };

  const isVerified = Boolean(executeData || byokTrace || (replayProof && replayProof.denied));

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">
            Execute Workspace &middot; Zero-Trust Capability Harness
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-cos-text">
            Governed Consequence Engine
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">
            Run bounded capabilities through the canonical execution boundary. Ephemeral capability leases enforce single-use nonces, authority epochs, and cryptographic replay denial.
          </p>
        </div>
        <ProofBadge status={isVerified ? "Verified" : "Needs proof"} />
      </div>

      {/* Mode Switch Bar */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cos-border bg-cos-surface/60 p-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-cos-steel">Execution Path:</span>
          <button
            onClick={() => setAuthMode('visitor')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide transition-all ${
              authMode === 'visitor'
                ? 'bg-cos-accent text-cos-bg'
                : 'text-cos-muted hover:text-cos-text'
            }`}
          >
            <Shield size={13} />
            Zero-Trust Visitor (No Key Required)
          </button>
          <button
            onClick={() => setAuthMode('byok')}
            className={`flex items-center gap-1.5 rounded px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wide transition-all ${
              authMode === 'byok'
                ? 'bg-cos-accent text-cos-bg'
                : 'text-cos-muted hover:text-cos-text'
            }`}
          >
            <Key size={13} />
            BYOK Operator (Custom Key)
          </button>
        </div>

        <div className="font-mono text-[10px] text-cos-steel">
          {authMode === 'visitor' ? (
            <span className="text-[#00FF41]">&bull; Steps 9&ndash;11 Protocol Active</span>
          ) : (
            <span className="text-amber-400">&bull; Production Release: Zero Fallback Keys</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Controls */}
        <div className="space-y-6 lg:col-span-1">
          {/* VISITOR MODE CONTROLS */}
          {authMode === 'visitor' && (
            <>
              {/* Step 9: Lease & Mount Card */}
              <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text">
                    <Shield size={14} className="text-cos-accent" />
                    Step 9: Ephemeral Capability Lease
                  </h3>
                  {mountData && !isRevoked && (
                    <span className="flex items-center gap-1 rounded bg-green-950/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#00FF41] border border-green-800/60">
                      <Lock size={10} /> Active
                    </span>
                  )}
                  {isRevoked && (
                    <span className="flex items-center gap-1 rounded bg-red-950/60 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-400 border border-red-800/60">
                      <Unlock size={10} /> Revoked
                    </span>
                  )}
                </div>

                <div className="space-y-3 font-mono text-[11px]">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1">
                      Target Package
                    </label>
                    <div className="rounded border border-cos-border bg-cos-surface2 p-2 text-cos-text">
                      veklom.test@v1
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1">
                      Execution Scope
                    </label>
                    <div className="rounded border border-cos-border bg-cos-surface2 p-2 text-cos-muted text-[10px]">
                      workspace: public-preview &middot; project: default
                    </div>
                  </div>

                  {!mountData ? (
                    <button
                      onClick={handleMountCapability}
                      disabled={isMounting}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded bg-cos-accent py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cos-bg transition-all hover:bg-opacity-90 disabled:opacity-50"
                    >
                      {isMounting ? <Activity size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      {isMounting ? 'Mounting Capability...' : 'Request Ephemeral Lease'}
                    </button>
                  ) : (
                    <div className="mt-3 space-y-2 border-t border-cos-border pt-3">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-cos-steel">Mount ID:</span>
                        <span className="text-cos-text truncate max-w-[140px]" title={mountData.mount?.id}>
                          {mountData.mount?.id}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-cos-steel">Nonce:</span>
                        <span className="text-[#00FF41] font-bold">
                          {mountData.token?.nonce ? `${mountData.token.nonce.slice(0, 10)}...` : 'Single-use'}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-cos-steel">Expires In:</span>
                        <span className="text-cos-muted">
                          {mountData.ttl_seconds || 300}s
                        </span>
                      </div>

                      <button
                        onClick={handleMountCapability}
                        disabled={isMounting}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded border border-cos-border bg-cos-surface2 py-1.5 text-[10px] text-cos-muted hover:text-cos-text"
                      >
                        <RefreshCw size={11} /> Re-mount Fresh Lease
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 10: Execute Consequence */}
              <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text">
                  <Play size={14} className="text-cos-accent" />
                  Step 10: Governed Execution
                </h3>

                <div className="space-y-3 font-mono text-[11px]">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1">
                      Action Type
                    </label>
                    <div className="rounded border border-cos-border bg-cos-surface2 p-2 text-cos-text">
                      record.create
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteVisitor}
                    disabled={isExecutingVisitor || !mountData || isRevoked}
                    className="flex w-full items-center justify-center gap-2 rounded bg-cos-accent py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cos-bg transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecutingVisitor ? (
                      <Activity size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {isExecutingVisitor ? 'Asserting Consequence...' : 'Execute Consequence'}
                  </button>
                </div>
              </div>

              {/* Step 11: Revocation & Replay Denial Card */}
              <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Step 11: Revocation & Replay Denial
                </h3>

                <p className="mb-3 text-[11px] leading-relaxed text-cos-muted">
                  Prove that revoking this lease or re-submitting a consumed nonce is cryptographically rejected by CAPPO.
                </p>

                <div className="space-y-2">
                  <button
                    onClick={handleRevoke}
                    disabled={isRevoking || !mountData || isRevoked}
                    className="flex w-full items-center justify-center gap-2 rounded border border-red-800/80 bg-red-950/30 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-red-400 transition-all hover:bg-red-900/40 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isRevoking ? <Activity size={12} className="animate-spin" /> : <Unlock size={12} />}
                    {isRevoked ? 'Lease Revoked' : 'Revoke Capability (user_revoked)'}
                  </button>

                  <button
                    onClick={handleTestReplay}
                    disabled={isTestingReplay || !mountData}
                    className="flex w-full items-center justify-center gap-2 rounded border border-amber-800/80 bg-amber-950/30 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-300 transition-all hover:bg-amber-900/40 disabled:opacity-40"
                  >
                    {isTestingReplay ? (
                      <Activity size={12} className="animate-spin" />
                    ) : (
                      <Shield size={12} />
                    )}
                    Verify Replay Denial (403 Expected)
                  </button>
                </div>
              </div>
            </>
          )}

          {/* BYOK MODE CONTROLS */}
          {authMode === 'byok' && (
            <>
              <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text">
                  <Key size={14} className="text-cos-accent" />
                  Operator Authority Key
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">
                      Execution Key (API Key) &middot; No Fallback
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="byos_... / sec_..."
                      className="w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-sm text-cos-text focus:border-cos-accent focus:outline-none"
                    />
                    <span className="mt-1 block text-[9px] text-cos-muted">
                      Production release builds require authentic keys. Test keys are blocked.
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
                <h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text">
                  <Database size={14} className="text-cos-accent" />
                  Execution Parameters
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">
                      Model Target
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-sm text-cos-text focus:border-cos-accent focus:outline-none"
                    >
                      <option value="qwen2.5:3b">qwen2.5:3b (Local Ollama)</option>
                      <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (Groq Fallback)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">
                      Input Payload (Intent)
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-sm text-cos-text focus:border-cos-accent focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleExecuteBYOK}
                    disabled={isExecutingBYOK || !apiKey.trim() || !prompt}
                    className="flex w-full items-center justify-center gap-2 rounded bg-cos-accent py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-cos-bg transition-all hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExecutingBYOK ? (
                      <Activity size={14} className="animate-spin" />
                    ) : (
                      <Play size={14} />
                    )}
                    {isExecutingBYOK ? 'Executing...' : 'Run Capability'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Column: Verified Outputs, Epochs & Live Runtime Trace */}
        <div className="space-y-6 lg:col-span-2">
          {/* STEP 10 EVIDENCE & PROOF SUMMARY CARD (Displayed upon execution or replay test) */}
          {executeData && (
            <div className="rounded-xl border border-green-800/60 bg-green-950/20 p-5 animate-[fadeIn_0.3s_ease-out]">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-[#00FF41]">
                  <CheckCircle2 size={16} />
                  Step 10 Consequence Record &middot; Authority Epoch Established
                </div>
                <span className="font-mono text-[10px] text-cos-muted">
                  {executeData.duration_ms}ms latency
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-green-900/40 pt-3 font-mono text-[11px] sm:grid-cols-4">
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-cos-steel">Decision</div>
                  <div className="text-sm font-bold text-[#00FF41] uppercase">{executeData.decision}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-cos-steel">Authority Epoch</div>
                  <div className="text-sm font-bold text-cos-accent">Epoch {executeData.authority.epoch}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-cos-steel">Consequence State</div>
                  <div className="text-sm font-bold text-gray-200 uppercase">{executeData.consequence.state}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-cos-steel">Nonce Consumed</div>
                  <div className="text-sm font-bold text-[#00FF41]">
                    {executeData.authority.nonce_consumed ? 'TRUE (Single-Use)' : 'FALSE'}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded bg-[#070707] border border-[#222] p-3 font-mono text-[10px]">
                <div className="flex justify-between text-cos-steel mb-1">
                  <span>PGL Evidence Receipt ID:</span>
                  <span className="text-cos-accent font-bold select-all">{executeData.consequence.receipt_id}</span>
                </div>
                <div className="flex justify-between text-cos-steel">
                  <span>Execution ID:</span>
                  <span className="text-gray-400 truncate max-w-[280px]">{executeData.authority.execution_id}</span>
                </div>
              </div>
            </div>
          )}

          {/* REPLAY DENIAL VERIFICATION CARD */}
          {replayProof && (
            <div className="rounded-xl border border-red-800/60 bg-red-950/20 p-5 animate-[fadeIn_0.3s_ease-out]">
              <div className="mb-2 flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest text-red-400">
                <XCircle size={16} />
                Step 11 Verified: Deterministic Replay Denial Enforced
              </div>
              <p className="font-mono text-[11px] text-gray-300 mb-3">
                {replayProof.detail}
              </p>
              <div className="rounded bg-[#0A0505] border border-red-900/50 p-3 font-mono text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-cos-steel">HTTP Response:</span>
                  <span className="font-bold text-red-400">{replayProof.status} FORBIDDEN</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cos-steel">Denial Reason:</span>
                  <span className="text-amber-400 font-bold">{replayProof.reason}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cos-steel">Invariant Proved:</span>
                  <span className="text-[#00FF41]">CAPABILITY_LEASE_NOT_ACTIVE (Zero Side Effects)</span>
                </div>
              </div>
            </div>
          )}

          {/* RUNTIME TRACE TERMINAL */}
          <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-xl border border-cos-border bg-[#050505]">
            <div className="flex items-center justify-between border-b border-[#222] bg-[#0A0A0A] p-3">
              <div className="flex items-center gap-2">
                <TerminalIcon size={14} className="text-[#666]" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">
                  Governed Execution Trace &middot; Audit Log
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-cos-steel">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00FF41]"></span> CAPPO Port 8002
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cos-accent"></span> PGL Ledger
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed text-gray-300">
              {error && (
                <div className="mb-4 flex items-start gap-2 rounded border border-red-900/50 bg-red-950/20 p-3 text-red-400">
                  <span className="font-bold">[ERROR]</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className="text-cos-steel select-none text-[9px]">[{log.timestamp}]</span>
                    {log.level === 'info' && <span className="text-cos-muted">&gt; {log.message}</span>}
                    {log.level === 'success' && <span className="text-[#00FF41]">&gt; {log.message}</span>}
                    {log.level === 'warn' && <span className="text-amber-400">&gt; {log.message}</span>}
                    {log.level === 'error' && <span className="text-red-400">&gt; {log.message}</span>}
                  </div>
                ))}
              </div>

              {/* BYOK Trace Display */}
              {byokTrace && (
                <div className="mt-4 space-y-3 border-t border-[#222] pt-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className="text-[11px] font-bold text-[#00FF41]">&gt; BYOK Execution Complete</div>
                  <div className="rounded border border-[#222] bg-[#111] p-3 text-gray-200">
                    {byokTrace.response}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[9px] uppercase tracking-wider">
                    <div>
                      <span className="text-cos-steel">Provider:</span>{' '}
                      <span className="text-cos-text">{byokTrace.provider} ({byokTrace.model})</span>
                    </div>
                    <div>
                      <span className="text-cos-steel">PGL Hash:</span>{' '}
                      <span className="text-cos-accent truncate block" title={byokTrace.log_id}>{byokTrace.log_id}</span>
                    </div>
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
