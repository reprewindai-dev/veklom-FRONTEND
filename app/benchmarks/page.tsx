"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import { Button, Spinner, ErrorBox, SuccessBox } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, KV, Field } from "@/components/telemetry";
import {
  Trophy, ChevronDown, ChevronUp, Shield, Zap, Activity, Globe, Server,
  Sparkles, ExternalLink, TrendingUp, Lock, FileJson, BarChart3, Search,
  ShieldCheck, Gauge, Eye, BadgeCheck, Award, Hash, FlaskConical, Radio,
  CheckCircle2, XCircle, ArrowUp, ArrowDown, Minus,
} from "lucide-react";
import clsx from "clsx";

/* =========================================================================
   Types
   ========================================================================= */

interface VabpPillar {
  score: number;
  label: string;
  bolaPass?: boolean;
  shadowApiMatch?: number;
  injectionResilience?: number;
  maxRps?: number;
  rateLimitGrace?: boolean;
  degradationClean?: boolean;
  dataExfiltration?: string;
  tlsVersion?: string;
  pglIntegration?: boolean;
}

interface VabpData {
  trustScore: number;
  pillars: { security: VabpPillar; performance: VabpPillar; compliance: VabpPillar };
  badges: string[];
  certifiedAt: string;
}

interface BenchmarkAPI {
  id: string;
  rank: number;
  name: string;
  category: string;
  sovereignTier: string;
  slaSuccess: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  driftIndex: number;
  endpointUrl: string | null;
  description: string | null;
  mcpSchema: Record<string, unknown> | null;
  provider: string | null;
  throughput: number;
  uptime24h: number;
  totalStaked: number;
  status: string;
  sovereignty: {
    data_residency?: string;
    crypto_standards?: string;
    framework_compliance?: string[];
    audit_frequency?: string;
  };
  vabp: VabpData;
}

interface StakingMarket {
  id: string;
  apiId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  totalPool: number;
  resolved: boolean;
}

interface CompileResult {
  status: string;
  apiId: string;
  apiName: string;
  category: string;
  mcpSchema: Record<string, unknown> | null;
  metrics: { comprehension: number; latency: number; driftScore: number; compileTimeMs: number };
  registeredOnLeaderboard: boolean;
}

/* =========================================================================
   Helpers
   ========================================================================= */

const CATEGORY_ICONS: Record<string, typeof Trophy> = {
  payments: Zap, banking: Shield, healthcare: Activity, government: Globe,
  ai_inference: Sparkles, energy: TrendingUp, general: Server,
};

const CATEGORY_GRADIENT: Record<string, string> = {
  payments: "from-violet-500/20 to-violet-900/0",
  banking: "from-emerald-500/20 to-emerald-900/0",
  healthcare: "from-rose-500/20 to-rose-900/0",
  government: "from-blue-500/20 to-blue-900/0",
  ai_inference: "from-amber-500/20 to-amber-900/0",
  energy: "from-cyan-500/20 to-cyan-900/0",
  general: "from-gray-500/20 to-gray-900/0",
};

function statusColor(s: string) {
  if (s === "excellent") return "text-accent-green";
  if (s === "nominal") return "text-brand-400";
  return "text-accent-red";
}
function statusGlow(s: string) {
  if (s === "excellent") return "shadow-[0_0_12px_rgba(52,211,153,0.3)]";
  if (s === "nominal") return "shadow-[0_0_12px_rgba(251,191,36,0.2)]";
  return "shadow-[0_0_12px_rgba(248,113,113,0.3)]";
}

function tierTone(t: string): "green" | "amber" | "cyan" | "neutral" {
  if (t === "Tier-1") return "green";
  if (t === "Tier-2") return "amber";
  return "cyan";
}

function trustScoreColor(s: number) {
  if (s >= 900) return "text-accent-green";
  if (s >= 800) return "text-brand-400";
  if (s >= 700) return "text-amber-400";
  return "text-accent-red";
}
function trustScoreRing(s: number) {
  if (s >= 900) return "ring-accent-green/40";
  if (s >= 800) return "ring-brand-400/40";
  if (s >= 700) return "ring-amber-400/40";
  return "ring-accent-red/40";
}

