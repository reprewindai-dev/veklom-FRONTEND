"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Button, ErrorBox } from "@/components/ui";
import { api } from "@/lib/api";
import { useState } from "react";
import { ModuleHeader, SectionCard, Pill, ProgressBar, KV, fmtUsd, ACCENT } from "@/components/telemetry";
import { Power, PowerOff, ShieldAlert } from "lucide-react";

export default function KillSwitchPage() {
  const status = useApi<any>("/api/v1/cost/kill-switch/status");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const [reason, setReason] = useState("");

  const s = status.data || {};
  const engaged = !!(s.is_active ?? s.engaged ?? s.active);
  const spend = s.current_spend ?? 0;
  const cap = s.threshold_usd ?? 0;
  const pct = cap ? (spend / cap) * 100 : 0;

  async function engage() {
    setBusy(true); setErr(undefined);
    try { await api("/api/v1/cost/kill-switch", { method: "POST", body: { reason: reason.trim() || "Manual halt from console" } }); setReason(""); status.mutate(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }
  async function release() {
    setBusy(true); setErr(undefined);
    try { await api("/api/v1/cost/kill-switch", { method: "DELETE" }); status.mutate(); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <Shell>
      <TierGate required="sovereign" feature="Kill Switch">
        <ModuleHeader
          breadcrumb="Governance · Kill Switch"
          title="Execution kill switch"
          subtitle="Halt all governed execution instantly. Enforced by the x402 middleware on every call and auto-engaged on budget breach."
          pills={<Pill tone={engaged ? "red" : "green"} dot>{engaged ? "ENGAGED" : "STANDBY"}</Pill>}
        />
        {err && <div className="mb-4"><ErrorBox message={err} /></div>}

        <div className="grid lg:grid-cols-2 gap-4">
          <SectionCard label="State" title="Switch control">
            <div className="text-center py-6">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${engaged ? "bg-accent-red/15 text-accent-red" : "bg-accent-green/15 text-accent-green"}`}>
                {engaged ? <PowerOff size={34} /> : <Power size={34} />}
              </div>
              <div className="text-[22px] font-semibold mb-1">{engaged ? "Execution halted" : "All systems nominal"}</div>
              <div className="text-ink-500 text-[13px] mb-5">{engaged ? (s.reason || "Manual halt") : "Governed execution is flowing normally."}</div>
              {engaged ? (
                <Button variant="ghost" onClick={release} loading={busy}><Power size={14} /> Release kill switch</Button>
              ) : (
                <div className="max-w-sm mx-auto space-y-2">
                  <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
                  <Button variant="danger" onClick={engage} loading={busy} className="w-full"><ShieldAlert size={14} /> Engage kill switch</Button>
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard label="Context" title="Spend vs. threshold">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[22px] font-semibold">{fmtUsd(spend)}</span>
              <span className="text-[12px] text-ink-500">threshold {fmtUsd(cap)}</span>
            </div>
            <ProgressBar percent={pct} color={pct > 90 ? ACCENT.red : pct > 70 ? ACCENT.amber : ACCENT.green} />
            <div className="text-[11px] text-ink-600 mt-2">{pct.toFixed(1)}% of auto-halt threshold</div>
            <div className="card p-3 mt-4">
              <KV k="State" v={engaged ? "Active" : "Standby"} mono={false} />
              <KV k="Activated by" v={s.activated_by || "—"} mono={false} />
              <KV k="Reason" v={s.reason || "—"} mono={false} />
              <KV k="Current spend" v={fmtUsd(spend)} />
              <KV k="Auto-halt at" v={fmtUsd(cap)} />
            </div>
            <p className="text-[11px] text-ink-500 mt-3">When MTD spend crosses the threshold, the switch engages automatically and every subsequent paid call returns 402 until released.</p>
          </SectionCard>
        </div>
      </TierGate>
    </Shell>
  );
}
