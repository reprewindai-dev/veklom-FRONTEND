"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { useApi } from "@/hooks/useApi";
import { ShieldCheck, Activity, AlertTriangle, ShieldAlert } from "lucide-react";

interface VnpMetrics {
  total_staked: number;
  active_bonds: number;
  yield_rate: string;
  slashed_total: number;
}

interface AuditLog {
  id: string;
  event_type: string;
  summary: string;
  severity: string;
  created_at: string;
}

export default function RuntimePage() {
  const { data: metrics, isLoading: loadingMetrics } = useApi<VnpMetrics>("/api/v1/vnp/metrics");
  const { data: logsData, isLoading: loadingLogs } = useApi<{ events: AuditLog[] }>("/api/v1/vnp/audit-logs");
  const logs = logsData?.events || [];

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-[#00FF66]" />
        <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-[#00FF66]">Runtime Enforcement</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total VNP Staked", value: loadingMetrics ? "..." : (metrics?.total_staked || 0), icon: Activity, color: "text-[#00FF66]" },
          { label: "Active Performance Bonds", value: loadingMetrics ? "..." : (metrics?.active_bonds || 0), icon: ShieldCheck, color: "text-electric-cyan" },
          { label: "Current Yield Rate", value: loadingMetrics ? "..." : (metrics?.yield_rate || "0%"), icon: Activity, color: "text-[#b8860b]" },
          { label: "Total Slashed", value: loadingMetrics ? "..." : (metrics?.slashed_total || 0), icon: AlertTriangle, color: "text-laser-red" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-black/60 border border-white/[0.07] rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-widest text-white/30">{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="p-5 border-b border-white/10 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#00FF66]" />
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-white/80">VNP Audit Logs</h2>
        </div>
        <div className="p-0">
          {loadingLogs ? (
            <div className="p-8 text-center font-mono text-xs text-white/40">Loading runtime logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-white/40">No audit logs found.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-[10px] uppercase font-mono tracking-widest text-white/40">
                  <th className="p-4 font-semibold">Event Type</th>
                  <th className="p-4 font-semibold">Severity</th>
                  <th className="p-4 font-semibold">Summary</th>
                  <th className="p-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-xs text-white/70">{log.event_type}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider uppercase border ${log.severity === 'critical' ? 'text-laser-red border-laser-red/50 bg-laser-red/10' : 'text-[#00FF66] border-[#00FF66]/50 bg-[#00FF66]/10'}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white/60">{log.summary}</td>
                    <td className="p-4 text-xs font-mono text-white/40">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
