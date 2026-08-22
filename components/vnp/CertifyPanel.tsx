'use client';

import { useState } from 'react';
import { AlertCircle, Award, CheckCircle, Clock, Globe, Shield } from 'lucide-react';
import type { BenchmarkApiEntry } from '@/lib/vnp/types';

interface CertifyPanelProps {
  apis: BenchmarkApiEntry[];
}

function ProofState({ present }: { present: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-widest ${
      present
        ? 'border-sky-500/20 bg-sky-500/10 text-sky-300'
        : 'border-[#FF7A00]/20 bg-[#FF7A00]/10 text-[#FF7A00]'
    }`}>
      {present ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {present ? 'Present' : 'Needs proof'}
    </span>
  );
}

export default function CertifyPanel({ apis }: CertifyPanelProps) {
  const [activeView, setActiveView] = useState<'leaderboard' | 'claim'>('leaderboard');

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#FF7A00]/20 bg-[#FF7A00]/5 p-5">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#FF7A00]" />
          <div>
            <div className="text-sm font-bold text-[#E6E6E9]">Certification requires trace evidence</div>
            <p className="mt-1 text-xs leading-relaxed text-[#A1A1A6]">
              Aggregate governed-run telemetry is present measurement data, not a certificate or
              verified trust score. No API is shown as certified without signed evidence.
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-fit gap-1 rounded-lg border border-[#1F1F1F] bg-[#111] p-1">
        {([
          { id: 'leaderboard' as const, label: 'Measurement status' },
          { id: 'claim' as const, label: 'Claim Your API' },
        ]).map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
              activeView === view.id
                ? 'border border-[#FFB800]/20 bg-[#1A1A1A] text-[#FFB800]'
                : 'text-[#6E6E73] hover:text-[#A1A1A6]'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {activeView === 'leaderboard' ? (
        <div className="space-y-3">
          {apis.length === 0 ? (
            <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] py-10 text-center text-sm text-[#6E6E73]">
              No recorded benchmark measurements.
            </div>
          ) : (
            apis.map((api) => {
              const hasMeasurements = api.sampleCount > 0;
              const percentilesReady = api.sampleCount >= 20;
              return (
                <div key={api.id} className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{api.name}</div>
                      <div className="mt-1 text-[10px] font-mono text-[#6E6E73]">{api.id}</div>
                    </div>
                    <ProofState present={hasMeasurements} />
                  </div>
                  <div className="mt-4 grid gap-3 text-[10px] font-mono sm:grid-cols-4">
                    <div>
                      <div className="text-[#6E6E73] uppercase">Sample count</div>
                      <div className="mt-1 text-[#E6E6E9]">{api.sampleCount}</div>
                    </div>
                    <div>
                      <div className="text-[#6E6E73] uppercase">Success rate</div>
                      <div className="mt-1 text-[#E6E6E9]">
                        {hasMeasurements ? `${api.successRatePercent}%` : 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#6E6E73] uppercase">Measured from</div>
                      <div className="mt-1 text-[#E6E6E9]">{api.measuredFrom}</div>
                    </div>
                    <div>
                      <div className="text-[#6E6E73] uppercase">Percentiles</div>
                      <div className="mt-1 text-[#E6E6E9]">
                        {percentilesReady ? 'Present' : 'Needs proof'}
                      </div>
                    </div>
                  </div>
                  {!percentilesReady && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-[#FFB800]">
                      <Clock className="h-3.5 w-3.5" />
                      {hasMeasurements
                        ? `Sample set is too thin for percentiles (${api.sampleCount}/20).`
                        : 'No sample set is available for percentile measurement.'}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="max-w-2xl space-y-5">
          <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-6">
            <div className="mb-6 flex items-start gap-4">
              <div className="rounded-xl border border-[#FFB800]/20 bg-[#FFB800]/10 p-3">
                <Globe className="h-6 w-6 text-[#FFB800]" />
              </div>
              <div>
                <h3 className="mb-1 text-lg font-bold text-white">Claim Your API</h3>
                <p className="text-sm leading-relaxed text-[#6E6E73]">
                  Ownership verification is a manual step. No verification key or certificate is
                  generated by this surface.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-[#FF7A00]/20 bg-[#FF7A00]/5 p-4 text-xs text-[#A1A1A6]">
              <div className="mb-2 flex items-center gap-2 font-mono uppercase tracking-widest text-[#FF7A00]">
                <Award className="h-4 w-4" />
                Manual step
              </div>
              A governed ownership-verification route is required before a certificate or badge
              can be issued. Current benchmark telemetry does not establish ownership.
            </div>
          </div>
          <div className="rounded-xl border border-[#1F1F1F] bg-[#0A0A0A] p-5">
            <div className="mb-3 text-[10px] font-mono uppercase tracking-widest text-[#6E6E73]">
              Evidence boundary
            </div>
            <div className="flex items-start gap-2 text-[11px] text-[#A1A1A6]">
              <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />
              <span>Governed-run aggregates remain labeled Present, never Verified.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
