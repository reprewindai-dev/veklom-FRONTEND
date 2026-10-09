"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, KeyRound, LogOut, Trash2, Wallet, Webhook } from "lucide-react";
import { api } from "@/lib/api";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/lib/auth-context";
import { unwrapList } from "@/types/api";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field, FailureNotice } from "@/components/cos/StageParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

/**
 * Settings (navigation map, Operator). Restored from the original treasury module
 * (rescue/capability-os-before-20260904 app/(uacp)/treasury): API keys, wallet and webhooks, all
 * served by the identity service and VLink. Its simulated checkout fallback and decorative banners
 * are not carried over. The workspace comes from the signed-in identity, never from a typed value.
 */
type ApiKey = { id?: string; key_id?: string; name?: string; prefix?: string; preview?: string; scopes?: string[]; created_at?: string };
type WebhookEndpoint = { id: string; url: string; events: string[]; is_active?: boolean; last_triggered_at?: string | null; fail_count?: number };
type WebhookDelivery = { id: string; event: string; status: string; status_code?: number; delivered_at?: string };
type TopupOption = { amount?: number; tokens?: number; price?: number; label?: string };
type Transaction = { ts?: string; created_at?: string; type?: string; kind?: string; reference?: string; endpoint?: string; amount?: number; tokens?: number };

const SCOPES = [
  { id: "read", label: "Read", detail: "Query agents, runs and telemetry" },
  { id: "write", label: "Write", detail: "Create runs and submit signals" },
  { id: "admin", label: "Admin", detail: "Manage keys, webhooks and settings" },
];
const WEBHOOK_EVENTS = ["budget.cap_exceeded", "kill_switch.activated", "inference.completed", "sla.breach"];