function pillarColor(s: number) {
  if (s >= 90) return "bg-accent-green";
  if (s >= 80) return "bg-brand-400";
  if (s >= 70) return "bg-amber-400";
  return "bg-accent-red";
}
function pillarTextColor(s: number) {
  if (s >= 90) return "text-accent-green";
  if (s >= 80) return "text-brand-400";
  if (s >= 70) return "text-amber-400";
  return "text-accent-red";
}

function fmtMs(n: number) { return `${n.toFixed(1)}ms`; }
function fmtPct(n: number) { return `${n.toFixed(2)}%`; }
function fmtNum(n: number) { return n.toLocaleString(); }
function fmtUsd(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

function BoolBadge({ value, label }: { value: boolean | undefined; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      {value ? <CheckCircle2 size={12} className="text-accent-green" /> : <XCircle size={12} className="text-ink-600" />}
      <span className={value ? "text-ink-200" : "text-ink-600"}>{label}</span>
    </div>
  );
}

/* =========================================================================
   Trust Score Ring — SVG circular gauge
   ========================================================================= */

function TrustScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const pct = Math.min(score / 1000, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = score >= 900 ? "#34d399" : score >= 800 ? "#c084fc" : score >= 700 ? "#fbbf24" : "#f87171";

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[15px] font-bold tabular-nums" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

/* =========================================================================
   VABP Pillar Bar
   ========================================================================= */

function PillarBar({ label, score, icon: Icon }: { label: string; score: number; icon: typeof Shield }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-ink-500">
          <Icon size={11} /> {label}
        </div>
        <span className={clsx("text-[13px] font-bold tabular-nums", pillarTextColor(score))}>{score}/100</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all duration-700", pillarColor(score))}
          style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

/* =========================================================================
   Expandable API Card — Premium
   ========================================================================= */

function APICard({ api: a, expanded, onToggle }: { api: BenchmarkAPI; expanded: boolean; onToggle: () => void }) {
  const CatIcon = CATEGORY_ICONS[a.category] || Server;
  const gradient = CATEGORY_GRADIENT[a.category] || CATEGORY_GRADIENT.general;
  const vabp = a.vabp;
  const hasTrustScore = vabp && typeof vabp.trustScore === "number";

  return (
    <div className={clsx(
      "rounded-xl border border-border/80 overflow-hidden transition-all duration-300",
      expanded ? "bg-bg-800/90 border-brand-400/30" : "bg-bg-800/50 hover:border-border",
      expanded && statusGlow(a.status),
    )}>
      {/* Card header */}
      <button onClick={onToggle} className="w-full text-left p-5 transition group relative overflow-hidden">
        {/* Subtle category gradient sweep */}
        <div className={clsx("absolute inset-0 bg-gradient-to-r opacity-40 pointer-events-none", gradient)} />

        <div className="relative flex items-center gap-4">
          {/* Rank badge */}
          <div className="hidden sm:flex flex-col items-center shrink-0 w-8">
            <span className="text-[10px] uppercase tracking-widest text-ink-600">#{a.rank}</span>
          </div>

          {/* Icon + status glow */}
          <div className="relative shrink-0">
            <div className={clsx(
              "w-12 h-12 rounded-xl border flex items-center justify-center transition-all",
              a.status === "excellent" ? "bg-accent-green/10 border-accent-green/30" :
              a.status === "nominal" ? "bg-brand-400/10 border-brand-400/30" :
              "bg-accent-red/10 border-accent-red/30"
            )}>
              <CatIcon size={20} className={clsx(
                a.status === "excellent" ? "text-accent-green" :
                a.status === "nominal" ? "text-brand-400" : "text-accent-red"
              )} />
            </div>
            <span className={clsx(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-bg-800 animate-pulse",
              a.status === "excellent" ? "bg-accent-green" : a.status === "nominal" ? "bg-brand-400" : "bg-accent-red"
            )} />
          </div>

          {/* Name + provider + badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-[16px] font-semibold text-ink-50 truncate group-hover:text-brand-300 transition">{a.name}</h3>
              <Pill tone={tierTone(a.sovereignTier)}>{a.sovereignTier}</Pill>
              <span className={clsx("text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded", statusColor(a.status))}>
                {a.status}
              </span>
            </div>
            <div className="text-[11px] text-ink-500 mt-1 truncate">{a.provider} &middot; {a.category.replace("_", " ")}</div>
            {/* VABP badges row */}
            {vabp?.badges && vabp.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {vabp.badges.slice(0, 4).map((b) => (
                  <span key={b} className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-400/10 text-brand-300 border border-brand-400/20">
                    <BadgeCheck size={9} /> {b}
                  </span>
                ))}
                {vabp.badges.length > 4 && (
                  <span className="text-[9px] text-ink-500 px-1 self-center">+{vabp.badges.length - 4}</span>
                )}
              </div>
            )}
          </div>

          {/* Trust Score ring */}
          {hasTrustScore && (
            <div className="hidden lg:block shrink-0">
              <TrustScoreRing score={vabp.trustScore} size={56} />
            </div>
          )}

          {/* Key metrics */}
          <div className="hidden md:flex items-center gap-5 shrink-0">
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">SLA</div>
              <div className="text-[14px] font-bold tabular-nums text-ink-100">{fmtPct(a.slaSuccess)}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">P50</div>
              <div className="text-[14px] font-bold tabular-nums text-ink-100">{fmtMs(a.p50Latency)}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">Throughput</div>
              <div className="text-[14px] font-bold tabular-nums text-ink-100">{fmtNum(a.throughput)}/s</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">Staked</div>
              <div className="text-[14px] font-bold tabular-nums text-brand-400">{fmtUsd(a.totalStaked)}</div>
            </div>
          </div>

          {/* Chevron */}
          <div className={clsx(
            "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all",
            expanded ? "bg-brand-400/20 text-brand-300" : "bg-white/[0.04] text-ink-600 group-hover:text-ink-300"
          )}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>

        {/* Mobile metrics + trust score */}
        <div className="md:hidden grid grid-cols-4 gap-2 mt-3 relative">
          <div><div className="text-[9px] uppercase text-ink-600">SLA</div><div className="text-xs font-bold tabular-nums">{fmtPct(a.slaSuccess)}</div></div>
          <div><div className="text-[9px] uppercase text-ink-600">P50</div><div className="text-xs font-bold tabular-nums">{fmtMs(a.p50Latency)}</div></div>
          <div><div className="text-[9px] uppercase text-ink-600">Tput</div><div className="text-xs font-bold tabular-nums">{fmtNum(a.throughput)}/s</div></div>
          {hasTrustScore ? (
            <div><div className="text-[9px] uppercase text-ink-600">Trust</div><div className={clsx("text-xs font-bold tabular-nums", trustScoreColor(vabp.trustScore))}>{vabp.trustScore}/1000</div></div>
          ) : (
            <div><div className="text-[9px] uppercase text-ink-600">Staked</div><div className="text-xs font-bold tabular-nums text-brand-400">{fmtUsd(a.totalStaked)}</div></div>
          )}
        </div>
      </button>

      {/* ─── Expandable drawer ─── */}
      {expanded && (
        <div className="border-t border-border/60 animate-fade-up">
          {/* VABP Trust Score hero bar */}
          {hasTrustScore && (
            <div className="px-5 py-4 bg-gradient-to-r from-bg-900 via-bg-800/80 to-bg-900 border-b border-border/40">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-3">
                  <TrustScoreRing score={vabp.trustScore} size={72} />
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-ink-500">VABP Trust Score</div>
                    <div className={clsx("text-[28px] font-black tabular-nums tracking-tight leading-none mt-0.5", trustScoreColor(vabp.trustScore))}>
                      {vabp.trustScore}<span className="text-[14px] text-ink-600 font-semibold">/1000</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-[280px] space-y-2">
                  <PillarBar label="Security & Vulnerability" score={vabp.pillars.security.score} icon={ShieldCheck} />
                  <PillarBar label="Performance & Reliability" score={vabp.pillars.performance.score} icon={Gauge} />
                  <PillarBar label="Data Compliance & Privacy" score={vabp.pillars.compliance.score} icon={Eye} />
                </div>
                {/* Badges column */}
                <div className="shrink-0 space-y-1.5">
                  <div className="text-[9px] uppercase tracking-widest text-ink-600">Cryptographic Badges</div>
                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                    {vabp.badges.map((b) => (
                      <span key={b} className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-400/15 text-brand-200 border border-brand-400/25">
                        <Award size={8} /> {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border/50">
            {/* Left: Sovereignty, Audit, and VABP Details */}
            <div className="p-5 space-y-5">
              {/* Description */}
              {a.description && (
                <p className="text-[12px] text-ink-300 leading-relaxed border-l-2 border-brand-400/40 pl-3">{a.description}</p>
              )}

              {/* Performance metrics grid */}
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 flex items-center gap-1.5 mb-3">
                  <Gauge size={12} /> Performance Metrics
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: "P50 Latency", v: fmtMs(a.p50Latency) },
                    { k: "P95 Latency", v: fmtMs(a.p95Latency) },
                    { k: "P99 Latency", v: fmtMs(a.p99Latency) },
                    { k: "Drift Index", v: a.driftIndex.toFixed(4) },
                    { k: "Uptime (24h)", v: fmtPct(a.uptime24h) },
                    { k: "Throughput", v: `${fmtNum(a.throughput)}/s` },
                  ].map((item) => (
                    <div key={item.k} className="bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                      <div className="text-[9px] uppercase tracking-wider text-ink-600">{item.k}</div>
                      <div className="text-[13px] font-semibold tabular-nums text-ink-100 mt-0.5">{item.v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VABP pillar details */}
              {hasTrustScore && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 flex items-center gap-1.5 mb-3">
                    <FlaskConical size={12} /> VABP Pillar Diagnostics
                  </div>
                  <div className="space-y-3">
                    {/* Security */}
                    <div className="bg-white/[0.015] rounded-lg p-3 border border-white/[0.04] space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">Pillar 1 — Security (OWASP / NIST SP 800-228)</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <BoolBadge value={vabp.pillars.security.bolaPass} label="BOLA Pass" />
                        <div className="text-[11px] text-ink-200">Shadow API Match: <span className="font-semibold tabular-nums">{vabp.pillars.security.shadowApiMatch}%</span></div>
                        <div className="text-[11px] text-ink-200">Injection Resilience: <span className="font-semibold tabular-nums">{vabp.pillars.security.injectionResilience}/100</span></div>
                      </div>
                    </div>
                    {/* Performance */}
                    <div className="bg-white/[0.015] rounded-lg p-3 border border-white/[0.04] space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">Pillar 2 — Performance (SLA Validation)</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <div className="text-[11px] text-ink-200">Max RPS: <span className="font-semibold tabular-nums">{fmtNum(vabp.pillars.performance.maxRps || 0)}</span></div>
                        <BoolBadge value={vabp.pillars.performance.rateLimitGrace} label="429 Grace" />
                        <BoolBadge value={vabp.pillars.performance.degradationClean} label="Clean Degradation" />
                      </div>
                    </div>
                    {/* Compliance */}
                    <div className="bg-white/[0.015] rounded-lg p-3 border border-white/[0.04] space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">Pillar 3 — Compliance (FedRAMP / HIPAA)</div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        <div className="text-[11px] text-ink-200">TLS: <span className="font-semibold">{vabp.pillars.compliance.tlsVersion}</span></div>
                        <div className="text-[11px] text-ink-200">Exfiltration: <span className={clsx("font-semibold uppercase", vabp.pillars.compliance.dataExfiltration === "pass" ? "text-accent-green" : "text-accent-red")}>{vabp.pillars.compliance.dataExfiltration}</span></div>
                        <BoolBadge value={vabp.pillars.compliance.pglIntegration} label="PGL Integration" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sovereignty & Compliance */}
              {a.sovereignty && Object.keys(a.sovereignty).length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 flex items-center gap-1.5 mb-3">
                    <Lock size={12} /> Sovereignty &amp; Data Residency
                  </div>
                  <div className="space-y-0.5">
                    {a.sovereignty.data_residency && <KV k="Data Residency" v={a.sovereignty.data_residency} mono={false} />}
                    {a.sovereignty.crypto_standards && <KV k="Crypto Standards" v={a.sovereignty.crypto_standards} mono={false} />}
                    {a.sovereignty.audit_frequency && <KV k="Audit Frequency" v={a.sovereignty.audit_frequency} mono={false} />}
                  </div>
                  {a.sovereignty.framework_compliance && a.sovereignty.framework_compliance.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {a.sovereignty.framework_compliance.map((f) => (
                        <Pill key={f} tone="amber">{f}</Pill>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {a.endpointUrl && (
                <a href={a.endpointUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-brand-400 hover:text-brand-300 transition">
                  <ExternalLink size={11} /> {a.endpointUrl}
                </a>
              )}
            </div>

            {/* Right: MCP JSON Schema */}
            <div className="p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 flex items-center gap-1.5">
                <FileJson size={12} /> Unified REST Schema Specification (MCP)
              </div>
              {a.mcpSchema ? (
                <div className="relative">
                  <div className="absolute top-2 right-2 text-[8px] uppercase tracking-widest text-ink-600 bg-bg-900/80 px-2 py-0.5 rounded">JSON</div>
                  <pre className="text-[11px] font-mono text-ink-200 leading-relaxed bg-bg-900/80 border border-border/60 rounded-xl p-4 overflow-x-auto max-h-[520px] overflow-y-auto whitespace-pre-wrap selection:bg-brand-400/30">
                    {JSON.stringify(a.mcpSchema, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileJson size={32} className="text-ink-700 mb-3" />
                  <div className="text-[12px] text-ink-500">No MCP schema available.</div>
                  <div className="text-[11px] text-ink-600 mt-1">Use the Consensus Blueprint tab to compile one.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Staking Market Card — Premium
   ========================================================================= */

function MarketCard({ market }: { market: StakingMarket }) {
  return (
    <div className="rounded-xl border border-border/60 bg-bg-800/50 p-5 space-y-4 hover:border-border transition-all">
      <div className="text-[13px] font-semibold text-ink-100 leading-snug">{market.question}</div>

      {/* Price bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 rounded-full bg-white/[0.06] overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-accent-green/90 to-accent-green/60 rounded-l-full transition-all duration-500"
              style={{ width: `${market.yesPrice}%` }} />
            <div className="h-full bg-gradient-to-r from-accent-red/60 to-accent-red/90 rounded-r-full transition-all duration-500"
              style={{ width: `${market.noPrice}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-green/10 border border-accent-green/20">
              <ArrowUp size={11} className="text-accent-green" />
              <span className="text-[12px] font-bold text-accent-green tabular-nums">YES {market.yesPrice}c</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest text-ink-600">Volume</div>
            <div className="text-[12px] font-semibold text-ink-200 tabular-nums">{fmtUsd(market.volume)}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent-red/10 border border-accent-red/20">
              <ArrowDown size={11} className="text-accent-red" />
              <span className="text-[12px] font-bold text-accent-red tabular-nums">NO {market.noPrice}c</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-ink-600 border-t border-border/40 pt-2">
        <span>Pool: {fmtUsd(market.totalPool)}</span>
        <span>2.5% platform fee</span>
      </div>
    </div>
  );
}

/* =========================================================================
   Gemini Schema Compiler — Premium
   ========================================================================= */

function SchemaCompiler({ onCompiled }: { onCompiled: () => void }) {
  const [codeText, setCodeText] = useState("");
  const [apiName, setApiName] = useState("");
  const [category, setCategory] = useState("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompileResult | null>(null);
  const [error, setError] = useState("");

  const canCompile = codeText.trim().length > 10 && apiName.trim().length > 0;

  async function handleCompile() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await api<CompileResult>("/api/v1/benchmarks/compile", {
        method: "POST",
        body: { codeText, apiName, category },
      });
      setResult(res);
      onCompiled();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Compile failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Field label="Raw API Code / Documentation / Swagger Spec" hint="Paste any raw API documentation, code, Swagger/OpenAPI spec, or endpoint description.">
            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              rows={14}
              placeholder={"// Example: Paste your OpenAPI spec, cURL docs, or raw endpoint description here...\n\nPOST /api/v1/messages\nContent-Type: application/json\n\n{\n  \"to\": \"+15551234567\",\n  \"body\": \"Hello from the API\",\n  \"from\": \"+15559876543\"\n}"}
              className="input w-full font-mono text-[12px] leading-relaxed resize-y min-h-[240px] bg-bg-900/60"
            />
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="API Name">
            <input value={apiName} onChange={(e) => setApiName(e.target.value)}
              placeholder="e.g., Twilio SMS Gateway" className="input w-full" />
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="input w-full appearance-none cursor-pointer bg-bg-900/60">
              {["general", "payments", "banking", "healthcare", "government", "ai_inference", "energy", "messaging", "logistics", "identity"].map((c) => (
                <option key={c} value={c} className="bg-bg-800">{c.replace("_", " ").replace(/^\w/, (l) => l.toUpperCase())}</option>
              ))}
            </select>
          </Field>

          <div className="pt-2 space-y-3">
            <Button onClick={handleCompile} disabled={!canCompile || loading} loading={loading} className="w-full">
              <Sparkles size={14} />
              {loading ? "Compiling with Gemini 2.5 Flash..." : "Compile & Register Endpoint"}
            </Button>
            <div className="text-[10px] text-ink-600 text-center leading-relaxed">
              Gemini analyzes the input and produces a unified REST + MCP JSON tool schema, then registers it on the trust leaderboard.
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-xl border border-brand-400/20 bg-brand-400/5 p-6 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-400/20 flex items-center justify-center">
              <Sparkles size={18} className="text-brand-400 animate-spin" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-brand-300">Compiling with Gemini 2.5 Flash</div>
              <div className="text-[11px] text-ink-400 mt-0.5">Analyzing API surface, generating MCP schema, running synthetic verification...</div>
            </div>
          </div>
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-5 animate-fade-up">
          <SuccessBox message={`${result.apiName} compiled and registered on the trust leaderboard.`} />

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Comprehension", value: `${result.metrics.comprehension}%`, color: "text-accent-green" },
              { label: "Synth Latency", value: `${result.metrics.latency.toFixed(1)}ms`, color: "text-ink-100" },
              { label: "Drift Score", value: result.metrics.driftScore.toFixed(4), color: "text-brand-400" },
              { label: "Compile Time", value: `${result.metrics.compileTimeMs.toFixed(0)}ms`, color: "text-ink-100" },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-border/60 bg-bg-800/50 p-4">
                <div className="text-[9px] uppercase tracking-widest text-ink-600">{m.label}</div>
                <div className={clsx("text-[22px] font-black tabular-nums mt-1", m.color)}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Compiled Schema */}
          {result.mcpSchema && (
            <div className="rounded-xl border border-border/60 bg-bg-800/50 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 flex items-center gap-1.5">
                  <FileJson size={12} /> Compiled MCP Schema
                </div>
                <Pill tone="green">Registered</Pill>
              </div>
              <pre className="text-[11px] font-mono text-ink-200 leading-relaxed bg-bg-900/80 border border-border/60 rounded-xl p-4 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap selection:bg-brand-400/30">
                {JSON.stringify(result.mcpSchema, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Main Page
   ========================================================================= */

type Tab = "leaderboard" | "compiler" | "staking";

export default function BenchmarksPage() {
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [apis, setApis] = useState<BenchmarkAPI[]>([]);
  const [markets, setMarkets] = useState<StakingMarket[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [lb, mk] = await Promise.all([
        api<{ apis: BenchmarkAPI[] }>("/api/v1/benchmarks/leaderboard"),
        api<{ markets: StakingMarket[] }>("/api/v1/benchmarks/staking/markets"),
      ]);
      setApis(lb.apis);
      setMarkets(mk.markets);
      setError("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load benchmarks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return apis;
    const q = search.toLowerCase();
    return apis.filter(
      (a) => a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q) || (a.provider || "").toLowerCase().includes(q)
    );
  }, [apis, search]);

  const avgTrust = useMemo(() => {
    const scored = apis.filter((a) => a.vabp?.trustScore);
    return scored.length > 0 ? Math.round(scored.reduce((s, a) => s + a.vabp.trustScore, 0) / scored.length) : 0;
  }, [apis]);

  const TABS: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: "leaderboard", label: "Trust Leaderboard", icon: Trophy },
    { id: "compiler", label: "Consensus Blueprint", icon: Sparkles },
    { id: "staking", label: "Staking Pit", icon: BarChart3 },
  ];

  return (
    <Shell>
      {/* Grid backdrop */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
      {/* Radial glow at top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-20"
        style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)" }} />

      <div className="relative z-10 space-y-6">
        <ModuleHeader
          breadcrumb="API Benchmarks"
          title="Veklom API Benchmarking Protocol"
          subtitle="VABP-certified trust leaderboard with 3-pillar scoring (Security, Performance, Compliance), MCP schema inspection, Gemini-powered compilation, and SLA staking markets."
          pills={<>
            <Pill tone="green" dot>LIVE</Pill>
            <Pill tone="neutral">{apis.length} APIs Tracked</Pill>
            <Pill tone="amber">{markets.length} Active Markets</Pill>
            {avgTrust > 0 && <Pill tone="cyan">Avg Trust: {avgTrust}/1000</Pill>}
          </>}
        />

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border/60 pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-5 py-3 text-[12px] font-semibold tracking-wide border-b-2 transition-all -mb-[1px]",
                  active ? "text-brand-300 border-brand-400" : "text-ink-500 border-transparent hover:text-ink-200 hover:border-ink-700"
                )}>
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {error && <ErrorBox message={error} />}

        {/* ─── LEADERBOARD TAB ─── */}
        {tab === "leaderboard" && (
          <div className="space-y-5 animate-fade-up">
            {/* Search + stats */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-1 max-w-lg">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search APIs by name, category, or provider..."
                  className="input w-full pl-9 bg-bg-800/60" />
              </div>
            </div>

            {/* Summary hero stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: "APIs Tracked", value: String(apis.length), color: "text-ink-100" },
                { label: "Avg SLA", value: apis.length > 0 ? fmtPct(apis.reduce((s, a) => s + a.slaSuccess, 0) / apis.length) : "—", color: "text-accent-green" },
                { label: "Avg Trust Score", value: avgTrust > 0 ? `${avgTrust}/1000` : "—", color: trustScoreColor(avgTrust) },
                { label: "Total Staked", value: fmtUsd(apis.reduce((s, a) => s + a.totalStaked, 0)), color: "text-brand-400" },
                { label: "Tier-1 Certified", value: String(apis.filter((a) => a.sovereignTier === "Tier-1").length), color: "text-accent-green" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border/50 bg-bg-800/40 p-4 hover:bg-bg-800/60 transition-all">
                  <div className="text-[9px] uppercase tracking-widest text-ink-600">{s.label}</div>
                  <div className={clsx("text-[22px] font-black tabular-nums mt-1 tracking-tight", s.color)}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* API cards */}
            {loading ? (
              <div className="flex items-center justify-center py-20"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-border/50 bg-bg-800/40 p-12 text-center">
                <Search size={28} className="text-ink-700 mx-auto mb-3" />
                <div className="text-[13px] text-ink-400">No APIs match your search.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((a) => (
                  <APICard key={a.id} api={a} expanded={expandedId === a.id}
                    onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── COMPILER TAB ─── */}
        {tab === "compiler" && (
          <div className="animate-fade-up space-y-5">
            <div className="rounded-xl border border-border/60 bg-bg-800/40 p-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-400/15 flex items-center justify-center">
                    <Sparkles size={16} className="text-brand-400" />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-ink-100">Gemini Schema Synthesizer</div>
                    <div className="text-[11px] text-ink-500">Compile raw API specs into unified REST + MCP schemas via Gemini 2.5 Flash</div>
                  </div>
                </div>
                <p className="text-[12px] text-ink-400 leading-relaxed max-w-3xl mt-3">
                  Paste raw API documentation, code, or a Swagger spec below. The synthesizer compiles it into a
                  VABP-compliant MCP (Model Context Protocol) JSON tool schema and registers the API on the trust leaderboard
                  with synthetic performance metrics.
                </p>
              </div>
              <SchemaCompiler onCompiled={fetchData} />
            </div>
          </div>
        )}

        {/* ─── STAKING TAB ─── */}
        {tab === "staking" && (
          <div className="space-y-5 animate-fade-up">
            <div className="rounded-xl border border-border/60 bg-bg-800/40 p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-brand-400/15 flex items-center justify-center">
                  <BarChart3 size={16} className="text-brand-400" />
                </div>
                <div>
                  <div className="text-[15px] font-semibold text-ink-100">SLA Prediction Staking Pit</div>
                  <div className="text-[11px] text-ink-500">Polymarket-style prediction pools on API SLA outcomes. 2.5% platform fee on all stakes.</div>
                </div>
              </div>
              {markets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 size={32} className="text-ink-700 mb-3" />
                  <div className="text-[13px] text-ink-400">No active markets.</div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {markets.map((m) => (
                    <MarketCard key={m.id} market={m} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
