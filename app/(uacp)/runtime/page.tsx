"use client";


import React from "react";
import { useApi } from "@/hooks/useApi";
import { ShieldCheck, Activity, AlertTriangle, ShieldAlert } from "lucide-react";

interface VnpMetrics {
  apis?: Array<{ id?: string; name?: string; provider?: string; compositeScore?: number; status?: string }>;
  network_status?: string;
  active_validators?: number;
  active_apis?: number;
  total_probes_recorded?: number;
  total_physical_probes_recorded?: number;
  total_slashed_minor?: number;
  avg_composite_score?: number;
  settlement_entries?: number;
  trustBeaconStatus?: string;
  blockAnchoredStatus?: string;
  trustBeaconMerkle?: string | null;
  blockAnchored?: number;
  timestamp?: string;
}

interface AuditLog {
  id?: string;
  event_type?: string;
  summary?: string;
  severity?: string;
  created_at?: string;
  timestamp?: string;
  tenant?: string;
  actor?: string;
  action?: string;
  entity?: string;
  transaction?: string;
}

interface RuntimeAuditRow {
  id: string;
  eventType: string;
  severity: string;
  summary: string;
  timestamp: string;
}

function normalizeAuditLog(log: AuditLog, index: number): RuntimeAuditRow {
  const eventType = log.event_type || log.action || "runtime_event";
  const timestamp = log.created_at || log.timestamp || "";
  const summary = log.summary
    || [
      log.entity ? `entity=${log.entity}` : null,
      log.transaction ? `scope=${log.transaction}` : null,
      log.actor ? `actor=${log.actor}` : null,
    ].filter(Boolean).join(" · ")
    || "BYOS audit log row returned without summary";

  return {
    id: log.id || `${eventType}-${timestamp || index}`,
    eventType,
    severity: log.severity || "info",
    summary,
    timestamp,
  };
}

function proofState(metrics?: VnpMetrics, sourceProblem?: unknown) {
  if (sourceProblem) {
    return {
      tone: "error" as const,
      title: "Needs proof",
      detail: "BYOS runtime telemetry route failed or returned an unreadable response.",
    };
  }

  if (!metrics?.timestamp) {
    return {
      tone: "pending" as const,
      title: "Needs proof",
      detail: "Waiting for /api/v1/vnp/metrics to return backend timestamped telemetry.",
    };
  }

  const physicalRows = metrics.total_physical_probes_recorded ?? metrics.total_probes_recorded ?? 0;
  const hasMetricRows = physicalRows > 0 || (metrics.active_apis ?? 0) > 0;
  const settlementAnchored = (metrics.settlement_entries ?? 0) > 0 && metrics.blockAnchoredStatus === "Connected";
  const trustBeaconAnchored = Boolean(metrics.trustBeaconMerkle) && metrics.trustBeaconStatus !== "Not Yet Wired";

  if (hasMetricRows && settlementAnchored && trustBeaconAnchored) {
    return {
      tone: "verified" as const,
      title: "Verified BYOS runtime telemetry",
      detail: `Metrics, settlement anchor, and trust beacon verified at ${metrics.timestamp}.`,
    };
  }

  if (hasMetricRows) {
    const missing = [
      settlementAnchored ? null : "settlement anchor",
      trustBeaconAnchored ? null : "trust beacon",
    ].filter(Boolean).join(" and ");

    return {
      tone: "partial" as const,
      title: "Partial BYOS runtime telemetry",
      detail: `Physical/API telemetry is live; ${missing || "additional proof"} still needs proof.`,
    };
  }

  return {
    tone: "pending" as const,
    title: "Needs proof",
    detail: `BYOS responded at ${metrics.timestamp}, but no metric rows were returned.`,
  };
}

