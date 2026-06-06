"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Table, Button } from "@/components/ui";
import { unwrapList } from "@/types/api";
import { api } from "@/lib/api";
import { ModuleHeader, SectionCard, Pill, StatTile, ProgressBar, fmtUsd, fmtNum, ACCENT } from "@/components/telemetry";
import { Receipt, ExternalLink, Wallet, TrendingUp } from "lucide-react";

const COST_KEYS = [
  { k: "inference_usd", label: "Inference", color: ACCENT.violet },
  { k: "embedding_usd", label: "Embeddings", color: ACCENT.cyan },
  { k: "gpu_burst_usd", label: "GPU burst", color: ACCENT.amber },
  { k: "storage_usd", label: "Storage", color: ACCENT.green },
];

export default function BillingPage() {
  const invoices = useApi<any>("/api/v1/billing/invoices");
  const breakdown = useApi<any>("/api/v1/billing/breakdown");
  const usage = useApi<any>("/api/v1/billing/usage");
  const sub = useApi<any>("/api/v1/subscriptions/current");
  const wallet = useApi<any>("/api/v1/wallet/balance");

  const us = usage.data || {};
  const spend = us.total_spend_usd ?? 0;
  const cap = us.budget_cap_usd ?? 0;
  const pct = cap ? (spend / cap) * 100 : 0;
  const items: any[] = breakdown.data?.items || [];

  async function portal() {
    const res = await api<any>("/api/v1/subscriptions/portal", { method: "POST" });
    const url = res?.url || res?.portal_url;
    if (url) window.location.href = url;
  }

  return (
    <Shell>
      <TierGate required="starter" feature="Billing">
        <ModuleHeader
          breadcrumb="Operations · Billing"
          title="Billing & spend"
          subtitle="Month-to-date spend, cost breakdown, invoices, and Stripe portal access — all from live execution logs."
          pills={
            <>
              <Pill tone="amber">{sub.data?.plan_name || sub.data?.plan || "—"} plan</Pill>
              <Pill tone={us.on_pace ? "green" : "red"} dot>{us.on_pace ? "On pace" : "Over pace"}</Pill>
              <Pill tone="neutral">{us.period || ""}</Pill>
            </>
          }
          actions={<Button onClick={portal}><ExternalLink size={14} /> Billing portal</Button>}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatTile label="Spend (MTD)" icon={<Receipt size={14} />} value={fmtUsd(spend)} />
          <StatTile label="Budget cap" icon={<TrendingUp size={14} />} value={fmtUsd(cap)} />
          <StatTile label="Requests (MTD)" value={fmtNum(us.total_requests ?? 0)} />
          <StatTile label="Wallet balance" icon={<Wallet size={14} />} value={fmtUsd(wallet.data?.balance ?? wallet.data?.balance_usd ?? 0)} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4 mb-4">
          <SectionCard label="Budget" title="Cap utilization" className="lg:col-span-1">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[22px] font-semibold">{fmtUsd(spend)}</span>
              <span className="text-[12px] text-ink-500">of {fmtUsd(cap)}</span>
            </div>
            <ProgressBar percent={pct} color={pct > 90 ? ACCENT.red : pct > 70 ? ACCENT.amber : ACCENT.green} />
            <div className="text-[11px] text-ink-600 mt-2">{pct.toFixed(1)}% used · run rate {fmtUsd(us.run_rate_usd_per_min ?? 0, 6)}/min</div>
            <div className="mt-3 space-y-1.5">
              {COST_KEYS.map((c) => (
                <div key={c.k} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-[12px] text-ink-400 flex-1">{c.label}</span>
                  <span className="text-[12px] font-mono">{fmtUsd(us[c.k] ?? 0)}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard label="By provider" title="Cost breakdown" className="lg:col-span-2" bodyClassName="p-0">
            {breakdown.isLoading ? <div className="p-5"><Skeleton className="h-32" /></div> : (
              <Table
                rows={items}
                rowKey={(r) => r.event}
                empty="No usage recorded this period yet."
                columns={[
                  { key: "event", header: "Provider", render: (r) => <span className="font-mono text-xs">{r.event}</span> },
                  { key: "count", header: "Calls", render: (r) => fmtNum(r.count) },
                  { key: "unit", header: "Avg/call", render: (r) => fmtUsd(r.unit_cost ?? 0, 5) },
                  { key: "total", header: "Total", render: (r) => fmtUsd(r.total ?? 0) },
                ]}
              />
            )}
          </SectionCard>
        </div>

        <SectionCard label="History" title="Invoices" bodyClassName="p-0">
          {invoices.isLoading ? <div className="p-5"><Skeleton className="h-24 w-full" /></div> :
            <Table
              rows={unwrapList<any>(invoices.data)}
              rowKey={(r) => r.id || r.invoice_id}
              empty="No invoices yet."
              columns={[
                { key: "id", header: "Invoice", render: (r) => <span className="font-mono text-xs">{r.id || r.invoice_id}</span> },
                { key: "desc", header: "Description", render: (r) => r.description || "—" },
                { key: "date", header: "Date", render: (r) => (r.created_at || r.date || "").slice(0, 10) },
                { key: "amount", header: "Amount", render: (r) => fmtUsd(r.amount ?? r.total ?? 0) },
                { key: "status", header: "Status", render: (r) => <Pill tone={r.status === "paid" ? "green" : "neutral"}>{r.status}</Pill> },
                { key: "pdf", header: "", render: (r) => (r.invoice_pdf || r.hosted_invoice_url || r.pdf_url) ? <a className="text-brand-400 hover:underline text-xs" href={r.invoice_pdf || r.hosted_invoice_url || r.pdf_url} target="_blank" rel="noreferrer">PDF</a> : null, width: "70px" },
              ]}
            />
          }
        </SectionCard>
      </TierGate>
    </Shell>
  );
}
