import React, { useState, useEffect } from 'react';
import { Activity, RefreshCw, DollarSign, Clock, Trash2 } from 'lucide-react';
import { EvaporatingCapabilityLease } from '../types.js';

export const VnpTelemetryView: React.FC = () => {
  const [leases, setLeases] = useState<EvaporatingCapabilityLease[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshTelemetry = async () => {
    setIsLoading(true);
    try {
      const leaseRes = await fetch('/api/local/x402/leases');
      const leaseData = await leaseRes.json();
      setLeases(leaseData);
    } catch (err) {
      console.error('Failed to fetch local lease state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvictLease = async (leaseId: string) => {
    try {
      await fetch('/api/local/x402/evict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId })
      });
      refreshTelemetry();
    } catch (err) {
      console.error('Failed to evict lease:', err);
    }
  };

  useEffect(() => {
    refreshTelemetry();
    const interval = setInterval(refreshTelemetry, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-slate-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-medium mb-1">
            <Activity className="w-4 h-4" /> VEKLOM NEXUS PROTOCOL (VNP) TELEMETRY
          </div>
          <h2 className="text-2xl font-bold text-white">VNP Telemetry & X402 Microtransactions</h2>
          <p className="text-xs text-slate-400 font-mono">
            Lease state is locally computed; infrastructure node health is not wired to a governed runtime source.
          </p>
        </div>

        <button
          onClick={refreshTelemetry}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs hover:text-white flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Node Health Availability */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white">Infrastructure Node Health</h3>
          <span className="px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold text-3xs">
            Needs proof
          </span>
        </div>
        <p className="text-slate-400">
          No governed node-health source is wired to this surface. Runtime infrastructure state is not reported.
        </p>
        <div className="flex flex-wrap gap-3 text-3xs uppercase tracking-wider">
          <span className="text-slate-400">Status: <strong className="text-cyan-400">Not started</strong></span>
          <span className="text-slate-400">Next step: <strong className="text-cyan-400">Manual step</strong></span>
        </div>
      </div>

      {/* X402 Active Evaporating Capability Leases Monitor */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" /> X402 Microtransaction Active Capability Leases
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Live decaying micro-leases. Capabilities mathematically evaporate upon TTL countdown or invocation budget depletion.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
            {leases.filter(l => l.status === 'ACTIVE').length} Active Micro-Leases
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-2xs text-slate-400 border-b border-slate-800">
                <th className="pb-3 font-semibold">Lease Token / ID</th>
                <th className="pb-3 font-semibold">Target Capability</th>
                <th className="pb-3 font-semibold">Agent / Human Owner</th>
                <th className="pb-3 font-semibold">TTL Decay</th>
                <th className="pb-3 font-semibold">Uses Left</th>
                <th className="pb-3 font-semibold">Paid (USDC)</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leases.map((l) => (
                <tr key={l.leaseId} className="hover:bg-slate-950/40">
                  <td className="py-3 font-bold text-cyan-400 font-mono">
                    {l.token}
                    <div className="text-3xs text-slate-500">{l.leaseId}</div>
                  </td>
                  <td className="py-3 text-slate-200 font-mono">{l.skillId}</td>
                  <td className="py-3 text-slate-300">
                    <div>{l.agentIdentity}</div>
                    <div className="text-3xs text-slate-500">{l.humanOwner}</div>
                  </td>
                  <td className="py-3 text-cyan-400 font-bold">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {l.remainingSeconds}s
                    </span>
                  </td>
                  <td className="py-3 text-slate-200">
                    {l.invocationsRemaining} / {l.maxInvocations}
                  </td>
                  <td className="py-3 text-emerald-400 font-bold">${l.pricePaidUsdc}</td>
                  <td className="py-3">
                    {l.status === 'ACTIVE' && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-3xs font-bold">
                        ACTIVE
                      </span>
                    )}
                    {l.status === 'EXPIRED_EVAPORATED' && (
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-3xs font-bold">
                        EVAPORATED
                      </span>
                    )}
                    {l.status === 'EVICTED' && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-3xs font-bold">
                        EVICTED
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {l.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleEvictLease(l.leaseId)}
                        className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                        title="Force Evict Lease"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