export default function RuntimePage() {
  const { data: metrics, error: metricsError, isLoading: loadingMetrics } = useApi<VnpMetrics>("/api/v1/vnp/metrics");
  const { data: logsData, error: logsError, isLoading: loadingLogs } = useApi<{ events?: AuditLog[] } | AuditLog[]>("/api/v1/vnp/audit-logs");
  const logs = (Array.isArray(logsData) ? logsData : logsData?.events || []).map(normalizeAuditLog);
  const sourceProblem = metricsError || logsError;
  const proof = proofState(metrics, sourceProblem);
  const proofClass = proof.tone === "verified"
    ? "border-[#00FF66]/20 bg-[#00FF66]/5 text-[#00FF66]"
    : proof.tone === "partial"
    ? "border-[#ffab00]/30 bg-[#ffab00]/5 text-[#ffab00]"
    : "border-[#ff4d4d]/30 bg-[#ff4d4d]/5 text-[#ff6b6b]";

  return (
    <div className="p-6 space-y-6 min-h-full">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-[#00FF66]" />
        <h1 className="text-xl font-bold font-mono tracking-wider uppercase text-[#00FF66]">Runtime Enforcement</h1>
      </div>

      <div className={`border rounded-xl p-4 font-mono text-[11px] ${proofClass}`}>
        <div className="uppercase tracking-widest font-black">
          {proof.title}
        </div>
        <div className="mt-1 text-white/55">
          {proof.detail}
        </div>
        <div className="mt-2 text-white/35">
          Source routes: /api/v1/vnp/metrics and /api/v1/vnp/audit-logs
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Network Status", value: loadingMetrics ? "..." : (metrics?.network_status || "needs proof"), icon: Activity, color: "text-[#00FF66]" },
          { label: "Active APIs", value: loadingMetrics ? "..." : (metrics?.active_apis ?? "needs proof"), icon: ShieldCheck, color: "text-electric-cyan" },
          { label: "Physical Probes", value: loadingMetrics ? "..." : (metrics?.total_physical_probes_recorded ?? metrics?.total_probes_recorded ?? "needs proof"), icon: Activity, color: "text-[#b8860b]" },
          { label: "Settlement Entries", value: loadingMetrics ? "..." : (metrics?.settlement_entries ?? "needs proof"), icon: AlertTriangle, color: "text-laser-red" },
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Trust Beacon", value: loadingMetrics ? "..." : (metrics?.trustBeaconStatus || "needs proof"), detail: metrics?.trustBeaconMerkle || "No merkle root returned" },
          { label: "Block Anchor", value: loadingMetrics ? "..." : (metrics?.blockAnchoredStatus || "needs proof"), detail: `${metrics?.blockAnchored ?? 0} anchored settlement rows` },
          { label: "Audit Rows", value: loadingLogs ? "..." : logs.length, detail: logs.length ? "BYOS audit rows returned" : "No audit rows returned" },
        ].map((item) => (
          <div key={item.label} className="bg-black/60 border border-white/[0.07] rounded-xl p-4 overflow-hidden">
            <div className="text-[9px] uppercase tracking-widest text-white/30">{item.label}</div>
            <div className="mt-2 text-lg font-bold font-mono text-white/80">{item.value}</div>
            <div className="mt-1 text-[10px] text-white/35 font-mono">{item.detail}</div>
          </div>
        ))}
      </div>

      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="p-5 border-b border-white/10 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#00FF66]" />
          <h2 className="text-sm font-mono font-bold tracking-widest uppercase text-white/80">Runtime Audit Logs</h2>
        </div>
        <div className="p-0">
          {loadingLogs ? (
            <div className="p-8 text-center font-mono text-xs text-white/40">Loading runtime logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-white/40">No BYOS audit logs returned.</div>
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
                    <td className="p-4 font-mono text-xs text-white/70">{log.eventType}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-mono tracking-wider uppercase border ${log.severity === 'critical' ? 'text-laser-red border-laser-red/50 bg-laser-red/10' : 'text-[#00FF66] border-[#00FF66]/50 bg-[#00FF66]/10'}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-white/60">{log.summary}</td>
                    <td className="p-4 text-xs font-mono text-white/40">{log.timestamp ? new Date(log.timestamp).toLocaleString() : "needs proof"}</td>
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
