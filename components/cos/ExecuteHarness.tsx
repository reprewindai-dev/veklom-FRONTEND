'use client';

import React, { useEffect, useState } from 'react';
import { Play, Database, Activity, Terminal as TerminalIcon, Shield, Clock } from 'lucide-react';
import { ProofBadge } from './ProofBadge';
import { executeGovernedConsequence } from '@/lib/cos/verticalSlice';
import { clearSessionCapabilityLease, readSessionCapabilityLease } from '@/lib/cos/lease-session';
import { useSandboxMode } from '@/lib/cos/sandbox';
import { executionProofStatus } from '@/lib/cos/vertical-slice-truth';
import { ApiError } from '@/lib/api';

interface PaymentChallenge {
  message: string;
  paymentRequiredHeader?: string | null;
  facilitatorUrl?: string | null;
}

interface ExecutionTrace {
  response?: unknown;
  status?: string;
  provider?: string;
  model?: string;
  execution_id?: string;
  tokens?: number;
  latency_ms?: number;
  capability_lease?: { mount_id: string; decision: 'allow'; reason: string; anchor_id?: string | null };
}

export function ExecuteHarness() {
  const sandbox = useSandboxMode();
  const [mountId, setMountId] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [nonce, setNonce] = useState('');
  const [operation, setOperation] = useState('llm.exec');
  const [targetId, setTargetId] = useState('');
  const [expectedStateHash, setExpectedStateHash] = useState('');
  const [observedStateHash, setObservedStateHash] = useState('');
  const [observedAt, setObservedAt] = useState('');
  const [observerSignature, setObserverSignature] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [trace, setTrace] = useState<ExecutionTrace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentChallenge, setPaymentChallenge] = useState<PaymentChallenge | null>(null);

  useEffect(() => {
    const lease = readSessionCapabilityLease();
    if (lease) {
      setMountId(lease.mountId);
      setTokenId(lease.tokenId);
      setNonce(lease.nonce);
    }
  }, []);

  useEffect(() => {
    const handlePaymentRequired = (event: Event) => {
      setPaymentChallenge((event as CustomEvent<PaymentChallenge>).detail);
    };
    window.addEventListener('X402PaymentIntervention', handlePaymentRequired);
    return () => window.removeEventListener('X402PaymentIntervention', handlePaymentRequired);
  }, []);

  const handleExecute = async () => {
    if (!prompt) return;
    const targetParts = [targetId, expectedStateHash, observedStateHash, observedAt, observerSignature];
    if (targetParts.some(Boolean) && !targetParts.every(Boolean)) {
      setError('Complete every target precondition field or clear all of them.');
      return;
    }
    
    setIsExecuting(true);
    setError(null);
    setTrace(null);
    setPaymentChallenge(null);

    try {
      const data = await executeGovernedConsequence({
        capabilityLease: { mountId, tokenId, nonce },
        operation,
        prompt,
        targetPrecondition: targetId && expectedStateHash && observedStateHash && observedAt && observerSignature ? {
          targetId,
          expectedStateHash,
          observedStateHash,
          observedAt,
          signature: observerSignature,
        } : undefined,
      }) as ExecutionTrace;
      setTrace(data);
      if (data.execution_id) {
        sessionStorage.setItem('veklom_execution_id', data.execution_id);
        clearSessionCapabilityLease();
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 402) setError(null);
      else setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const proofStatus = executionProofStatus({
    status: trace?.status,
    executionId: trace?.execution_id,
    hasResponse: trace?.response !== undefined,
    leaseAllowed: trace?.capability_lease?.decision === 'allow',
    sandbox,
  });
  const terminal = proofStatus === 'Verified' || proofStatus === 'Simulated';
  const responseText = trace?.response === undefined
    ? 'No resulting state returned.'
    : typeof trace.response === 'string'
      ? trace.response
      : JSON.stringify(trace.response, null, 2);

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
        <ProofBadge status={error && !paymentChallenge ? "Degraded" : proofStatus} />
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
              <label className="block text-[10px] uppercase tracking-wider text-cos-steel">CapabilityLease mount<input value={mountId} onChange={(e) => setMountId(e.target.value)} placeholder="mnt_..." className="mt-1.5 w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none" /></label>
              <label className="block text-[10px] uppercase tracking-wider text-cos-steel">Single-use token<input type="password" value={tokenId} onChange={(e) => setTokenId(e.target.value)} placeholder="token id" className="mt-1.5 w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none" /></label>
              <label className="block text-[10px] uppercase tracking-wider text-cos-steel">Nonce<input type="password" value={nonce} onChange={(e) => setNonce(e.target.value)} placeholder="single-use nonce" className="mt-1.5 w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none" /></label>
            </div>
          </div>

          <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5">
            <h3 className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text mb-4">
              <Database size={14} className="text-cos-accent" />
              Mounted Capability
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-cos-steel mb-1.5">Authorized operation</label>
                <input value={operation} onChange={(e) => setOperation(e.target.value)} className="w-full bg-cos-surface2 border border-cos-border rounded p-2 text-sm text-cos-text font-mono focus:border-cos-accent focus:outline-none" />
              </div>
              <details className="rounded border border-cos-border bg-cos-surface2/40 p-3">
                <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-cos-steel">Observed target precondition (required for writes)</summary>
                <div className="mt-3 space-y-3">
                  <input value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="Target ID" className="w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-xs text-cos-text" />
                  <input value={expectedStateHash} onChange={(e) => setExpectedStateHash(e.target.value)} placeholder="Expected state hash" className="w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-xs text-cos-text" />
                  <input value={observedStateHash} onChange={(e) => setObservedStateHash(e.target.value)} placeholder="Observer state hash" className="w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-xs text-cos-text" />
                  <input value={observedAt} onChange={(e) => setObservedAt(e.target.value)} placeholder="Observed at (RFC3339)" className="w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-xs text-cos-text" />
                  <input type="password" value={observerSignature} onChange={(e) => setObserverSignature(e.target.value)} placeholder="Observer signature" className="w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-xs text-cos-text" />
                </div>
              </details>
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
                disabled={isExecuting || !prompt || !mountId || !tokenId || !nonce || !operation}
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
              {trace && (
                <div className="flex items-center gap-4">
                  {Number.isFinite(trace.latency_ms) && <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#00FF41]">
                    <Clock size={12} /> {trace.latency_ms}ms
                  </span>}
                  {trace.tokens !== undefined && <span className="flex items-center gap-1.5 font-mono text-[10px] text-cos-accent">
                    <Activity size={12} /> {trace.tokens ?? 0} tkns
                  </span>}
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

              {paymentChallenge && (
                <div className="mb-4 rounded border border-cos-warn/40 bg-cos-warn/10 p-4 text-cos-warn">
                  <div className="font-semibold">[PAYMENT REQUIRED — NO PAYMENT INITIATED]</div>
                  <div className="mt-2 text-xs">{paymentChallenge.message}</div>
                  {paymentChallenge.paymentRequiredHeader && <div className="mt-2 break-all text-[10px]">Challenge: {paymentChallenge.paymentRequiredHeader}</div>}
                  {paymentChallenge.facilitatorUrl && <div className="mt-2 break-all text-[10px]">Facilitator: {paymentChallenge.facilitatorUrl}</div>}
                </div>
              )}

              {!trace && !error && !isExecuting && (
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

              {trace && (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
                  <div className={terminal ? "text-[#00FF41] mb-2" : "text-cos-warn mb-2"}>{'>'} {terminal ? 'Execution complete.' : `Execution ${trace.status ?? 'accepted'}; resulting state not yet proven.`}</div>
                  <pre className="whitespace-pre-wrap bg-[#111] border border-[#222] rounded p-4 text-gray-200">{responseText}</pre>
                  <div className="mt-6 border-t border-[#222] pt-4 grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest">
                    <div>
                      <div className="text-[#555] mb-1">Provider Route</div>
                      <div className="text-white">{trace.provider} ({trace.model})</div>
                    </div>
                    <div>
                      <div className="text-[#555] mb-1">Execution ID</div>
                      <div className="text-cos-accent font-bold truncate" title={trace.execution_id}>{trace.execution_id}</div>
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