const inputClass = "mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text";
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

  const keys = useApi<unknown>(signedIn ? "/api/v1/auth/api-keys" : null);
  const balance = useApi<Record<string, unknown>>(signedIn ? "/api/v1/wallet/balance" : null);
  const transactions = useApi<unknown>(signedIn ? "/api/v1/wallet/transactions" : null);
  const topups = useApi<unknown>(signedIn ? "/api/v1/wallet/topup/options" : null);

  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>(["read"]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[] | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["budget.cap_exceeded", "kill_switch.activated"]);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadWebhooks = useCallback(async () => {
    try {
      const [endpointData, deliveryData] = await Promise.all([
        api<{ endpoints?: WebhookEndpoint[] }>("/api/v1/webhooks/endpoints"),
        api<{ deliveries?: WebhookDelivery[] }>("/api/v1/webhooks/deliveries?limit=10").catch(() => ({ deliveries: [] })),
      ]);
      setEndpoints(endpointData?.endpoints ?? []);
      setDeliveries(deliveryData?.deliveries ?? []);
      setWebhookError(null);
    } catch (error) {
      setEndpoints(null);
      setWebhookError(error instanceof Error ? error.message : "Webhooks are unavailable.");
    }
  }, []);

  useEffect(() => { if (signedIn) void loadWebhooks(); }, [signedIn, loadWebhooks]);

  async function createKey() {
    if (!keyName.trim() || !keyScopes.length) { setKeyError("Name the key and choose at least one scope."); return; }
    setBusy("key"); setKeyError(null); setNewKey(null);
    try {
      const result = await api<Record<string, unknown>>("/api/v1/auth/api-keys", { method: "POST", body: { name: keyName.trim(), scopes: keyScopes } });
      const token = result?.key ?? result?.api_key ?? result?.token;
      setNewKey(typeof token === "string" ? token : null);
      setKeyName(""); setKeyScopes(["read"]);
      await keys.mutate();
    } catch (error) {
      setKeyError(error instanceof Error ? error.message : "The key was not created.");
    }
    setBusy(null);
  }

  async function revokeKey(id: string) {
    setBusy(`key:${id}`);
    try {
      await api(`/api/v1/auth/api-keys/${encodeURIComponent(id)}`, { method: "DELETE" });
      await keys.mutate();
    } catch (error) {
      setKeyError(error instanceof Error ? error.message : "The key was not revoked.");
    }
    setBusy(null);
  }

  async function topUp(amount?: number) {
    setBusy("wallet"); setWalletError(null);
    try {
      const result = await api<{ url?: string }>("/api/v1/wallet/topup/checkout", { method: "POST", body: { amount } });
      if (result?.url) window.location.href = result.url;
      else setWalletError("Checkout did not return a payment page. Nothing was charged.");
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : "Checkout is unavailable.");
    }
    setBusy(null);
  }

  async function addWebhook() {
    if (!webhookUrl.trim()) { setWebhookError("Enter the URL to notify."); return; }
    setBusy("webhook"); setWebhookError(null);
    try {
      await api("/api/v1/webhooks/endpoints", { method: "POST", body: { url: webhookUrl.trim(), events: webhookEvents } });
      setWebhookUrl("");
      await loadWebhooks();
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : "The webhook was not added.");
    }
    setBusy(null);
  }

  async function removeWebhook(id: string) {
    setBusy(`webhook:${id}`);
    try {
      await api(`/api/v1/webhooks/endpoints/${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadWebhooks();
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : "The webhook was not removed.");
    }
    setBusy(null);
  }

  const keyList = unwrapList<ApiKey>(keys.data);
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
      <Pillar title="API keys" proof={keys.data !== undefined ? "Present" : keys.error ? "Degraded" : "Not started"} detail="Keys identify your software to Veklom. A key is never authority to cause a consequence; that still needs a single-use grant.">
        <div className="space-y-3">
          <label className="block text-xs text-cos-muted">Name<input value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="e.g. build server" className={inputClass} /></label>
          <div className="flex flex-wrap gap-3">{SCOPES.map((scope) => (
            <label key={scope.id} title={scope.detail} className="inline-flex items-center gap-2 text-xs text-cos-muted"><input type="checkbox" checked={keyScopes.includes(scope.id)} onChange={() => setKeyScopes((current) => current.includes(scope.id) ? current.filter((item) => item !== scope.id) : [...current, scope.id])} />{scope.label}</label>
          ))}</div>
          <button type="button" onClick={() => void createKey()} disabled={busy !== null} className={buttonClass}><KeyRound size={13} />Create key</button>
          {newKey ? (
            <div className="rounded-lg border border-cos-accent/40 bg-cos-accent/[0.05] p-3 text-xs">
              <div className="text-cos-text">Copy this key now. It will not be shown again.</div>
              <div className="mt-2 flex items-center gap-2"><code className="flex-1 break-all font-mono text-cos-text">{newKey}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(newKey)} aria-label="Copy key" className="rounded border border-cos-border p-1.5 text-cos-steel hover:text-cos-text"><Copy size={13} /></button></div>
            </div>
          ) : null}
          {keyError ? <FailureNotice detail={keyError} /> : null}
          {keys.error ? <FailureNotice detail="Your keys could not be loaded." /> : keyList.length ? (
            <ul className="space-y-2">{keyList.map((key) => {
              const id = key.id ?? key.key_id ?? "";
              return (
                <li key={id || key.name} className="flex items-center justify-between gap-3 rounded-lg border border-cos-border bg-cos-bg/35 px-3 py-2 text-xs">
                  <span className="min-w-0"><span className="text-cos-text">{key.name ?? "Unnamed key"}</span> <span className="font-mono text-cos-steel">{key.prefix ?? key.preview ?? ""}</span><span className="block font-mono text-[10px] text-cos-steel">{(key.scopes ?? []).join(", ") || "no scopes returned"} · {key.created_at ?? "created date not returned"}</span></span>
                  {id ? <button type="button" onClick={() => void revokeKey(id)} disabled={busy !== null} className="inline-flex items-center gap-1 rounded border border-cos-warn/40 px-2 py-1 text-cos-warn disabled:opacity-50"><Trash2 size={12} />Revoke</button> : null}
                </li>
              );
            })}</ul>
          ) : keys.data !== undefined ? <p className="text-xs text-cos-steel">No keys yet.</p> : null}
        </div>
      </Pillar>
      <Pillar title="Wallet" proof={balance.data !== undefined ? "Present" : balance.error ? "Degraded" : "Not started"} detail="Balance and history as returned by the wallet service. Top-ups go to a real checkout page or nowhere.">
        {balance.error ? <FailureNotice detail="The wallet is unavailable." /> : (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Balance" value={balance.data ? money(balance.data.balance ?? balance.data.tokens) : undefined} />
              <Field label="Recent transactions" value={transactions.data !== undefined ? String(transactionList.length) : undefined} />
            </div>
            {topupList.length ? <div className="flex flex-wrap gap-2">{topupList.map((option, index) => (
              <button key={`${option.amount ?? index}`} type="button" onClick={() => void topUp(option.amount)} disabled={busy !== null} className={buttonClass}><Wallet size={13} />{option.label ?? money(option.price ?? option.amount)}</button>
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
      <Pillar title="Webhooks" proof={endpoints ? "Present" : webhookError ? "Degraded" : "Not started"} detail="Where Veklom notifies your systems about events. A notification is information, not authority.">
        <div className="space-y-3">
          <label className="block text-xs text-cos-muted">URL to notify<input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="https://example.com/veklom-events" className={inputClass} /></label>
          <div className="flex flex-wrap gap-3">{WEBHOOK_EVENTS.map((name) => (
            <label key={name} className="inline-flex items-center gap-2 font-mono text-[11px] text-cos-muted"><input type="checkbox" checked={webhookEvents.includes(name)} onChange={() => setWebhookEvents((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])} />{name}</label>
          ))}</div>
          <button type="button" onClick={() => void addWebhook()} disabled={busy !== null} className={buttonClass}><Webhook size={13} />Add webhook</button>
          {webhookError ? <FailureNotice detail={webhookError} /> : null}
          {endpoints?.length ? (
            <ul className="space-y-2">{endpoints.map((endpoint) => (
              <li key={endpoint.id} className="flex items-center justify-between gap-3 rounded-lg border border-cos-border bg-cos-bg/35 px-3 py-2 text-xs">
                <span className="min-w-0"><span className="block truncate font-mono text-cos-text">{endpoint.url}</span><span className="block font-mono text-[10px] text-cos-steel">{endpoint.events.join(", ")} · failures {endpoint.fail_count ?? 0}</span></span>
                <button type="button" onClick={() => void removeWebhook(endpoint.id)} disabled={busy !== null} className="inline-flex items-center gap-1 rounded border border-cos-warn/40 px-2 py-1 text-cos-warn disabled:opacity-50"><Trash2 size={12} />Remove</button>
              </li>
            ))}</ul>
          ) : endpoints ? <HonestEmpty title="No webhooks yet" route="GET /api/v1/webhooks/endpoints" detail="Add a URL above to be notified of events." /> : null}
          {deliveries.length ? (
            <ul className="space-y-1 font-mono text-[10px] text-cos-steel">{deliveries.map((delivery) => <li key={delivery.id}>{delivery.delivered_at ?? "—"} · {delivery.event} · {delivery.status}{delivery.status_code ? ` (${delivery.status_code})` : ""}</li>)}</ul>
          ) : null}
        </div>
      </Pillar>
    </SectionShell>
  );
}
