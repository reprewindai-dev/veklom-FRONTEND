"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Button } from "@/components/ui";
import { KV, ModuleHeader, Pill, SectionCard } from "@/components/telemetry";
import { API_BASE } from "@/lib/api";
import {
  GitBranch, ShieldCheck, Package, Store, Download, Server,
  Terminal, FileCheck2, ChevronRight, ExternalLink,
} from "lucide-react";

/**
 * Ship a governed asset — the one canonical operator flow.
 * Spine: Connected Source -> Repo Risk Gate -> Asset Wrapper (GPC) ->
 * Marketplace Asset -> Workspace Install -> Deployment -> Terminal Runtime -> Evidence Ledger.
 * Each stage: one primary action + inline proof. Status is honest (Verified / Active / Not started / Needs proof).
 */

type Tone = "green" | "amber" | "red" | "cyan" | "violet" | "neutral";

interface StageDef {
  id: string;
  label: string;
  blurb: string;
  icon: any;
  endpoint?: string;
  cta: string;
  ctaHref?: string;
  ctaExternal?: string; // absolute backend URL (e.g. github oauth)
  countKey?: string; // key in response that holds a list/number for "verified"
}

const STAGES: StageDef[] = [
  { id: "source", label: "Connected Source", blurb: "Connect a GitHub repository as the governed source of an asset.", icon: GitBranch, endpoint: "/api/v1/auth/github/status", cta: "Connect GitHub", ctaExternal: "/api/v1/auth/github/login" },
  { id: "risk", label: "Repo Risk Gate", blurb: "Review and risk-decision the source before it becomes trusted.", icon: ShieldCheck, endpoint: "/api/v1/repo-risk-gate/runs", cta: "Open Risk Gate", ctaHref: "/deployments", countKey: "runs" },
  { id: "wrapper", label: "Asset Wrapper (GPC)", blurb: "Compile intent into a deterministic, policy-checked governed plan.", icon: Package, endpoint: "/api/v1/gpc/stats", cta: "Open Plan Compiler", ctaHref: "/gpc", countKey: "plans_total" },
  { id: "listing", label: "Marketplace Asset", blurb: "Publish the wrapped asset so it becomes visible and installable.", icon: Store, endpoint: "/api/v1/marketplace/listings", cta: "Open Marketplace", ctaHref: "/marketplace" },
  { id: "install", label: "Workspace Install", blurb: "Install the approved asset into this workspace.", icon: Download, endpoint: "/api/v1/marketplace/installed", cta: "View installed", ctaHref: "/marketplace" },
  { id: "deploy", label: "Deployment", blurb: "Deploy a workspace-specific governed running instance.", icon: Server, endpoint: "/api/v1/deployments", cta: "Open Deployments", ctaHref: "/deployments" },
  { id: "runtime", label: "Terminal Runtime", blurb: "Execute the deployed asset inside the governed runtime.", icon: Terminal, cta: "Open Playground", ctaHref: "/playground" },
  { id: "evidence", label: "Evidence Ledger", blurb: "Prove what happened — tamper-evident audit and evidence.", icon: FileCheck2, endpoint: "/api/v1/audit/logs", cta: "Open Audit", ctaHref: "/audit" },
];

function countOf(data: any, countKey?: string): number | null {
  if (data == null) return null;
  if (Array.isArray(data)) return data.length;
  if (countKey && data[countKey] != null) {
    const v = data[countKey];
    return Array.isArray(v) ? v.length : Number(v) || 0;
  }
  if (Array.isArray(data.items)) return data.items.length;
  if (Array.isArray(data.results)) return data.results.length;
  if (typeof data.connected === "boolean") return data.connected ? 1 : 0;
  return null;
}

