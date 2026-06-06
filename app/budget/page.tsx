"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Skeleton, Button, ErrorBox, SuccessBox } from "@/components/ui";
import { api } from "@/lib/api";
import { useState } from "react";
import { ModuleHeader, SectionCard, StatTile, Pill, ProgressBar, Field, Select, KV, fmtUsd, ACCENT } from "@/components/telemetry";
import { Gauge, Save, CalendarClock } from "lucide-react";

const ALERT_TONE: Record<string, string> = { ok: "green", warning: "amber", critical: "red", exhausted: "red" };

export default function BudgetPage() {
  const budget = useApi<any>("/api/v1/budget");
  const forecast = useApi<any>("/api/v1/budget/forecast");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("monthly");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [ok, setOk] = useState<string>();

  const b = budget.data || {};
  const f = forecast.data || {};
  const used = Number(b.percent_used ?? (f.budget_limit ? (f.current_spend / f.budget_limit) * 100 : 0)) || 0;
  const projOver = f.projected_spend != null && f.budget_limit != null && f.projected_spend > f.budget_limit;

  async function save() {
    if (!amount.trim()) { setErr("Enter a budget amount."); return; }
    setBusy(true); setErr(undefined); setOk(undefined);
    try {
      await api("/api/v1/budget", { method: "POST", body: { budget_type: period, amount: String(amount) } });
      setOk(`Budget set: ${fmtUsd(Number(amount))} per ${period.replace("ly", "")}.`);
      setAmount("");
      budget.mutate(); forecast.mutate();
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Shell>
      <TierGate required="pro" feature="Budget Caps">
        <ModuleHeader
          breadcrumb="Governance · Budget Caps"
          title="Budget caps & forecast"
          subtitle="Spend limits enforced by the x402 middleware. When the cap is breached the kill-switch auto-engages."
          pills={
            <Pill tone={(ALERT_TONE[b.alert_level] as any) || "neutral"} dot>{(b.alert_level || "ok").toUpperCase()}</Pill>
          }
        />

        {err && <div className="mb-4"><ErrorBox message={err} /></div>}
        {ok && <div className="mb-4"><SuccessBox message={ok} /></div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatTile label="Budget" icon={<Gauge size={14} />} value={fmtUsd(Number(b.amount ?? f.budget_limit ?? 0))} />
          <StatTile label="Spent (MTD)" value={fmtUsd(Number(b.current_spend ?? f.current_spend ?? 0))} />
          <StatTile label="Remaining" value={fmtUsd(Number(b.remaining ?? (f.budget_limit != null ? f.budget_limit - (f.current_spend ?? 0) : 0)))} />
          <StatTile label="Days left" icon={<CalendarClock size={14} />} value={f.days_remaining ?? "—"} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <SectionCard label="Utilization" title="Cap usage" className="lg:col-span-2">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[24px] font-semibold">{fmtUsd(Number(b.current_spend ?? f.current_spend ?? 0))}</span>
              <span className="text-[12px] text-ink-500">of {fmtUsd(Number(b.amount ?? f.budget_limit ?? 0))}</span>
            </div>
            <ProgressBar percent={used} color={used > 90 ? ACCENT.red : used > 70 ? ACCENT.amber : ACCENT.green} />
            <div className="text-[11px] text-ink-600 mt-2">{used.toFixed(1)}% used</div>
            <div className="card p-3 mt-4">
              <KV k="Projected (full period)" v={<span className={projOver ? "text-accent-red" : "text-accent-green"}>{fmtUsd(f.projected_spend ?? 0)}</span>} mono={false} />
              <KV k="Budget limit" v={fmtUsd(f.budget_limit ?? 0)} />
              <KV k="Forecast exhaustion" v={(b.forecast_exhaustion_date || "").slice(0, 10) || "—"} mono={false} />
            </div>
            {projOver && (
              <div className="flex items-start gap-2 mt-3 text-[12px] text-accent-red">
                <Gauge size={14} className="mt-0.5 shrink-0" />
                Projected spend exceeds the cap — the kill-switch will engage when the limit is hit.
              </div>
            )}
          </SectionCard>

          <SectionCard label="Configure" title="Set budget cap">
            <div className="space-y-3">
              <Field label="Period">
                <Select value={period} onChange={setPeriod} options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                  { value: "monthly", label: "Monthly" },
                ]} />
              </Field>
              <Field label="Amount (USD)" hint="Hard cap enforced per call by x402.">
                <input className="input" type="number" min="0" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500" />
              </Field>
              <Button onClick={save} loading={busy} className="w-full"><Save size={14} /> Save budget</Button>
            </div>
            {budget.isLoading && <Skeleton className="h-8 mt-3" />}
          </SectionCard>
        </div>
      </TierGate>
    </Shell>
  );
}
