"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { unwrapList } from "@/types/api";
import { Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field, FailureNotice } from "@/components/cos/StageParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

/**
 * Settings (navigation map, Operator): account and wallet, as served by the identity service.
 *
 * API keys and webhooks were part of the original treasury module
 * (rescue/capability-os-before-20260904 app/(uacp)/treasury), served by the retired BYOS backend.
 * No current service owns them (checked 2026-10-09: /api/v1/auth/api-keys and
 * /api/v1/webhooks/* return 404 on every live service), so this page says so instead of calling
 * routes that do not exist. The workspace comes from the signed-in identity, never a typed value.
 */
type TopupOption = { amount?: number; tokens?: number; price?: number; label?: string };
type Transaction = { ts?: string; created_at?: string; type?: string; kind?: string; reference?: string; endpoint?: string; amount?: number; tokens?: number };

const buttonClass = "inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50";

function money(value: unknown): string {
  return value === undefined || value === null || Number.isNaN(Number(value)) ? "—" : `$${Number(value).toFixed(2)}`;
}

export default function SettingsPage() {
  const stage = getStage("settings");
  const data = useStageData("settings");
  const router = useRouter();
  const { me, loading, logout } = useAuth();
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

  if (!loading && !signedIn) {
    return (
      <SectionShell stage={stage} proof="Manual step" records={data.records}>
        <div className="xl:col-span-2">
          <Pillar title="Sign in" proof="Manual step">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-cos-muted">
              <span>Settings belong to a signed-in account.</span>
              <span className="flex gap-2"><Link href="/login?returnTo=%2Fos%2Fsettings" className={buttonClass}>Sign in</Link><Link href="/signup?returnTo=%2Fos%2Fsettings" className="inline-flex items-center rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-muted">Create account</Link></span>
            </div>
          </Pillar>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell stage={stage} proof={signedIn ? "Present" : "Not started"} records={data.records}>
      <Pillar title="Account" proof={signedIn ? "Present" : "Not started"} detail="As returned by the identity service.">
        <div className="grid gap-2 sm:grid-cols-2">
          <Field label="Email" value={me?.email} />
          <Field label="Role" value={me?.role ?? (me?.is_superuser ? "admin" : undefined)} />
          <Field label="Workspace" value={me?.workspace_id} />
          <Field label="Account status" value={me?.status} />
          <Field label="Email verified" value={me?.email_verified === undefined ? undefined : String(me.email_verified)} />
          <Field label="Plan" value={me?.tier} />
        </div>
        <button type="button" onClick={() => { logout(); router.push("/login?returnTo=%2Fos"); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-muted hover:text-cos-text"><LogOut size={13} />Sign out</button>
      </Pillar>
      <Pillar title="Wallet" proof={balance.data !== undefined ? "Present" : balance.error ? "Degraded" : "Not started"} detail="Balance and history as returned by the wallet service. Top-ups go to a real checkout page or nowhere.">
        {balance.error ? <FailureNotice detail="The wallet is unavailable." /> : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Balance" value={balance.data ? money(balance.data.balance ?? balance.data.tokens) : undefined} />
              <Field label="Recent transactions" value={transactions.data !== undefined ? String(transactionList.length) : undefined} />
            </div>
            {topupList.length ? <div className="flex flex-wrap gap-2">{topupList.map((option, index) => (
              <button key={`${option.amount ?? index}`} type="button" onClick={() => void topUp(option.amount)} disabled={busy} className={buttonClass}><Wallet size={13} />{option.label ?? money(option.price ?? option.amount)}</button>
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
      <Pillar title="API keys and webhooks" proof="Not started" detail="Not available yet. No current Veklom service issues API keys or sends webhooks, so nothing here pretends to. Your software connects through VLink today; event notifications and per-key management are planned.">
        <ul className="space-y-1 text-xs text-cos-muted">
          <li>To connect software now, create a link in <Link href="/vlink/connect" className="text-cos-accent">VLink</Link>.</li>
          <li>A key or a notification would never be authority to cause a consequence: that still needs a single-use grant.</li>
        </ul>
      </Pillar>
    </SectionShell>
  );
}
