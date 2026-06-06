"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Table } from "@/components/ui";
import { ModuleHeader, SectionCard, StatTile, Pill, ProgressBar, BarChart, KV, fmtNum, fmtUsd, ACCENT } from "@/components/telemetry";
import { Activity, Coins, Cpu, Timer } from "lucide-react";

export default function UsagePage() {
  const usage = useApi<any>("/api/v1/billing/usage");
  const breakdown = useApi<any>("/api/v1/billing/breakdown");
  const insights = useApi<any>("/api/v1/insights/summary");
  const history = useApi<any>("/api/v1/cost/history");

  const us = usage.data || {};
  const ins = insights.data || {};
  const items: any[] = breakdown.data?.items || [];
  const totalCalls = items.reduce((a, r) => a + (r.count || 0), 0) || 1;
  const split: Record<string, number> = ins.provider_split || {};
  const costPoints: any[] = (Array.isArray(history.data) ? history.data : history.data?.history || []).map((r: any) => ({
    label: (r.date || r.day || "").slice(5),
    cost: r.cost ?? r.spend ?? r.total ?? 0,
  }));

  return (
    <Shell>
      <TierGate required="pro" feature="Usage Analytics">
        <ModuleHeader
          breadcrumb="Operations · Usage Analytics"
          title="Usage & throughput"
          subtitle="Endpoint-level usage, cost, and trends from live execution logs across the workspace."
          pills={
            <>
              <Pill tone="neutral">{us.period || ""}</Pill>
              <Pill tone="amber">{fmtNum(ins.total_requests_today ?? 0)} today</Pill>
            </>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatTile label="Requests (MTD)" icon={<Activity size={14} />} value={fmtNum(us.total_requests ?? 0)} />
          <StatTile label="Tokens (MTD)" icon={<Cpu size={14} />} value={fmtNum(us.total_tokens ?? 0)} />
          <StatTile label="Spend (MTD)" icon={<Coins size={14} />} value={fmtUsd(us.total_spend_usd ?? 0)} />
          <StatTile label="Avg latency" icon={<Timer size={14} />} value={`${ins.avg_latency_ms ?? "—"}ms`} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <SectionCard label="Trend" title="Daily spend" className="lg:col-span-2">
            {history.isLoading ? <Skeleton className="h-44" /> : costPoints.length
              ? <BarChart points={costPoints} valueKey="cost" labelKey="label" color={ACCENT.cyan} height={180} />
              : <div className="text-center text-ink-500 py-12 text-[13px]">No cost history yet.</div>}
          </SectionCard>
          <SectionCard label="Routing" title="Provider split">
            {Object.keys(split).length === 0 ? <div className="text-ink-500 text-[13px]">No data.</div> : (
              <div className="space-y-3">
                {Object.entries(split).sort((a, b) => b[1] - a[1]).map(([p, v]) => (
                  <div key={p}>
                    <div className="flex justify-between text-[12px] mb-1"><span className="capitalize text-ink-200">{p}</span><span className="font-mono">{(v * 100).toFixed(1)}%</span></div>
                    <ProgressBar percent={v * 100} color={p === "ollama" ? ACCENT.green : ACCENT.amber} />
                  </div>
                ))}
                <div className="card p-3 mt-2">
                  <KV k="Avg tokens / req" v={fmtNum(ins.avg_tokens_per_request ?? 0)} />
                  <KV k="Peak hour reqs" v={fmtNum(ins.peak_hour_requests ?? 0)} />
                  <KV k="Error rate" v={`${ins.error_rate_percent ?? 0}%`} />
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard label="By provider" title="Usage breakdown" bodyClassName="p-0">
          {breakdown.isLoading ? <div className="p-5"><Skeleton className="h-32 w-full" /></div> :
            <Table
              rows={items}
              rowKey={(r) => r.event}
              empty="No usage recorded this period yet."
              columns={[
                { key: "event", header: "Provider", render: (r) => <span className="font-mono text-xs">{r.event}</span> },
                { key: "calls", header: "Calls", render: (r) => fmtNum(r.count) },
                { key: "share", header: "Share", render: (r) => <div className="w-28"><ProgressBar percent={(r.count / totalCalls) * 100} /></div> },
                { key: "unit", header: "Avg/call", render: (r) => fmtUsd(r.unit_cost ?? 0, 5) },
                { key: "total", header: "Total", render: (r) => fmtUsd(r.total ?? 0) },
              ]}
            />
          }
        </SectionCard>
      </TierGate>
    </Shell>
  );
}