function StageData({ stage, onStatus }: { stage: StageDef; onStatus: (id: string, tone: Tone, label: string) => void }) {
  const q = useApi<any>(stage.endpoint || "");
  // Derive an honest status.
  let tone: Tone = "neutral";
  let label = "Manual step";
  if (stage.endpoint) {
    if (q.isLoading) { tone = "neutral"; label = "Checking…"; }
    else if (q.error) { tone = "amber"; label = "Needs proof"; }
    else {
      const c = countOf(q.data, stage.countKey);
      if (c == null) { tone = "cyan"; label = "Present"; }
      else if (c > 0) { tone = "green"; label = `Verified · ${c}`; }
      else { tone = "neutral"; label = "Not started"; }
    }
  }
  useEffect(() => { onStatus(stage.id, tone, label); }, [stage.id, tone, label]);

  return (
    <div className="space-y-1.5">
      {stage.endpoint && <KV k="Source" v={stage.endpoint} />}
      {q.isLoading && <div className="text-[12px] text-ink-500">Loading live data…</div>}
      {q.error && <div className="text-[12px] text-amber-400">No data yet — this stage is wired but unproven. ({String(q.error).slice(0, 80)})</div>}
      {!q.isLoading && !q.error && q.data != null && (
        <pre className="text-[11px] text-ink-400 bg-bg-900 border border-border rounded-lg p-2.5 overflow-auto max-h-48 whitespace-pre-wrap break-all">
          {JSON.stringify(q.data, null, 2).slice(0, 1400)}
        </pre>
      )}
      {!stage.endpoint && (
        <div className="text-[12px] text-ink-500">This stage is a manual runtime action — use the button to open it.</div>
      )}
    </div>
  );
}

export default function ShipAssetPage() {
  const [active, setActive] = useState(0);
  const [statuses, setStatuses] = useState<Record<string, { tone: Tone; label: string }>>({});

  function reportStatus(id: string, tone: Tone, label: string) {
    setStatuses((prev) => {
      if (prev[id]?.tone === tone && prev[id]?.label === label) return prev;
      return { ...prev, [id]: { tone, label } };
    });
  }

  const stage = STAGES[active];

  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Operate · Ship a governed asset"
        title="Ship a governed asset"
        subtitle="One flow, start to proof: source → risk gate → wrap → list → install → deploy → run → evidence."
        pills={
          <>
            {STAGES.map((s) => {
              const st = statuses[s.id];
              return (
                <Pill key={s.id} tone={(st?.tone as any) || "neutral"}>
                  {s.label.split(" ")[0]} {st?.tone === "green" ? "✓" : "○"}
                </Pill>
              );
            })}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4">
        {/* Stage rail */}
        <div className="space-y-1">
          {STAGES.map((s, i) => {
            const st = statuses[s.id];
            const Icon = s.icon;
            const isActive = i === active;
            return (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all ${
                  isActive ? "border-brand-500/60 bg-brand-500/[0.12]" : "border-border hover:border-border-strong hover:bg-white/[0.03]"
                }`}
              >
                <div className={`w-7 h-7 rounded-full grid place-items-center text-[11px] font-bold shrink-0 border ${
                  isActive ? "border-brand-500/50 bg-brand-500/15 text-brand-400" : "border-border text-ink-400"
                }`}>
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} className={isActive ? "text-brand-400" : "text-ink-500"} />
                    <span className={`text-[12.5px] truncate ${isActive ? "text-ink-50" : "text-ink-200"}`}>{s.label}</span>
                  </div>
                  <div className="mt-0.5">
                    <Pill tone={(st?.tone as any) || "neutral"}>{st?.label || "—"}</Pill>
                  </div>
                </div>
                {isActive && <ChevronRight size={14} className="text-brand-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Canvas */}
        <div className="space-y-4">
          <SectionCard
            label={`Stage ${active + 1} · ${stage.label}`}
            title={stage.label}
            actions={
              stage.ctaExternal ? (
                <a href={`${API_BASE}${stage.ctaExternal}`}>
                  <Button><ExternalLink size={14} /> {stage.cta}</Button>
                </a>
              ) : stage.ctaHref ? (
                <Link href={stage.ctaHref}>
                  <Button><ChevronRight size={14} /> {stage.cta}</Button>
                </Link>
              ) : null
            }
          >
            <p className="text-[12.5px] text-ink-400 mb-3">{stage.blurb}</p>
            <StageData stage={stage} onStatus={reportStatus} />
          </SectionCard>

          <SectionCard label="Proof" title="What this stage proves">
            <p className="text-[12px] text-ink-500">
              Every governed step writes to the evidence ledger. Use <span className="text-ink-300">Evidence Ledger</span> (stage 8)
              to export the full proof chain for this asset. Status above is live from the backend — green means verified data exists,
              amber means the route is wired but has no proof yet.
            </p>
          </SectionCard>
        </div>
      </div>
    </Shell>
  );
}
