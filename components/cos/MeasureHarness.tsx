'use client';

import React, { useState } from 'react';
import { Activity, BarChart2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { fetchExecutionMeasurement } from '@/lib/cos/verticalSlice';
import { ProofBadge } from './ProofBadge';

type Measurement = {
  execution_id: string; proof_state: 'verified'; vnp_api_did: string; provider: string;
  resulting_state: { hash: string; independently_observed: true };
  observations: Array<{ probe_id: string; worker_id: string; region: string; latency_ms: number; status_code: number; signature: string }>;
  aggregates: Array<{ region: string; p50_latency_ms: number; p95_latency_ms: number; p99_latency_ms: number; error_rate_percent: number; uptime_percent: number; throughput_rps: number; measured_at: string }>;
};

export function MeasureHarness() {
  const [executionId, setExecutionId] = useState('');
  const [measurement, setMeasurement] = useState<Measurement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const retrieve = async () => {
    if (!executionId) return;
    setLoading(true); setError(null); setMeasurement(null);
    try { setMeasurement(await fetchExecutionMeasurement(executionId) as Measurement); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Measurement unavailable'); }
    finally { setLoading(false); }
  };
  return <section className="mx-auto max-w-6xl px-5 py-10 lg:px-10">
    <div className="mb-10 flex items-start justify-between gap-6"><div><div className="mb-3 font-mono text-[10px] uppercase tracking-[0.24em] text-cos-accent">Measure Workspace</div><h1 className="text-4xl font-semibold tracking-tight text-cos-text">VNP Observation</h1><p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">Signed external observations for the provider used by one governed execution. Missing probes are missing proof.</p></div><ProofBadge status={error ? 'Degraded' : measurement ? 'Verified' : 'Needs proof'} /></div>
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-4"><div className="rounded-xl border border-cos-border bg-cos-surface/50 p-5"><h3 className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-cos-text"><ShieldCheck size={14} className="text-cos-accent" />Session authority</h3><label className="block text-[10px] uppercase tracking-wider text-cos-steel">Execution ID<input value={executionId} onChange={(e) => setExecutionId(e.target.value)} className="mt-1.5 w-full rounded border border-cos-border bg-cos-surface2 p-2 font-mono text-sm text-cos-text focus:border-cos-accent focus:outline-none" /></label><button onClick={retrieve} disabled={loading || !executionId} className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-cos-border bg-cos-surface2 py-2.5 font-mono text-[10px] uppercase tracking-wider text-cos-text disabled:opacity-50">{loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}{loading ? 'Measuring…' : 'Fetch observation'}</button></div>
      <div className="min-h-[360px] rounded-xl border border-cos-border bg-[#050505] lg:col-span-3"><div className="flex items-center gap-2 border-b border-[#222] bg-[#0A0A0A] p-3"><BarChart2 size={14} className="text-[#666]" /><span className="font-mono text-[10px] uppercase tracking-widest text-[#888]">Signed VNP probe geometry</span></div><div className="p-6 font-mono text-xs text-gray-300">{error && <div className="rounded border border-red-900/50 bg-red-950/20 p-4 text-red-400">[MEASUREMENT NOT VERIFIED] {error}</div>}{!error && !measurement && !loading && <div className="flex min-h-[260px] flex-col items-center justify-center text-[#555]"><Activity size={32} className="mb-4" />No signed observation loaded.</div>}{measurement && <div className="space-y-5"><div className="grid gap-3 md:grid-cols-4"><Metric label="Provider" value={measurement.provider} /><Metric label="VNP API DID" value={measurement.vnp_api_did} /><Metric label="Signed probes" value={String(measurement.observations.length)} /><Metric label="Observed result state" value={measurement.resulting_state.hash} /></div><div className="grid gap-3 md:grid-cols-3">{measurement.aggregates.map((row) => <div key={`${row.region}-${row.measured_at}`} className="rounded border border-[#222] bg-[#111] p-4"><div className="mb-3 text-cos-accent">{row.region}</div><div>p50 {row.p50_latency_ms} ms</div><div>p95 {row.p95_latency_ms} ms</div><div>p99 {row.p99_latency_ms} ms</div><div>uptime {row.uptime_percent}%</div><div>errors {row.error_rate_percent}%</div></div>)}</div></div>}</div></div>
    </div>
  </section>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded border border-[#222] bg-[#111] p-4"><div className="mb-1 text-[9px] uppercase tracking-widest text-[#666]">{label}</div><div className="break-all text-gray-100">{value}</div></div>; }
