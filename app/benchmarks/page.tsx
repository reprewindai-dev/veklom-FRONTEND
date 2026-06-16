"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { api, getToken } from "@/lib/api";
import { Button, Spinner, ErrorBox, SuccessBox } from "@/components/ui";
import { ModuleHeader, SectionCard, Pill, KV, Field } from "@/components/telemetry";
import {
  Trophy, ChevronDown, ChevronUp, Shield, Zap, Activity, Globe, Server,
  Code2, Sparkles, ExternalLink, ArrowUpRight, Clock, TrendingUp, Lock,
  FileJson, BarChart3, Search,
} from "lucide-react";
import clsx from "clsx";

/* =========================================================================
   Types
   ========================================================================= */

interface BenchmarkAPI {
  id: string;
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
  metrics: {
    comprehension: number;
    latency: number;
    driftScore: number;
    compileTimeMs: number;
  };
  registeredOnLeaderboard: boolean;
}

/* =========================================================================
   Helpers
   ========================================================================= */

const CATEGORY_ICONS: Record<string, typeof Trophy> = {
  payments: Zap, banking: Shield, healthcare: Activity, government: Globe,
  ai_inference: Sparkles, energy: TrendingUp, general: Server,
};

function statusColor(s: string) {
  if (s === "excellent") return "text-accent-green";
  if (s === "nominal") return "text-brand-400";
  return "text-accent-red";
}

function tierTone(t: string): "green" | "amber" | "cyan" | "neutral" {
  if (t === "Tier-1") return "green";
  if (t === "Tier-2") return "amber";
  return "cyan";
}

