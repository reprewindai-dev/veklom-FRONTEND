"use client";

export const dynamic = "force-dynamic";

import { useApi } from "@/hooks/useApi";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  DollarSign,
  ExternalLink,
  FileText,
  Fingerprint,
  Globe,
  KeyRound,
  Layers,
  Lock,
  Radio,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

// ── Helpers ────────────────────────────────────────────────────────────────────

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-[#00FF66] shadow-[0_0_6px_#00FF66]" : "bg-red-500 shadow-[0_0_6px_#f00]"} animate-pulse`}
    />
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  href,
  accentColor = "#00E5FF",
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  href?: string;
  accentColor?: string;
}) {
  return (
    <div
      className="relative bg-black/60 border border-white/[0.08] rounded-xl p-5 flex flex-col gap-3 overflow-hidden backdrop-blur-sm"
      style={{ boxShadow: `inset 0 0 30px rgba(0,0,0,0.4), 0 0 1px ${accentColor}18` }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentColor}55, transparent)` }}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}30` }}
          >
            <Icon className="w-3.5 h-3.5" style={{ color: accentColor }} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">{title}</span>
        </div>
        {href && (
          <Link href={href} className="text-white/30 hover:text-white/70 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">{label}</div>
      <div className={`text-base font-bold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[9px] text-white/25 font-mono mt-0.5">{sub}</div>}
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface HealthData {
  status: string;
  score?: number;
  version?: string;
  service?: string;
  timestamp?: string;
  components?: Record<string, { status: string; latency?: string }>;
}

interface UsageData {
  total_requests?: number;
  total_tokens?: number;
  total_cost_usd?: number;
  period?: string;
}

interface AuditData {
  events?: Array<{
    id: string;
    event_type: string;
    created_at: string;
    summary?: string;
    severity?: string;
  }>;
  total?: number;
}

interface WorkspaceData {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  genome_hash?: string;
  ledger_root?: string;
  created_at?: string;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ControlNodePage() {
  const health = useApi<HealthData>("/api/v1/sys/health");
  const usage = useApi<UsageData>("/api/v1/usage/summary");
  const audit = useApi<AuditData>("/api/v1/audit/events?limit=5");
  const workspace = useApi<WorkspaceData>("/api/v1/workspace");

  const isHealthy = health.data?.status === "healthy";
  const components = health.data?.components ?? {};
  const compKeys = Object.keys(components);

  const fmt = (n: number | undefined) =>
    n === undefined ? "—" : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

  return (
    <div className="p-6 space-y-6 min-h-full">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <StatusDot ok={isHealthy} />
            <h1 className="text-sm font-bold tracking-widest uppercase text-white/80">Control Node</h1>
            {health.data?.version && (
              <span className="font-mono text-[9px] text-white/30 border border-white/10 px-1.5 py-0.5 rounded">
                {health.data.version}
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/35 ml-5">
            Workspace health · activity · spend · routing · policy · audit
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
          <Radio className="w-3 h-3 text-electric-cyan animate-pulse" />
          <span>api.veklom.com</span>
        </div>
      </div>

      {/* ── Top KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "System Status",
            value: health.data ? (isHealthy ? "OPERATIONAL" : "DEGRADED") : "—",
            icon: ShieldCheck,
            color: isHealthy ? "text-[#00FF66]" : "text-red-400",
            accent: isHealthy ? "#00FF66" : "#f66",
          },
          {
            label: "Total Requests",
            value: fmt(usage.data?.total_requests),
            icon: Activity,
            color: "text-electric-cyan",
            accent: "#00E5FF",
          },
          {
            label: "Tokens Used",
            value: fmt(usage.data?.total_tokens),
            icon: Cpu,
            color: "text-[#FFB800]",
            accent: "#FFB800",
          },
          {
            label: "Spend (USD)",
            value: usage.data?.total_cost_usd !== undefined ? `$${usage.data.total_cost_usd.toFixed(4)}` : "—",
            icon: DollarSign,
            color: "text-[#b8860b]",
            accent: "#b8860b",
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="relative bg-black/60 border border-white/[0.07] rounded-xl p-4 overflow-hidden"
            style={{ boxShadow: `0 0 1px ${kpi.accent}30` }}
          >
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${kpi.accent}50, transparent)` }} />
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-widest text-white/30">{kpi.label}</span>
              <kpi.icon className="w-3.5 h-3.5" style={{ color: kpi.accent }} />
            </div>
            <div className={`text-xl font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Infrastructure Health */}
        <Panel title="Infrastructure" icon={Server} href="/status" accentColor="#00E5FF">
          {health.isLoading && <div className="text-[10px] text-white/30 animate-pulse">Probing endpoints...</div>}
          {compKeys.length > 0 ? (
            <div className="space-y-2.5">
              {compKeys.map((k) => {
                const comp = components[k];
                const ok = comp.status === "healthy" || comp.status === "ok";
                return (
                  <div key={k} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusDot ok={ok} />
                      <span className="text-[11px] text-white/60 capitalize">{k}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {comp.latency && <span className="text-[9px] font-mono text-white/25">{comp.latency}</span>}
                      <span className={`text-[9px] font-mono font-bold ${ok ? "text-[#00FF66]" : "text-red-400"}`}>
                        {comp.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !health.isLoading && (
            <div className="flex items-center gap-2 text-[11px]">
              <StatusDot ok={isHealthy} />
              <span className={isHealthy ? "text-[#00FF66]" : "text-red-400"}>
                {health.data?.service ?? "Veklom API"} — {health.data?.status?.toUpperCase() ?? "UNKNOWN"}
              </span>
            </div>
          )}
        </Panel>

        {/* Workspace Identity */}
        <Panel title="Workspace" icon={Fingerprint} href="/governance" accentColor="#b8860b">
          {workspace.isLoading && <div className="text-[10px] text-white/30 animate-pulse">Resolving identity...</div>}
          {workspace.data ? (
            <div className="space-y-2.5">
              <Stat label="Workspace" value={workspace.data.name ?? "—"} />
              <Stat label="Plan" value={workspace.data.plan ?? "—"} color="text-[#b8860b]" />
              {workspace.data.genome_hash && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">Genome Hash</div>
                  <div className="text-[10px] font-mono text-white/40 truncate">{workspace.data.genome_hash.slice(0, 20)}...</div>
                </div>
              )}
              {workspace.data.ledger_root && (
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">Ledger Root</div>
                  <div className="text-[10px] font-mono text-white/40 truncate">{workspace.data.ledger_root.slice(0, 20)}...</div>
                </div>
              )}
            </div>
          ) : !workspace.isLoading && (
            <div className="text-[11px] text-white/30">Complete onboarding to view workspace identity.</div>
          )}
        </Panel>

        {/* Zero-Trust Policy */}
        <Panel title="Zero-Trust" icon={Shield} href="/runtime" accentColor="#00FF66">
          <div className="space-y-2.5">
            {[
              { label: "Policy Engine", value: "ENFORCING", ok: true },
              { label: "PGL IdentityRAG", value: "ACTIVE", ok: true },
              { label: "Budget Guard", value: "ARMED", ok: true },
              { label: "VNP Staking", value: "BONDED", ok: true },
              { label: "Circuit Breaker", value: "CLOSED", ok: true },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot ok={row.ok} />
                  <span className="text-[11px] text-white/60">{row.label}</span>
                </div>
                <span className="text-[9px] font-mono font-bold text-[#00FF66]">{row.value}</span>
              </div>
            ))}
          </div>
        </Panel>

      </div>

      {/* ── Second Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Recent Audit Events */}
        <Panel title="Audit Feed" icon={FileText} href="/audit" accentColor="#00E5FF">
          {audit.isLoading && <div className="text-[10px] text-white/30 animate-pulse">Loading events...</div>}
          {audit.data?.events && audit.data.events.length > 0 ? (
            <div className="space-y-2 border-l border-white/[0.06] pl-3 ml-1">
              {audit.data.events.map((ev, i) => {
                const isCritical = ev.severity === "critical" || ev.severity === "high";
                return (
                  <div key={ev.id ?? i} className="relative">
                    <div
                      className="absolute left-[-14px] top-[5px] w-1.5 h-1.5 rounded-full border"
                      style={{
                        borderColor: isCritical ? "#f66" : "#00E5FF",
                        backgroundColor: "#030303",
                        boxShadow: `0 0 6px ${isCritical ? "#f66" : "#00E5FF"}`,
                      }}
                    />
                    <div className="text-[11px] text-white/70 font-medium">{ev.event_type}</div>
                    {ev.summary && <div className="text-[9px] text-white/30 truncate">{ev.summary}</div>}
                    <div className="text-[9px] text-white/20 font-mono">
                      {ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !audit.isLoading && (
            <div className="text-[11px] text-white/30">No recent audit events.</div>
          )}
        </Panel>

        {/* Quick Nav */}
        <Panel title="Mission Control" icon={Globe} accentColor="#b8860b">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Interlink Console", href: "/interlink", icon: Lock, desc: "cAPI execution proofs" },
              { label: "Pipelines & GPC", href: "/pipelines", icon: Zap, desc: "Governed inference chains" },
              { label: "Runtime Enforcement", href: "/runtime", icon: ShieldCheck, desc: "7-phase execution pipeline" },
              { label: "Governance", href: "/governance", icon: Layers, desc: "Identity & trust scores" },
              { label: "Incidents", href: "/incidents", icon: ShieldAlert, desc: "SLA breaches & slashing" },
              { label: "Playground", href: "/playground", icon: TrendingUp, desc: "Side-by-side model eval" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-start gap-2.5 p-3 rounded-lg border border-white/[0.06] hover:border-[#b8860b]/40 hover:bg-[#b8860b]/5 transition-all duration-200"
              >
                <item.icon className="w-4 h-4 text-white/30 group-hover:text-[#b8860b] transition-colors mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-medium text-white/60 group-hover:text-white/90 transition-colors">{item.label}</div>
                  <div className="text-[9px] text-white/20 leading-snug">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

      </div>

      {/* ── Footer Bar ── */}
      <div className="flex items-center justify-between text-[9px] font-mono text-white/20 border-t border-white/[0.04] pt-4">
        <span>VEKLOM CONTROL NODE — SOVEREIGN AI HUB</span>
        {health.data?.timestamp && (
          <span>Last sync: {new Date(health.data.timestamp).toLocaleTimeString()}</span>
        )}
        <div className="flex items-center gap-1">
          <StatusDot ok={isHealthy} />
          <span>{isHealthy ? "ALL SYSTEMS GO" : "DEGRADED"}</span>
        </div>
      </div>
    </div>
  );
}
