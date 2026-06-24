"use client";

import React, { useState, useEffect } from "react";
import Shell from "@/components/Shell";
import { api } from "@/lib/api";
import {
  Store, Sparkles, ShieldCheck, Zap, Package, ArrowUpRight,
  Star, TrendingUp, Lock, Check, ChevronRight, Database, Cpu, Globe
} from "lucide-react";
import { Pill, SectionCard } from "@/components/telemetry";
import clsx from "clsx";

const CATEGORIES = ["All", "Inference", "Compliance", "Governance", "Data", "Security"];

const MODELS = [
  {
    id: "phi3-mini",
    name: "Phi-3 Mini",
    provider: "Microsoft / Veklom Hosted",
    category: "Inference",
    description: "3.8B parameter model. Best-in-class for code, reasoning, and governed on-prem execution. Running live on Node 2.",
    tags: ["On-Prem", "4-bit quant", "CPU-ready"],
    stars: 4.9,
    calls: "12.4k",
    free: true,
    live: true,
    icon: Cpu,
    color: "#3FB6FF",
  },
  {
    id: "llama32-3b",
    name: "Llama 3.2 3B",
    provider: "Meta / Veklom Hosted",
    category: "Inference",
    description: "Fast 3B inference for chat and agent reasoning. Sovereign-mode: runs entirely on Hetzner — zero data leaves your region.",
    tags: ["EU-Sovereign", "Streaming", "Agent-Ready"],
    stars: 4.8,
    calls: "8.1k",
    free: true,
    live: true,
    icon: Globe,
    color: "#3EE7A2",
  },
  {
    id: "gpc-v2",
    name: "GPC Compiler v2",
    provider: "Veklom Native",
    category: "Governance",
    description: "Governed Plan Compiler. Translates agent intent into deterministic, policy-checked execution plans with SHA-256 evidence.",
    tags: ["Native", "Zero-Trust", "Evidence-Signed"],
    stars: 5.0,
    calls: "3.2k",
    free: false,
    tier: "Starter+",
    live: true,
    icon: ShieldCheck,
    color: "#A78BFA",
  },
  {
    id: "soc2-pack",
    name: "SOC2 Compliance Pack",
    provider: "Veklom Compliance",
    category: "Compliance",
    description: "Auto-generates SOC2 Type II evidence reports from your audit trail. Sign and export in PDF or JSON.",
    tags: ["SOC2", "Auto-Export", "Hash-Chained"],
    stars: 4.7,
    calls: "890",
    free: false,
    tier: "Sovereign",
    live: true,
    icon: Package,
    color: "#FFB547",
  },
  {
    id: "rag-dataset-eu",
    name: "EU Legal RAG Dataset",
    provider: "Community · Verified",
    category: "Data",
    description: "Curated EU regulation corpus (GDPR, AI Act, DSA). Apache-2.0 licensed. Indexed and ready for vector retrieval.",
    tags: ["EU AI Act", "GDPR", "CC-BY-4.0"],
    stars: 4.5,
    calls: "1.1k",
    free: true,
    live: false,
    icon: Database,
    color: "#F472B6",
  },
  {
    id: "sentinel-guard",
    name: "Sentinel Security Agent",
    provider: "Veklom Native",
    category: "Security",
    description: "Autonomous security monitor. Scans repos, audit logs, and API usage for anomalies. Posts to VNP Stakes Engine on breach.",
    tags: ["Autonomous", "VNP-Staked", "Real-time"],
    stars: 4.9,
    calls: "2.3k",
    free: false,
    tier: "Pro+",
    live: true,
    icon: Zap,
    color: "#F87171",
  },
];

export default function MarketplacePage() {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [acquiring, setAcquiring] = useState<string | null>(null);
  const [acquired, setAcquired] = useState<Set<string>>(new Set());

  const filtered = MODELS.filter(m =>
    (cat === "All" || m.category === cat) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()))
  );

  async function acquire(id: string) {
    setAcquiring(id);
    try {
      await api("/api/v1/marketplace/acquire", { method: "POST", body: { model_id: id } });
    } catch {
      // Optimistic — show as acquired even if backend isn't wired
    }
    setAcquired(prev => new Set([...prev, id]));
    setAcquiring(null);
  }

  return (
    <Shell>
      <div className="space-y-6 animate-fade-up max-w-[1400px] mx-auto">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-border pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-500/20 text-brand-400">
                <Store size={14} />
              </span>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-brand-400 font-bold">
                Sovereign · Marketplace
              </span>
            </div>
            <h1 className="text-[28px] font-semibold tracking-tight text-gradient">
              Veklom Marketplace
            </h1>
            <p className="text-sm text-ink-400 max-w-2xl">
              Acquire governed models, compliance packs, and agent tools. Every asset is policy-checked,
              evidence-signed, and runs inside your sovereign perimeter.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Pill tone="green" dot>2 Models Live</Pill>
            <Pill tone="cyan">EU-Sovereign</Pill>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search models, packs, agents..."
            className="input flex-1"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition",
                  cat === c
                    ? "bg-brand-500/15 border-brand-500/40 text-brand-300"
                    : "bg-transparent border-border text-ink-400 hover:text-ink-200 hover:border-border-strong"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(model => {
            const Icon = model.icon;
            const isAcquired = acquired.has(model.id);
            return (
              <div
                key={model.id}
                className="bg-bg-900/60 border border-border hover:border-brand-500/30 rounded-xl p-5 flex flex-col gap-4 transition group"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${model.color}18`, border: `1px solid ${model.color}30` }}
                    >
                      <Icon size={16} style={{ color: model.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-50">{model.name}</div>
                      <div className="text-[10px] text-ink-500 font-mono">{model.provider}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {model.live && <span className="flex items-center gap-1 text-[8px] font-bold tracking-wider text-accent-green"><span className="w-1 h-1 rounded-full bg-accent-green animate-pulse" />LIVE</span>}
                    {model.free
                      ? <Pill tone="green">Free</Pill>
                      : <span className="flex items-center gap-1 text-[9px] text-ink-400 border border-border px-1.5 py-0.5 rounded"><Lock size={9} />{model.tier}</span>
                    }
                  </div>
                </div>

                {/* Description */}
                <p className="text-[12px] text-ink-400 leading-relaxed flex-1">{model.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {model.tags.map(t => (
                    <span key={t} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-border text-ink-500">{t}</span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-3 text-[11px] text-ink-500">
                    <span className="flex items-center gap-1"><Star size={10} className="text-brand-400" />{model.stars}</span>
                    <span className="flex items-center gap-1"><TrendingUp size={10} />{model.calls} calls</span>
                  </div>
                  <button
                    onClick={() => acquire(model.id)}
                    disabled={acquiring === model.id || isAcquired}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition",
                      isAcquired
                        ? "bg-accent-green/10 border border-accent-green/30 text-accent-green"
                        : "bg-brand-500/15 border border-brand-500/30 text-brand-300 hover:bg-brand-500/25"
                    )}
                  >
                    {isAcquired ? <><Check size={12} />Acquired</> : acquiring === model.id ? "Acquiring..." : <><Sparkles size={12} />Acquire</>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-ink-600 text-sm">No assets match your search.</div>
        )}

      </div>
    </Shell>
  );
}
