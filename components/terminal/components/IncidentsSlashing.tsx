"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Coins,
  Database,
  ExternalLink,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";

interface Probe {
  route: string;
  state: "verified" | "needs_proof" | "error";
  status: number;
  detail?: string;
}

interface ExposureRow {
  id: string;
  target: string;
  provider: string;
  status: string;
  severity: "slashed" | "breach_risk" | "warning" | "healthy";
  targetP95Ms: number | null;
  observedP95Ms: number | null;
  deviationMs: number | null;
  toleranceMs: number | null;
  pendingPenaltyUsdc: number;
  slashedTotalUsdc: number;
  bondAmountUsdc: number | null;
  consensus: Record<string, unknown> | null;
  evidenceState: "verified" | "needs_settlement_proof";
  detail: string;
}

interface IncidentsState {
  generated_at: string;
  source: string;
  proof: {
    state: "verified" | "partial" | "error";
    reason: string;
    probes: Probe[];
  };
  protocolStats: any;
  metrics: any;
  exposure: ExposureRow[];
  alerts: any[];
  incidents: any[];
  auditLogs: any[];
  totals: {
    totalValueBonded: number | null;
    activeApis: number | null;
    activeVerifiers: number | null;
    totalPenalties: number | null;
    slashedTotalUsdc: number;
    pendingPenaltyUsdc: number;
    criticalProviders: number;
    triggeredAlerts: number;
    incidentRows: number;
    auditRows: number;
  };
}

function fmtMoney(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Needs proof";
  return `$${Math.round(n).toLocaleString()}`;
}

function fmtNumber(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Needs proof";
  return n.toLocaleString();
}

function fmtMs(value: unknown): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Needs proof";
  return `${Math.round(n)}ms`;
}

function proofTone(state?: string): string {
  if (state === "verified") return "text-[#00FF66] border-[#00FF66]/25 bg-[#00FF66]/10";
  if (state === "error") return "text-red-300 border-red-400/25 bg-red-500/10";
  return "text-[#FFB800] border-[#FFB800]/25 bg-[#FFB800]/10";
}

function severityTone(severity: string): string {
  if (severity === "slashed") return "text-[#FF003C] border-[#FF003C]/30 bg-[#FF003C]/10";
  if (severity === "breach_risk") return "text-[#FFB800] border-[#FFB800]/30 bg-[#FFB800]/10";
  if (severity === "warning") return "text-amber-300 border-amber-300/25 bg-amber-300/10";
  return "text-[#00FF66] border-[#00FF66]/25 bg-[#00FF66]/10";
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}) {
  return (
    <div className="p-4 bg-void-metal/40 border border-white/5 rounded-xl flex flex-col gap-1">
      <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">{label}</span>
      <div className={`text-[20px] font-bold font-mono flex items-center gap-1.5 mt-1 ${tone}`}>
        <Icon className="w-5 h-5" />
        {value}
      </div>
      <span className="text-[9.5px] text-white/30">{sub}</span>
    </div>
  );
}

