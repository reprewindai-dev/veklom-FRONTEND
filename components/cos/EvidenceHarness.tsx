'use client';

import React, { useState } from 'react';
import { Activity, Database, FileText, Search, ShieldCheck } from 'lucide-react';
import { fetchExecutionEvidence } from '@/lib/cos/verticalSlice';
import { ProofBadge } from './ProofBadge';

type EvidenceRecord = {
  execution_id: string;
  proof_state: 'verified' | 'verified_with_unresolved_refs' | 'failed' | 'unknown';
  verification_reasons: string[];
  eee: { envelope_hash?: string; status?: string; capability_id?: string };
  pgl: { event_id: string; certificate_id: string; event_hash: string; previous_event_hash?: string | null; persisted: boolean };
};

export function EvidenceHarness() {
  const [executionId, setExecutionId] = useState('');
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retrieve = async () => {
    if (!executionId) return;
    setLoading(true); setError(null); setRecord(null);
    try { setRecord(await fetchExecutionEvidence(executionId) as EvidenceRecord); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Evidence unavailable'); }
    finally { setLoading(false); }
  };
  const proof = error ? 'Degraded' : record?.proof_state === 'verified' ? 'Verified' : 'Needs proof';
  return <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
    <div className="mb-10 flex items-start justify-between gap-6"><div><div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">Evidence Workspace</div><h1 className="text-4xl font-semibold tracking-tight text-cos-text">EEE / PGL Lineage</h1><p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">Retrieve the signed execution envelope and its exact persisted ledger link. Unresolved references stay unresolved.</p></div><ProofBadge status={proof} /></div>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4"><div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5"><h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text"><ShieldCheck size={14} className="text-cos-accent" />Session authority</h3><label className="block text-[10px] uppercase tracking-wider text-cos-steel">Execution ID<input value={executionId} onChange={(e) => setExecutionId(e.target.value)} placeholder="Execution identity" className="mt-1.5 w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-sm text-cos-text focus:border-cos-accent focus:outline-none" /></label><button onClick={retrieve} disabled={loading || !executionId} className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-cos-border bg-cos-surface2 py-2.5 font-mono text-[10px] uppercase tracking-wider text-cos-text disabled:opacity-50">{loading ? <Activity size={14} className="animate-spin" /> : <Search size={14} />}{loading ? 'Verifying…' : 'Retrieve proof'}</button></div>
      <div className="min-h-[420px] overflow-hidden rounded-xl border border-cos-border bg-[#050505] lg:col-span-3"><div className="flex items-center gap-2 border-b border-[#222] bg-[#0A0A0A] p-3"><FileText size={14} className="text-[#666]" /><span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">Persisted evidence record</span></div><div className="p-6 font-mono text-xs text-gray-300">{error && <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-red-400">[EVIDENCE NOT VERIFIED] {error}</div>}{!error && !record && !loading && <div className="flex min-h-[320px] flex-col items-center justify-center text-[#555]"><Database size={32} className="mb-4" />No execution evidence loaded.</div>}{record && <div className="space-y-5"><div className="grid gap-3 md:grid-cols-2"><Fact label="Execution" value={record.execution_id} /><Fact label="EEE status" value={record.eee.status ?? 'unknown'} /><Fact label="Capability" value={record.eee.capability_id ?? 'unknown'} /><Fact label="Envelope hash" value={record.eee.envelope_hash ?? 'missing'} /></div><div className="grid gap-3 border-t border-[#222] pt-5 md:grid-cols-2"><Fact label="PGL event" value={record.pgl.event_id} /><Fact label="Certificate" value={record.pgl.certificate_id} /><Fact label="Event hash" value={record.pgl.event_hash} /><Fact label="Previous hash" value={record.pgl.previous_event_hash ?? 'genesis'} /></div>{record.verification_reasons.length > 0 && <div className="rounded border border-cos-unknown/30 p-3 text-cos-unknown">Unresolved: {record.verification_reasons.join(', ')}</div>}</div>}</div></div>
    </div>
  </section>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded border border-[#222] bg-[#111] p-3"><div className="mb-1 text-[9px] uppercase tracking-widest text-[#666]">{label}</div><div className="break-all">{value}</div></div>; }