function fmtMs(n: number) { return `${n.toFixed(1)}ms`; }
function fmtPct(n: number) { return `${n.toFixed(2)}%`; }
function fmtNum(n: number) { return n.toLocaleString(); }
function fmtUsd(n: number) { return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

/* =========================================================================
   Expandable API Card
   ========================================================================= */

function APICard({ api: a, expanded, onToggle }: { api: BenchmarkAPI; expanded: boolean; onToggle: () => void }) {
  const CatIcon = CATEGORY_ICONS[a.category] || Server;

  return (
    <div className="card overflow-hidden transition-all">
      {/* Card header — clickable */}
      <button onClick={onToggle} className="w-full text-left p-4 hover:bg-white/[0.02] transition group">
        <div className="flex items-center gap-3">
          {/* Icon + status dot */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center">
              <CatIcon size={18} className="text-ink-200" />
            </div>
            <span className={clsx(
              "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-bg-900",
              a.status === "excellent" ? "bg-accent-green" : a.status === "nominal" ? "bg-brand-400" : "bg-accent-red"
            )} />
          </div>

          {/* Name + provider */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-ink-50 truncate group-hover:text-brand-400 transition">{a.name}</h3>
              <Pill tone={tierTone(a.sovereignTier)}>{a.sovereignTier}</Pill>
            </div>
            <div className="text-[11px] text-ink-500 mt-0.5 truncate">{a.provider} &middot; {a.category.replace("_", " ")}</div>
          </div>

          {/* Metrics row */}
          <div className="hidden md:flex items-center gap-5 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-ink-600">SLA</div>
              <div className="text-sm font-semibold tabular-nums text-ink-100">{fmtPct(a.slaSuccess)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-ink-600">P50</div>
              <div className="text-sm font-semibold tabular-nums text-ink-100">{fmtMs(a.p50Latency)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-ink-600">Throughput</div>
              <div className="text-sm font-semibold tabular-nums text-ink-100">{fmtNum(a.throughput)}/s</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-ink-600">Staked</div>
              <div className="text-sm font-semibold tabular-nums text-brand-400">{fmtUsd(a.totalStaked)}</div>
            </div>
          </div>

          {/* Chevron */}
          <div className="shrink-0 text-ink-600 group-hover:text-ink-300 transition">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {/* Mobile metrics */}
        <div className="md:hidden grid grid-cols-4 gap-2 mt-3">
          <div><div className="text-[9px] uppercase text-ink-600">SLA</div><div className="text-xs font-semibold tabular-nums">{fmtPct(a.slaSuccess)}</div></div>
          <div><div className="text-[9px] uppercase text-ink-600">P50</div><div className="text-xs font-semibold tabular-nums">{fmtMs(a.p50Latency)}</div></div>
          <div><div className="text-[9px] uppercase text-ink-600">Tput</div><div className="text-xs font-semibold tabular-nums">{fmtNum(a.throughput)}/s</div></div>
          <div><div className="text-[9px] uppercase text-ink-600">Staked</div><div className="text-xs font-semibold tabular-nums text-brand-400">{fmtUsd(a.totalStaked)}</div></div>
        </div>
      </button>

      {/* Expandable drawer */}
      {expanded && (
        <div className="border-t border-border bg-bg-900/60 animate-fade-up">
          <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Left: Sovereignty & Audit */}
            <div className="p-5 space-y-4">
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 flex items-center gap-1.5">
                <Shield size={12} /> Sovereignty &amp; Audit Metrics
              </div>

              {a.description && (
                <p className="text-[12px] text-ink-300 leading-relaxed">{a.description}</p>
              )}

              <div className="space-y-0.5">
                <KV k="Status" v={<span className={statusColor(a.status)}>{a.status.toUpperCase()}</span>} />
                <KV k="Uptime (24h)" v={fmtPct(a.uptime24h)} />
                <KV k="P50 / P95 / P99" v={`${fmtMs(a.p50Latency)} / ${fmtMs(a.p95Latency)} / ${fmtMs(a.p99Latency)}`} />
                <KV k="Drift Index" v={a.driftIndex.toFixed(4)} />
                <KV k="Sovereign Tier" v={a.sovereignTier} />
              </div>

              {a.sovereignty && Object.keys(a.sovereignty).length > 0 && (
                <div className="space-y-0.5 pt-2 border-t border-border/50">
                  <div className="text-[10px] uppercase tracking-wider text-ink-600 mb-2 flex items-center gap-1.5">
                    <Lock size={11} /> Compliance &amp; Data Residency
                  </div>
                  {a.sovereignty.data_residency && <KV k="Data Residency" v={a.sovereignty.data_residency} mono={false} />}
                  {a.sovereignty.crypto_standards && <KV k="Crypto Standards" v={a.sovereignty.crypto_standards} mono={false} />}
                  {a.sovereignty.audit_frequency && <KV k="Audit Frequency" v={a.sovereignty.audit_frequency} mono={false} />}
                  {a.sovereignty.framework_compliance && a.sovereignty.framework_compliance.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] text-ink-500 mb-1.5">Framework Compliance</div>
                      <div className="flex flex-wrap gap-1">
                        {a.sovereignty.framework_compliance.map((f) => (
                          <Pill key={f} tone="amber">{f}</Pill>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {a.endpointUrl && (
                <a href={a.endpointUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-brand-400 hover:text-brand-300 transition mt-2">
                  <ExternalLink size={11} /> {a.endpointUrl}
                </a>
              )}
            </div>

            {/* Right: MCP JSON Schema */}
            <div className="p-5 space-y-3">
              <div className="text-[10px] uppercase tracking-[0.16em] text-ink-600 flex items-center gap-1.5">
                <FileJson size={12} /> Unified REST Schema Specification
              </div>
              {a.mcpSchema ? (
                <pre className="text-[11px] font-mono text-ink-200 leading-relaxed bg-bg-800/80 border border-border rounded-lg p-4 overflow-x-auto max-h-[440px] overflow-y-auto whitespace-pre-wrap">
                  {JSON.stringify(a.mcpSchema, null, 2)}
                </pre>
              ) : (
                <div className="text-[12px] text-ink-500 italic py-8 text-center">No MCP schema available for this API.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   Staking Market Card
   ========================================================================= */

function MarketCard({ market }: { market: StakingMarket }) {
  const yesWidth = `${market.yesPrice}%`;
  const noWidth = `${market.noPrice}%`;

  return (
    <div className="card p-4 space-y-3">
      <div className="text-[13px] font-medium text-ink-100 leading-snug">{market.question}</div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2.5 rounded-full bg-white/[0.06] overflow-hidden flex">
          <div className="h-full bg-accent-green/80 rounded-l-full transition-all" style={{ width: yesWidth }} />
          <div className="h-full bg-accent-red/60 rounded-r-full transition-all" style={{ width: noWidth }} />
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-accent-green font-semibold">YES {market.yesPrice}c</span>
        <span className="text-ink-500">Vol: {fmtUsd(market.volume)}</span>
        <span className="text-accent-red font-semibold">NO {market.noPrice}c</span>
      </div>
    </div>
  );
}

/* =========================================================================
   Gemini Schema Compiler
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
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Field label="Raw API Code / Documentation / Swagger Spec">
            <textarea
              value={codeText}
              onChange={(e) => setCodeText(e.target.value)}
              rows={12}
              placeholder="Paste your raw API documentation, code, Swagger/OpenAPI spec, or endpoint description here..."
              className="input w-full font-mono text-[12px] leading-relaxed resize-y min-h-[200px]"
            />
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="API Name">
            <input
              value={apiName}
              onChange={(e) => setApiName(e.target.value)}
              placeholder="e.g., Twilio SMS Gateway"
              className="input w-full"
            />
          </Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-full appearance-none cursor-pointer"
            >
              <option value="general">General</option>
              <option value="payments">Payments</option>
              <option value="banking">Banking</option>
              <option value="healthcare">Healthcare</option>
              <option value="government">Government</option>
              <option value="ai_inference">AI Inference</option>
              <option value="energy">Energy</option>
              <option value="messaging">Messaging</option>
              <option value="logistics">Logistics</option>
              <option value="identity">Identity</option>
            </select>
          </Field>

          <Button
            onClick={handleCompile}
            disabled={!canCompile || loading}
            loading={loading}
            className="w-full mt-2"
          >
            <Sparkles size={14} />
            {loading ? "Compiling with Gemini..." : "Compile & Register Endpoint"}
          </Button>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {result && (
        <div className="space-y-4 animate-fade-up">
          <SuccessBox message={`${result.apiName} compiled and registered on the leaderboard.`} />

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-3">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">Comprehension</div>
              <div className="text-lg font-semibold tabular-nums text-accent-green">{result.metrics.comprehension}%</div>
            </div>
            <div className="card p-3">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">Synth Latency</div>
              <div className="text-lg font-semibold tabular-nums text-ink-100">{result.metrics.latency.toFixed(1)}ms</div>
            </div>
            <div className="card p-3">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">Drift Score</div>
              <div className="text-lg font-semibold tabular-nums text-brand-400">{result.metrics.driftScore.toFixed(4)}</div>
            </div>
            <div className="card p-3">
              <div className="text-[9px] uppercase tracking-wider text-ink-600">Compile Time</div>
              <div className="text-lg font-semibold tabular-nums text-ink-100">{result.metrics.compileTimeMs.toFixed(0)}ms</div>
            </div>
          </div>

          {/* Compiled Schema */}
          {result.mcpSchema && (
            <SectionCard label="Compiled Output" title="Unified REST + MCP Schema">
              <pre className="text-[11px] font-mono text-ink-200 leading-relaxed bg-bg-800/80 border border-border rounded-lg p-4 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(result.mcpSchema, null, 2)}
              </pre>
            </SectionCard>
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

  // Poll every 8 seconds for live data
  useEffect(() => {
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return apis;
    const q = search.toLowerCase();
    return apis.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        (a.provider || "").toLowerCase().includes(q)
    );
  }, [apis, search]);

  const TABS: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: "leaderboard", label: "Trust Leaderboard", icon: Trophy },
    { id: "compiler", label: "Consensus Blueprint", icon: Sparkles },
    { id: "staking", label: "Staking Pit", icon: BarChart3 },
  ];

  return (
    <Shell>
      {/* Grid backdrop */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />

      <div className="relative z-10 space-y-6">
        <ModuleHeader
          breadcrumb="API Benchmarks"
          title="API Benchmarks & Trust Rankings"
          subtitle="Sovereign API trust leaderboard with MCP schema inspection, Gemini-powered schema compilation, and SLA prediction staking."
          pills={<>
            <Pill tone="green" dot>LIVE</Pill>
            <Pill tone="neutral">{apis.length} APIs Tracked</Pill>
            <Pill tone="amber">{markets.length} Active Markets</Pill>
          </>}
        />

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-border pb-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-semibold tracking-wide border-b-2 transition-all -mb-[1px]",
                  active
                    ? "text-brand-400 border-brand-400"
                    : "text-ink-500 border-transparent hover:text-ink-200 hover:border-ink-600"
                )}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
        </div>

        {error && <ErrorBox message={error} />}

        {/* Leaderboard tab */}
        {tab === "leaderboard" && (
          <div className="space-y-4 animate-fade-up">
            {/* Search */}
            <div className="relative max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search APIs by name, category, or provider..."
                className="input w-full pl-9"
              />
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card p-3">
                <div className="text-[9px] uppercase tracking-wider text-ink-600">Total APIs</div>
                <div className="text-xl font-semibold tabular-nums text-ink-100">{apis.length}</div>
              </div>
              <div className="card p-3">
                <div className="text-[9px] uppercase tracking-wider text-ink-600">Avg SLA</div>
                <div className="text-xl font-semibold tabular-nums text-accent-green">
                  {apis.length > 0 ? fmtPct(apis.reduce((s, a) => s + a.slaSuccess, 0) / apis.length) : "—"}
                </div>
              </div>
              <div className="card p-3">
                <div className="text-[9px] uppercase tracking-wider text-ink-600">Total Staked</div>
                <div className="text-xl font-semibold tabular-nums text-brand-400">
                  {fmtUsd(apis.reduce((s, a) => s + a.totalStaked, 0))}
                </div>
              </div>
              <div className="card p-3">
                <div className="text-[9px] uppercase tracking-wider text-ink-600">Tier-1 APIs</div>
                <div className="text-xl font-semibold tabular-nums text-ink-100">
                  {apis.filter((a) => a.sovereignTier === "Tier-1").length}
                </div>
              </div>
            </div>

            {/* API cards */}
            {loading ? (
              <div className="flex items-center justify-center py-16"><Spinner /></div>
            ) : filtered.length === 0 ? (
              <div className="card p-8 text-center text-ink-400">No APIs match your search.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((a) => (
                  <APICard
                    key={a.id}
                    api={a}
                    expanded={expandedId === a.id}
                    onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compiler tab */}
        {tab === "compiler" && (
          <div className="animate-fade-up">
            <SectionCard
              label="Gemini Schema Synthesizer"
              title="Compile & Register API Endpoint"
              className="bg-bg-800/40"
            >
              <p className="text-[12px] text-ink-400 mb-5 max-w-2xl">
                Paste raw API documentation, code, or a Swagger spec below. Gemini 2.5 Flash will compile it into a
                unified REST + MCP (Model Context Protocol) JSON tool schema and register the API on the trust leaderboard.
              </p>
              <SchemaCompiler onCompiled={fetchData} />
            </SectionCard>
          </div>
        )}

        {/* Staking tab */}
        {tab === "staking" && (
          <div className="space-y-4 animate-fade-up">
            <SectionCard
              label="SLA Prediction Markets"
              title="Staking Pit"
            >
              <p className="text-[12px] text-ink-400 mb-4">
                Polymarket-style prediction pools on API SLA outcomes. Stake on whether APIs will maintain their performance targets.
                2.5% platform fee on all stakes.
              </p>
              {markets.length === 0 ? (
                <div className="text-center text-ink-500 py-8">No active markets.</div>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {markets.map((m) => (
                    <MarketCard key={m.id} market={m} />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </Shell>
  );
}
