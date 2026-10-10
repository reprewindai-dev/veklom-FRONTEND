"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { unwrapList } from "@/types/api";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { Field, FailureNotice, JsonPanel, PaymentChallenge } from "@/components/cos/StageParts";
import { VeklomActivityCue } from "@/components/cos/VeklomActivityCue";

type TopupOption = { amount?: number; tokens?: number; price?: number; label?: string };
type Transaction = { ts?: string; created_at?: string; type?: string; kind?: string; reference?: string; endpoint?: string; amount?: number; tokens?: number };
const walletButtonClass = "inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50";
function money(value: unknown): string {
  return value === undefined || value === null || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(2)}`;
}

/** Wallet balance, history and top-ups as returned by the wallet service. Top-ups go to a real checkout page or nowhere. */
function WalletPillar() {
  const { me } = useAuth();
  const signedIn = Boolean(me);
  const balance = useApi<Record<string, unknown>>(signedIn ? "/api/v1/wallet/balance" : null);
  const transactions = useApi<unknown>(signedIn ? "/api/v1/wallet/transactions" : null);
  const topups = useApi<unknown>(signedIn ? "/api/v1/wallet/topup/options" : null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function topUp(amount?: number) {
    setBusy(true); setWalletError(null);
    try {
      const result = await api<{ url?: string }>("/api/v1/wallet/topup/checkout", { method: "POST", body: { amount } });
      if (result?.url) window.location.href = result.url;
      else setWalletError("Checkout did not return a payment page. Nothing was charged.");
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Checkout is unavailable.");
    }
    setBusy(false);
  }
  const transactionList = unwrapList<Transaction>(transactions.data);
  const topupList = unwrapList<TopupOption>(topups.data);
  return (
    <Pillar title="Wallet" proof={!signedIn ? "Manual step" : balance.data !== undefined ? "Present" : balance.error ? "Degraded" : "Not started"} detail="Balance and history as returned by the wallet service. Paying never grants authority.">
      {!signedIn ? <p className="text-xs text-cos-muted">Sign in to see your wallet.</p> : balance.error ? <FailureNotice detail="The wallet is unavailable." /> : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Balance" value={balance.data ? money(balance.data.balance ?? balance.data.tokens) : undefined} />
            <Field label="Recent transactions" value={transactions.data !== undefined ? String(transactionList.length) : undefined} />
          </div>
          {topupList.length ? <div className="flex flex-wrap gap-2">{topupList.map((option, index) => (
            <button key={`${option.amount ?? index}`} type="button" onClick={() => void topUp(option.amount)} disabled={busy} className={walletButtonClass}><Wallet size={13} />{option.label ?? money(option.price ?? option.amount)}</button>
          ))}</div> : topups.data !== undefined ? <p className="text-xs text-cos-steel">No top-up options returned.</p> : null}
          {walletError ? <FailureNotice detail={walletError} /> : null}
          {transactionList.length ? (
            <ul className="space-y-1 font-mono text-[11px]">{transactionList.slice(0, 10).map((row, index) => (
              <li key={index} className="flex justify-between gap-3 border-t border-cos-border pt-1 text-cos-muted"><span>{row.ts ?? row.created_at ?? "—"} · {row.type ?? row.kind ?? "—"}</span><span className="text-cos-text">{money(row.amount ?? row.tokens)}</span></li>
            ))}</ul>
          ) : null}
        </div>
      )}
    </Pillar>
  );
}

function pricingEnabled(value: unknown): boolean | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (typeof record.enabled === "boolean") return record.enabled;
  if (typeof record.status === "string" && ["enabled", "disabled"].includes(record.status.toLowerCase())) return record.status.toLowerCase() === "enabled";
  return undefined;
}

/**
 * Settle (DESIGN_MODEL): payment, x402 and receipts. Shows only the payment discovery and pricing
 * documents the service returns. Payment verification and settlement receipts have no live route
 * yet, so they are stated as not started rather than inferred from a pricing manifest.
 */
export default function SettlePage() {
  const stage = getStage("settle");
  const data = useStageData("settle");
  useEffect(() => {
    for (const endpoint of stage.endpoints) if (endpoint.method === "GET" && !endpoint.path.includes("{")) void data.call(endpoint);
  }, [data.call, stage.endpoints]);
  const discovery = data.payloads[`GET ${stage.endpoints[0].path}`];
  const pricing = data.payloads[`GET ${stage.endpoints[1].path}`];
  const enabled = pricingEnabled(pricing);
  const challenge = Object.values(data.payloads).find((value) => value && typeof value === "object" && "x402_version" in value);
  const proofOf = (path: string) => data.records.find((record) => record.path === path)?.proof ?? "Not started";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar title="Payment discovery" proof={discovery ? proofOf(stage.endpoints[0].path) : "Not started"} detail="How a machine learns what an action costs and how to pay (x402), shown exactly as returned.">
          <div className="flex items-center gap-3"><CircleDollarSign className="text-cos-accent" size={19} /><span className="text-sm text-cos-text">Machine-to-machine payment terms</span></div>
          <div className="mt-4">{challenge ? <PaymentChallenge value={challenge} /> : <JsonPanel value={discovery} empty={`GET ${stage.endpoints[0].path} has not returned a discovery document.`} />}</div>
        </Pillar>
      </div>
      <Pillar title="Pricing" proof={pricing ? proofOf(stage.endpoints[1].path) : "Not started"} detail="Whether paid actions are switched on, and their prices.">
        <div className="mb-4 flex items-center justify-between"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Pricing state</span>{enabled !== undefined ? <span className="flex items-center gap-2 text-xs text-cos-muted"><VeklomActivityCue kind="system" condition={enabled ? "active" : "failed"} size={18} showCaption={false} />{enabled ? "enabled" : "disabled"}</span> : null}</div>
        <JsonPanel value={pricing} empty={`GET ${stage.endpoints[1].path} has not returned pricing.`} />
      </Pillar>
      <Pillar title="Receipts" proof="Not started" detail="Payment verification and settlement receipts.">
        <HonestEmpty title="Not started" route="x402 verify / receipts: no live route" detail="No payment is verified and no settlement receipt is shown until the payment service exposes them. Paying never grants authority: each action still needs its own single-use grant." />
      </Pillar>
      <WalletPillar />
    </SectionShell>
  );
}
