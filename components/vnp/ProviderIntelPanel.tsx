'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Search } from 'lucide-react';
import type { BenchmarkApiEntry } from '@/lib/vnp/types';

interface ProviderIntelPanelProps {
  apis: BenchmarkApiEntry[];
}

type Metric = {
  label: string;
  value: string;
  present: boolean;
  detail?: string;
};

function StateLabel({ present }: { present: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest ${
      present ? 'text-sky-300' : 'text-[#FF7A00]'
    }`}>
      {present ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {present ? 'Present' : 'Needs proof'}
    </span>
  );
}

function metricRows(api: BenchmarkApiEntry): Metric[] {
  const percentile = (label: string, value: number | null): Metric => ({
    label,
    value: value === null ? 'Unknown' : `${value}ms`,
    present: value !== null,
    detail: value === null && api.sampleCount > 0
      ? `Too thin for percentiles (${api.sampleCount}/20 samples).`
      : undefined,
  });

  return [
    percentile('p50 latency', api.p50),
    percentile('p95 latency', api.p95),
    percentile('p99 latency', api.p99),
    {
      label: 'Success rate',
      value: api.sampleCount > 0 ? `${api.successRatePercent}%` : 'Unknown',
      present: api.sampleCount > 0,
      detail: `Source: ${api.measuredFrom}; ${api.sampleCount} samples.`,
    },
  ];
}

export default function ProviderIntelPanel({ apis }: ProviderIntelPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);

  const filtered = useMemo(
    () => apis.filter((api) => api.name.toLowerCase().includes(search.toLowerCase())),
    [apis, search],
  );
  const selectedApi = useMemo(
    () => apis.find((api) => api.id === selectedApiId) ?? filtered[0] ?? null,
    [apis, filtered, selectedApiId],
  );
  const metrics = selectedApi ? metricRows(selectedApi) : [];

  return (
    <div className="grid min-h-[600px] grid-cols-[260px_1fr] gap-5">
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6E6E73]" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search APIs…"
            className="w-full rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] py-2 pl-8 pr-3 text-xs font-mono text-[#E6E6E9] outline-none placeholder:text-[#6E6E73]"
          />
        </div>
        <div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto pr-1">
          {filtered.map((api) => {
            const isSelected = (selectedApiId ?? filtered[0]?.id) === api.id;
            return (
              <button
                key={api.id}
                onClick={() => setSelectedApiId(api.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                  isSelected
                    ? 'border-[#FFB800]/40 bg-[#FFB800]/5'
                    : 'border-[#1F1F1F] bg-[#0A0A0A] hover:border-[#333]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`truncate text-[11px] font-semibold ${
                    isSelected ? 'text-[#FFB800]' : 'text-[#E6E6E9]'
                  }`}>
                    {api.name}
                  </span>
                  <span className="shrink-0 text-[9px] font-mono text-[#FF7A00]">
                    {api.sampleCount > 0 ? 'Present' : 'Needs proof'}
                  </span>
                </div>
                <div className="mt-1 text-[9px] font-mono text-[#6E6E73]">
                  {api.sampleCount} samples
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-8 text-center text-xs font-mono text-[#6E6E73]">No APIs found</div>
          )}
        </div>
      </div>

      {selectedApi ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedApi.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#6E6E73]">
                <span>ID: {selectedApi.id}</span>
                <span>Source: {selectedApi.measuredFrom}</span>
                <StateLabel present={selectedApi.sampleCount > 0} />
              </div>
            </div>
            <div className="rounded-lg border border-[#1F1F1F] bg-[#0A0A0A] px-3 py-2 text-right">
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#6E6E73]">Sample count</div>
              <div className="mt-1 text-lg font-black font-mono text-[#E6E6E9]">{selectedApi.sampleCount}</div>
            </div>
          </div>

          <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4">
            <div className="mb-4 text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
              Recorded run measurements
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {metrics.map((metric) => (
                <div key={metric.label} className="rounded-lg border border-[#1F1F1F] bg-[#070707] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#6E6E73]">{metric.label}</span>
                    <StateLabel present={metric.present} />
                  </div>
                  <div className={`mt-3 text-xl font-black font-mono ${
                    metric.present ? 'text-[#E6E6E9]' : 'text-[#FF7A00]'
                  }`}>
                    {metric.value}
                  </div>
                  {metric.detail && (
                    <div className="mt-2 flex items-start gap-1.5 text-[10px] leading-relaxed text-[#FFB800]">
                      <Clock className="mt-0.5 h-3 w-3 shrink-0" />
                      {metric.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#FF7A00]/20 bg-[#FF7A00]/5 p-4 text-xs text-[#A1A1A6]">
            <div className="mb-2 flex items-center gap-2 font-mono uppercase tracking-widest text-[#FF7A00]">
              <AlertCircle className="h-4 w-4" />
              Evidence boundary
            </div>
            Aggregate telemetry is labeled Present when recorded. It does not establish trace
            evidence, certification, or a verified trust score.
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] text-sm text-[#6E6E73]">
          No recorded benchmark measurements.
        </div>
      )}
    </div>
  );
}
