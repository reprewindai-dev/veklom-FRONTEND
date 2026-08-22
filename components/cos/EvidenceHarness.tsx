'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, Database, FileText, Search, ShieldCheck } from 'lucide-react';
import { ProofBadge } from './ProofBadge';
import { useSandboxMode } from '@/lib/cos/sandbox';
import { useStageData } from '@/lib/cos/useStageData';
import { proofRecordStatus, requestStillCurrent } from '@/lib/cos/vertical-slice-truth';
import { SectionShell } from './SectionShell';

type EvidenceRecord = {
  execution_id: string;
  proof_state: 'verified' | 'verified_with_unresolved_refs' | 'failed' | 'unknown';
  verification_reasons?: string[];
  eee?: { envelope_hash?: string; status?: string; capability_id?: string };
  pgl?: { event_id?: string; certificate_id?: string; event_hash?: string; previous_event_hash?: string | null; persisted?: boolean };
};

export function EvidenceHarness() {
  const sandbox = useSandboxMode();
  const stageData = useStageData('evidence');
  const [executionId, setExecutionId] = useState('');
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentExecutionId = useRef('');
  const requestSequence = useRef(0);
  useEffect(() => {
    const stored = sessionStorage.getItem('veklom_execution_id') ?? '';
    currentExecutionId.current = stored;
    setExecutionId(stored);
  }, []);

  async function retrieve() {
    if (!executionId) return;
    const requestedExecutionId = executionId;
    const sequence = ++requestSequence.current;
    setLoading(true); setError(null); setRecord(null);
    try {
      const result = await stageData.call<EvidenceRecord>({
        method: 'GET',
        path: `/v1/executions/${encodeURIComponent(requestedExecutionId)}/evidence`,
        classification: 'live',
        response: 'execution-bound EEE and PGL evidence',
      });
      if (!requestStillCurrent(requestedExecutionId, currentExecutionId.current, sequence, requestSequence.current)) return;
      const next = result.data;
      if (!next) {
        if (result.record.status !== 404) setError(result.record.error ?? 'Evidence unavailable');
        return;
      }
      setRecord(next.execution_id === requestedExecutionId ? next : {
        ...next,
        proof_state: 'failed',
        verification_reasons: [...(next.verification_reasons ?? []), 'execution_id_mismatch'],
      });
    } catch (caught) {
      if (requestStillCurrent(requestedExecutionId, currentExecutionId.current, sequence, requestSequence.current)) {
        setError(caught instanceof Error ? caught.message : 'Evidence unavailable');
      }
    } finally {
      if (requestStillCurrent(requestedExecutionId, currentExecutionId.current, sequence, requestSequence.current)) setLoading(false);
    }
  }

  const proof = proofRecordStatus({ verified: record?.proof_state === 'verified', degraded: Boolean(error), sandbox });
  return <SectionShell stage={stageData.stage} proof={proof} records={stageData.records}>
    <div className="xl:col-span-2">
    <div className="mb-10 flex items-start justify-between gap-6"><div><div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">Evidence Workspace</div><h1 className="text-4xl font-semibold tracking-tight text-cos-text">EEE / PGL Lineage</h1><p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">Retrieve the signed execution envelope and its exact persisted ledger link. Unresolved references stay unresolved.</p></div><ProofBadge status={proof} /></div>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5"><h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text"><ShieldCheck size={14} className="text-cos-accent" />Session authority</h3><label className="block text-[10px] uppercase tracking-wider text-cos-steel">Execution ID<input value={executionId} onChange={(event) => { const value = event.target.value; requestSequence.current += 1; currentExecutionId.current = value; setExecutionId(value); setLoading(false); setRecord(null); setError(null); }} placeholder="Execution identity" className="mt-1.5 w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-sm text-cos-text focus:border-cos-accent focus:outline-none" /></label><button onClick={retrieve} disabled={loading || !executionId} className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-cos-border bg-cos-surface2 py-2.5 font-mono text-[10px] uppercase tracking-wider text-cos-text disabled:opacity-50">{loading ? <Activity size={14} className="animate-spin" /> : <Search size={14} />}{loading ? 'Verifying…' : 'Retrieve proof'}</button></div>
      <div className="min-h-[420px] overflow-hidden rounded-xl border border-cos-border bg-[#050505] lg:col-span-3"><div className="flex items-center gap-2 border-b border-[#222] bg-[#0A0A0A] p-3"><FileText size={14} className="text-[#666]" /><span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">Persisted evidence record</span></div><div className="p-6 font-mono text-xs text-gray-300">{error && <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-red-400">[EVIDENCE NOT VERIFIED] {error}</div>}{!error && !record && !loading && <div className="flex min-h-[320px] flex-col items-center justify-center text-[#555]"><Database size={32} className="mb-4" />No execution evidence loaded.</div>}{record && <div className="space-y-5"><div className="grid gap-3 md:grid-cols-2"><Fact label="Execution" value={record.execution_id} /><Fact label="EEE status" value={record.eee?.status ?? 'unknown'} /><Fact label="Capability" value={record.eee?.capability_id ?? 'unknown'} /><Fact label="Envelope hash" value={record.eee?.envelope_hash ?? 'missing'} /></div><div className="grid gap-3 border-t border-[#222] pt-5 md:grid-cols-2"><Fact label="PGL event" value={record.pgl?.event_id ?? 'missing'} /><Fact label="Certificate" value={record.pgl?.certificate_id ?? 'missing'} /><Fact label="Event hash" value={record.pgl?.event_hash ?? 'missing'} /><Fact label="Previous hash" value={record.pgl?.previous_event_hash ?? 'unresolved'} /></div>{(record.verification_reasons?.length ?? 0) > 0 && <div className="rounded border border-cos-unknown/30 p-3 text-cos-unknown">Unresolved: {record.verification_reasons?.join(', ')}</div>}</div>}</div></div>
    </div>
    </div>
  </SectionShell>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded border border-[#222] bg-[#111] p-3"><div className="mb-1 text-[9px] uppercase tracking-widest text-[#666]">{label}</div><div className="break-all">{value}</div></div>; }
