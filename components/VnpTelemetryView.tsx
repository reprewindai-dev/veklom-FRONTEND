import React, { useState, useEffect } from 'react';
import { Activity, Server, Cpu, HardDrive, CheckCircle2, ShieldCheck, RefreshCw, Zap, AlertTriangle, DollarSign, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { ContainerNodeHealth, EvaporatingCapabilityLease } from '../types.js';

export const VnpTelemetryView: React.FC = () => {
  const [nodes, setNodes] = useState<ContainerNodeHealth[]>([]);
  const [leases, setLeases] = useState<EvaporatingCapabilityLease[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNodeHealth = async () => {
    setIsLoading(true);
    try {
      const [nodeRes, leaseRes] = await Promise.all([
        fetch('/api/v1/nodes/health'),
        fetch('/api/v1/x402/leases')
      ]);
      const nodeData = await nodeRes.json();
      const leaseData = await leaseRes.json();
      setNodes(nodeData);
      setLeases(leaseData);
    } catch (err) {
      console.error('Failed to fetch node health or leases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvictLease = async (leaseId: string) => {
    try {
      await fetch('/api/v1/x402/evict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaseId })
      });
      fetchNodeHealth();
    } catch (err) {
      console.error('Failed to evict lease:', err);
    }
  };

  useEffect(() => {
    fetchNodeHealth();
    const interval = setInterval(fetchNodeHealth, 4000);
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
          <h2 className="text-2xl font-bold text-white">Hetzner / Coolify Container Infrastructure & X402 Microtransactions</h2>
          <p className="text-xs text-slate-400 font-mono">
            Real-time container health, CPU/RAM utilization, microsecond latency metrics, and X402 evaporating capability lease decays.
          </p>
        </div>

        <button
          onClick={fetchNodeHealth}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs hover:text-white flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Nodes Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        {nodes.map((node) => (
          <div key={node.nodeId} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">{node.serviceName}</h3>
                <div className="text-3xs text-slate-400">{node.nodeName}</div>
              </div>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-3xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {node.status}
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-2xs">
              <div className="flex justify-between">
                <span className="text-slate-400">IP / Region:</span>
                <span className="text-slate-200">{node.ipAddress} ({node.region})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Container ID:</span>
                <span className="text-cyan-400 truncate max-w-[150px]">{node.containerId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Uptime:</span>
                <span className="text-emerald-400">{Math.floor(node.uptimeSec / 3600)}h {Math.floor((node.uptimeSec % 3600) / 60)}m</span>
              </div>
            </div>

            {/* Gauge Metrics */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-2xs">
                  <span className="text-slate-400">CPU Load</span>
                  <span className="text-cyan-400 font-bold">{node.cpuPercent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${node.cpuPercent}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-2xs">
                  <span className="text-slate-400">RAM Usage</span>
                  <span className="text-emerald-400 font-bold">{node.memoryUsedMb} MB / {node.memoryLimitMb} MB</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(node.memoryUsedMb / node.memoryLimitMb) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        ))}
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
                  <td className="py-3 text-amber-400 font-bold">
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
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-3xs font-bold">
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

