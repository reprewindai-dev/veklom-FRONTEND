'use client';

import { useEffect, useRef, useState } from 'react';
import { Activity, BarChart2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { ProofBadge } from './ProofBadge';
import { useSandboxMode } from '@/lib/cos/sandbox';
import { useStageData } from '@/lib/cos/useStageData';
import { formatObservedCount, proofRecordStatus, requestStillCurrent } from '@/lib/cos/vertical-slice-truth';
import { SectionShell } from './SectionShell';

type Measurement = {
 execution_id: string;
 proof_state: 'verified' | 'failed' | 'unknown' | 'degraded';
 vnp_api_did: string;
 provider: string;
 resulting_state?: { hash?: string; independently_observed?: boolean };
 observations?: Array<{ probe_id: string; worker_id: string; region: string; latency_ms: number; status_code: number; signature: string }>;
 aggregates?: Array<{ region: string; p50_latency_ms: number; p95_latency_ms: number; p99_latency_ms: number; error_rate_percent: number; uptime_percent: number; throughput_rps: number; measured_at: string }>;
};

export function MeasureHarness() {
 const sandbox = useSandboxMode();
 const stageData = useStageData('measure');
 const [executionId, setExecutionId] = useState('');
 const [measurement, setMeasurement] = useState<Measurement | null>(null);
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
 setLoading(true); setError(null); setMeasurement(null);
 try {
 const result = await stageData.call<Measurement>({
 method: 'GET',
 path: `/v1/executions/${encodeURIComponent(requestedExecutionId)}/measurements`,
 classification: 'live',
 response: 'execution-bound VNP measurement',
 });
 if (!requestStillCurrent(requestedExecutionId, currentExecutionId.current, sequence, requestSequence.current)) return;
 const next = result.data;
 if (!next) {
 if (result.record.status !== 404) setError(result.record.error ?? 'Measurement unavailable');
 return;
 }
 setMeasurement(next.execution_id === requestedExecutionId ? next : { ...next, proof_state: 'failed' });
 } catch (caught) {
 if (requestStillCurrent(requestedExecutionId, currentExecutionId.current, sequence, requestSequence.current)) {
 setError(caught instanceof Error ? caught.message : 'Measurement unavailable');
 }
 } finally {
 if (requestStillCurrent(requestedExecutionId, currentExecutionId.current, sequence, requestSequence.current)) setLoading(false);
 }
 }

 const verified = measurement?.proof_state === 'verified' && measurement.resulting_state?.independently_observed === true;
 const proof = proofRecordStatus({ verified, degraded: Boolean(error), sandbox });
 return <SectionShell stage={stageData.stage} proof={proof} records={stageData.records}>
 <div className="xl:col-span-2">
 <div className="mb-10 flex items-start justify-between gap-6"><div><div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">Measure Workspace</div><h1 className="text-4xl font-semibold tracking-tight text-cos-text">VNP Observation</h1><p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">Signed external observations for the provider used by one governed execution. Missing probes are missing proof.</p></div><ProofBadge status={proof} /></div>
 <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
 <div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5"><h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text"><ShieldCheck size={14} className="text-cos-accent" />Session authority</h3><label className="block text-[10px] uppercase tracking-wider text-cos-steel">Execution ID<input value={executionId} onChange={(event) => { const value = event.target.value; requestSequence.current += 1; currentExecutionId.current = value; setExecutionId(value); setLoading(false); setMeasurement(null); setError(null); }} className="mt-1.5 w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-sm text-cos-text focus:border-cos-accent focus:outline-none" /></label><button onClick={retrieve} disabled={loading || !executionId} className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-cos-border bg-cos-surface2 py-2.5 font-mono text-[10px] uppercase tracking-wider text-cos-text disabled:opacity-50">{loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}{loading ? 'Measuring…' : 'Fetch observation'}</button></div>
 <div className="min-h-[360px] rounded-xl border border-cos-border bg-[#050505] lg:col-span-3"><div className="flex items-center gap-2 border-b border-[#222] bg-[#0A0A0A] p-3"><BarChart2 size={14} className="text-[#666]" /><span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">Signed VNP probe geometry</span></div><div className="p-6 font-mono text-xs text-gray-300">{error && <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-red-400">[MEASUREMENT NOT VERIFIED] {error}</div>}{!error && !measurement && !loading && <div className="flex min-h-[260px] flex-col items-center justify-center text-[#555]"><Activity size={32} className="mb-4" />No signed observation loaded.</div>}{measurement && <div className="space-y-5"><div className="grid gap-3 md:grid-cols-4"><Metric label="Execution" value={measurement.execution_id} /><Metric label="Provider" value={measurement.provider ?? 'unknown'} /><Metric label="VNP API DID" value={measurement.vnp_api_did ?? 'missing'} /><Metric label="Signed probes" value={formatObservedCount(measurement.observations)} /><Metric label="Observed result state" value={measurement.resulting_state?.hash ?? 'missing'} /></div>{!verified && <div className="rounded border border-cos-unknown/30 p-3 text-cos-unknown">Measurement proof state: {measurement.proof_state ?? 'unknown'}. Independent resulting-state proof was not established.</div>}<div className="grid gap-3 md:grid-cols-3">{(measurement.aggregates ?? []).map((row) => <div key={`${row.region}-${row.measured_at}`} className="rounded border border-[#222] bg-[#111] p-4"><div className="mb-3 text-cos-accent">{row.region}</div><div>p50 {row.p50_latency_ms} ms</div><div>p95 {row.p95_latency_ms} ms</div><div>p99 {row.p99_latency_ms} ms</div><div>uptime {row.uptime_percent}%</div><div>errors {row.error_rate_percent}%</div></div>)}</div></div>}</div></div>
 </div>
 </div>
 </SectionShell>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded border border-[#222] bg-[#111] p-4"><div className="mb-1 text-[9px] uppercase tracking-widest text-[#666]">{label}</div><div className="break-all text-gray-100">{value}</div></div>; }