export default function IncidentsSlashing() {
  const [selectedId, setSelectedId] = useState<string>("");
  const { data, error, isLoading } = useApi<IncidentsState>("/incidents-slashing/state", {
    refreshInterval: 15000,
  });

  const exposure = data?.exposure || [];
  const selected = exposure.find((row) => row.id === selectedId) || exposure[0] || null;
  const proofState = error ? "error" : data?.proof.state || "needs_proof";
  const verifiedRoutes = data?.proof.probes.filter((probe) => probe.state === "verified").length || 0;

  useEffect(() => {
    if (!selectedId && exposure.length > 0) setSelectedId(exposure[0].id);
  }, [exposure, selectedId]);

  const highestRisk = useMemo(() => {
    const riskRows = exposure.filter((row) => row.severity === "breach_risk" || row.severity === "slashed");
    return riskRows.length;
  }, [exposure]);

  return (
    <div className="w-full h-full flex flex-col bg-[#030303] text-white/90 overflow-hidden font-sans border-l border-white/5 relative">
      <div className="absolute inset-0 grid-overlay opacity-20 pointer-events-none z-0" />

      <div className="h-12 border-b border-white/10 shrink-0 bg-void-black/80 backdrop-blur flex items-center justify-between px-6 z-10 select-none">
        <div className="flex items-center gap-2">
          <AlertTriangle className={`w-4.5 h-4.5 ${highestRisk ? "text-[#FFB800]" : "text-[#00FF66]"}`} />
          <span className="text-xs font-bold tracking-widest uppercase text-white">SLA INCIDENTS & SLASHING LEDGER</span>
        </div>
        <div className={`text-[10px] font-mono uppercase px-3 py-1 rounded border ${proofTone(proofState)}`}>
          Routes: <span className="text-white">{verifiedRoutes}/{data?.proof.probes.length || 0}</span>
          <span className="mx-2 text-white/25">|</span>
          {proofState === "verified" ? "Live proof" : proofState === "error" ? "Source error" : "Partial proof"}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 z-10 relative">
        {data?.proof.reason && (
          <div className={`rounded-lg border px-4 py-3 font-mono text-[10px] uppercase tracking-widest ${proofTone(proofState)}`}>
            {data.proof.reason}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard
            label="TOTAL BONDED VALUE"
            value={fmtMoney(data?.totals.totalValueBonded)}
            sub="BYOS /api/v1/x402/staking/state"
            icon={Coins}
            tone="text-[#00E5FF] text-glow-cyan"
          />
          <MetricCard
            label="SETTLED SLASHES"
            value={fmtMoney(data?.totals.slashedTotalUsdc)}
            sub="Sum of slashedTotalUsdc returned by BYOS"
            icon={TrendingDown}
            tone={Number(data?.totals.slashedTotalUsdc) > 0 ? "text-[#FF003C] text-glow-red" : "text-white/70"}
          />
          <MetricCard
            label="PENALTY EXPOSURE"
            value={fmtMoney(data?.totals.pendingPenaltyUsdc)}
            sub="Deviation penalty exposure, not settlement proof"
            icon={Activity}
            tone={Number(data?.totals.pendingPenaltyUsdc) > 0 ? "text-[#FFB800]" : "text-[#00FF66]"}
          />
          <MetricCard
            label="ACTIVE VERIFIERS"
            value={fmtNumber(data?.totals.activeVerifiers)}
            sub="0 means BYOS returned no live verifier rows"
            icon={CheckCircle}
            tone={Number(data?.totals.activeVerifiers) > 0 ? "text-[#00FF66]" : "text-[#FFB800]"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="text-[10px] font-mono tracking-wider text-white/30 uppercase">LIVE SLA EXPOSURE FROM BYOS</div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative z-10 min-h-[300px]">
              {isLoading && (
                <div className="flex items-center justify-center h-32 text-electric-cyan text-sm animate-pulse">
                  SYNCING WITH BYOS STAKING STATE...
                </div>
              )}
              {!isLoading && exposure.length === 0 && (
                <div className="p-6 rounded-xl border border-[#FFB800]/25 bg-[#FFB800]/5 text-[#FFB800] font-mono text-[11px] uppercase tracking-widest">
                  No route-backed provider exposure returned. No local incidents are generated.
                </div>
              )}
              {exposure.map((row) => (
                <button
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  className={`w-full p-4 bg-void-metal/30 border transition-all rounded-lg flex flex-col gap-3 relative overflow-hidden text-left ${
                    selected?.id === row.id ? "border-[#00E5FF]/35" : row.severity === "breach_risk" ? "border-[#FFB800]/30 hover:border-[#FFB800]/50" : "border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex justify-between items-start border-b border-white/5 pb-2 shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase ${severityTone(row.severity)}`}>
                          {row.severity.replace("_", " ")}
                        </span>
                        <span className="text-xs font-bold text-white/80">{row.target}</span>
                      </div>
                      <div className="text-[9px] text-white/40 font-mono mt-1 uppercase">
                        {row.provider} / status {row.status}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className={row.pendingPenaltyUsdc > 0 ? "text-xs font-bold text-[#FFB800]" : "text-xs font-bold text-[#00FF66]"}>
                        {fmtMoney(row.pendingPenaltyUsdc)}
                      </div>
                      <div className="text-[8.5px] text-white/30 flex items-center gap-1 justify-end">
                        <Clock className="w-2.5 h-2.5" /> {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : "Needs proof"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-white/70 leading-normal">{row.detail}</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-black/40 border border-white/5 p-3 rounded font-mono text-[9px]">
                    <div>
                      <div className="text-white/30 uppercase mb-1">Observed P95</div>
                      <div className="text-white/70">{fmtMs(row.observedP95Ms)}</div>
                    </div>
                    <div>
                      <div className="text-white/30 uppercase mb-1">SLA Target</div>
                      <div className="text-white/70">{fmtMs(row.targetP95Ms)}</div>
                    </div>
                    <div>
                      <div className="text-white/30 uppercase mb-1">Settlement Evidence</div>
                      <div className={row.evidenceState === "verified" ? "text-[#00FF66]" : "text-[#FFB800]"}>
                        {row.evidenceState === "verified" ? "Verified by BYOS" : "Needs settlement proof"}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-6">
            <div className="p-5 border border-white/10 rounded-xl bg-void-metal/80 backdrop-blur flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-bold tracking-wider uppercase text-white/80">Selected Provider Evidence</h3>
                <p className="text-[10px] text-white/40 mt-0.5">
                  Read-only values returned from BYOS. No local challenge voting or fake evidence hashes are emitted.
                </p>
              </div>

              {selected ? (
                <div className="flex flex-col gap-3">
                  <EvidenceRow label="Provider" value={selected.provider} />
                  <EvidenceRow label="Target" value={selected.target} />
                  <EvidenceRow label="Bond" value={fmtMoney(selected.bondAmountUsdc)} />
                  <EvidenceRow label="Settled Slash" value={fmtMoney(selected.slashedTotalUsdc)} />
                  <EvidenceRow label="Deviation" value={fmtMs(selected.deviationMs)} />
                  <EvidenceRow label="Tolerance" value={fmtMs(selected.toleranceMs)} />
                  <EvidenceRow label="Consensus Final" value={fmtMs(selected.consensus?.finalScore)} />
                </div>
              ) : (
                <div className="rounded-lg border border-white/5 bg-black/30 p-4 text-[11px] text-white/40">
                  No provider row selected.
                </div>
              )}
            </div>

            <div className="p-5 border border-white/10 rounded-xl bg-void-metal/85 backdrop-blur flex flex-col gap-3 font-mono text-[9.5px]">
              <div className="text-[#00E5FF] font-bold tracking-wider uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                <Database className="w-3.5 h-3.5 text-[#00E5FF]" /> SOURCE ROUTE PROOF
              </div>
              <div className="flex flex-col gap-2">
                {data?.proof.probes.map((probe) => (
                  <div key={probe.route} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0">
                    <span className="text-white/45 truncate">{probe.route}</span>
                    <span className={`px-2 py-0.5 rounded border uppercase ${proofTone(probe.state)}`}>{probe.state}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-white/45 leading-normal">
                Protected incident rows are not invented when `/api/v1/incidents/` returns auth-required. Triggered VNP alerts returned {fmtNumber(data?.totals.triggeredAlerts)} row(s).
              </div>
            </div>

            <div className="p-5 border border-white/10 rounded-xl bg-void-metal/85 backdrop-blur flex flex-col gap-3 font-mono text-[9.5px]">
              <div className="text-[#00FF66] font-bold tracking-wider uppercase flex items-center gap-1.5 border-b border-white/5 pb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-[#00FF66]" /> ENFORCEMENT STATUS
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/40">Triggered Alerts</span>
                <span className="text-white">{fmtNumber(data?.totals.triggeredAlerts)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/40">Protected Incidents</span>
                <span className={data?.totals.incidentRows ? "text-[#00FF66]" : "text-[#FFB800]"}>
                  {data?.totals.incidentRows ? fmtNumber(data.totals.incidentRows) : "Needs auth proof"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-white/40">Audit Logs</span>
                <span className="text-white">{fmtNumber(data?.totals.auditRows)}</span>
              </div>
              <a
                href={`${data?.source || "https://api.veklom.com"}/api/v1/x402/staking/state`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[#00E5FF] hover:text-white transition-colors"
              >
                Open BYOS staking state <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-white/5 bg-black/30 font-mono text-[10px]">
      <span className="text-white/35 uppercase">{label}</span>
      <span className="text-white/80 text-right truncate" title={value}>{value}</span>
    </div>
  );
}
