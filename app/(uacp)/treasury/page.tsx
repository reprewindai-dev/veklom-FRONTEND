"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { api } from "@/lib/api";
import { unwrapList } from "@/types/api";
import { 
  Coins, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  KeyRound,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  Zap,
  Clock,
  ShieldCheck,
  Send,
  PlusCircle,
  FileText,
  Sliders,
  Settings,
  Github,
  Cpu
} from "lucide-react";

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret_hint: string;
  is_active: boolean;
  last_triggered_at: string | null;
  fail_count: number;
}

interface WebhookDelivery {
  id: string;
  event: string;
  status: "success" | "failed" | "pending";
  status_code: number;
  url: string;
  delivered_at: string;
  duration_ms: number;
}

function TreasuryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get("reason");
  const returnTo = searchParams.get("returnTo") || "/runtime";

  // Tab State — initialize from ?tab= query param (sidebar deep-links use this)
  const tabParam = searchParams.get("tab");
  const initialTab = (["wallet", "keys", "webhooks", "settings"].includes(tabParam ?? "") 
    ? tabParam 
    : "wallet") as "wallet" | "keys" | "webhooks" | "settings";
  const [activeTab, setActiveTab] = useState<"wallet" | "keys" | "webhooks" | "settings">(initialTab);

  // Wallet Data
  const balance = useApi<any>("/api/v1/wallet/balance");
  const tx = useApi<any>("/api/v1/wallet/transactions");
  const usage = useApi<any>("/api/v1/wallet/stats/usage");
  const options = useApi<any>("/api/v1/wallet/topup/options");
  
  // API Keys Data
  const keys = useApi<any>("/api/v1/auth/api-keys");
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyToken, setNewKeyToken] = useState<string | null>(null);
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["read"]);
  const [copiedKey, setCopiedKey] = useState(false);
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyErr, setKeyErr] = useState<string | null>(null);

  const ALL_SCOPES = [
    { id: "read",  label: "Read",  desc: "Query agents, runs, telemetry" },
    { id: "write", label: "Write", desc: "Create runs, submit signals" },
    { id: "admin", label: "Admin", desc: "Manage keys, webhooks, settings" },
  ];

  function toggleScope(scope: string) {
    setNewKeyScopes(prev =>
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  }

  // Webhooks Data
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["budget.cap_exceeded", "kill_switch.activated"]);
  const [webhookBusy, setWebhookBusy] = useState(false);
  const [webhookErr, setWebhookErr] = useState<string | null>(null);

  // Integrations / Model settings
  const [gitToken, setGitToken] = useState("");
  const [defaultModel, setDefaultModel] = useState("llama3.2:latest");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsErr, setSettingsErr] = useState<string | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);
  
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState<string | undefined>();

  // Fetch Outbound Webhooks
  const loadWebhooks = async () => {
    try {
      const [epData, dlData] = await Promise.all([
        api<{ endpoints: WebhookEndpoint[] }>("/api/v1/webhooks/endpoints").catch(() => ({ endpoints: [] })),
        api<{ deliveries: WebhookDelivery[] }>("/api/v1/webhooks/deliveries?limit=10").catch(() => ({ deliveries: [] })),
      ]);
      setEndpoints(epData?.endpoints ?? []);
      setDeliveries(dlData?.deliveries ?? []);
    } catch {}
  };

  // Fetch integrations
  const loadSettings = async () => {
    try {
      const res = await api<any>("/api/v1/auth/me");
      if (res) {
        setDefaultModel(res.default_model || "llama3.2:latest");
        setGitToken(res.github_connected ? "••••••••••••••••••••" : "");
      }
    } catch {}
  };

  useEffect(() => {
    if (activeTab === "webhooks") {
      loadWebhooks();
    } else if (activeTab === "settings") {
      loadSettings();
    }
  }, [activeTab]);

  async function topup(amount?: number) {
    setBusy(true);
    setErr(undefined);
    try {
      const res = await api<any>("/api/v1/wallet/topup/checkout", { body: { amount } });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        setSuccessMsg("Checkout simulation triggered. If on local development, balance updated successfully.");
        balance.mutate();
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // API Key Actions
  async function createApiKey() {
    if (!newKeyName.trim()) { setKeyErr("Name the key first."); return; }
    if (newKeyScopes.length === 0) { setKeyErr("Select at least one scope."); return; }
    setKeyBusy(true); setKeyErr(null); setNewKeyToken(null);
    try {
      const res = await api<any>("/api/v1/auth/api-keys", { method: "POST", body: { name: newKeyName.trim(), scopes: newKeyScopes } });
      setNewKeyToken(res.key || res.api_key || res.token);
      setNewKeyName("");
      setNewKeyScopes(["read"]);
      keys.mutate();
    } catch (e) { setKeyErr((e as Error).message); } finally { setKeyBusy(false); }
  }

  async function revokeApiKey(id: string) {
    try { 
      await api(`/api/v1/auth/api-keys/${id}`, { method: "DELETE" }); 
      keys.mutate(); 
    } catch {}
  }

  function copyKeyToClipboard() {
    if (newKeyToken) { 
      navigator.clipboard.writeText(newKeyToken); 
      setCopiedKey(true); 
      setTimeout(() => setCopiedKey(false), 1500); 
    }
  }

  // Webhook Actions
  async function createWebhook() {
    if (!webhookUrl.trim()) { setWebhookErr("Webhook URL required."); return; }
    setWebhookBusy(true); setWebhookErr(null);
    try {
      await api("/api/v1/webhooks/endpoints", {
        method: "POST",
        body: { url: webhookUrl.trim(), events: webhookEvents }
      });
      setWebhookUrl("");
      loadWebhooks();
    } catch (e) { setWebhookErr((e as Error).message); } finally { setWebhookBusy(false); }
  }

  async function deleteWebhook(id: string) {
    try {
      await api(`/api/v1/webhooks/endpoints/${id}`, { method: "DELETE" });
      loadWebhooks();
    } catch {}
  }

  // Settings Actions
  async function saveSettings() {
    setSettingsBusy(true);
    setSettingsSaved(false);
    setSettingsErr(null);
    try {
      const payload: Record<string, any> = { default_model: defaultModel };
      if (gitToken && gitToken !== "••••••••••••••••••••") {
        payload.github_token = gitToken.trim();
      }
      await api("/api/v1/auth/settings", { method: "POST", body: payload });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (e) {
      setSettingsErr((e as Error).message);
    } finally {
      setSettingsBusy(false);
    }
  }

  // Format helper
  const formatUSDC = (val: any) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "—";
    return `$${Number(val).toFixed(2)}`;
  };

  const transactionList = unwrapList<any>(tx.data);
  const topupOptions = unwrapList<any>(options.data);
  const keyList = unwrapList<any>(keys.data);

  return (
    <div className="relative w-full h-full p-6 bg-void-black grid-overlay select-none overflow-y-auto font-mono">
      
      {/* 402 Alert Bar */}
      {reason === "payment-required" && (
        <div className="mb-6 p-4 rounded-none border border-laser-red/30 bg-laser-red/10 flex items-start gap-3 animate-pulse">
          <AlertTriangle className="w-5 h-5 text-laser-red shrink-0 mt-0.5" />
          <div>
            <h3 className="text-white text-xs font-bold font-sans uppercase">SLA Performance Bond Slashed / Insufficient Funds</h3>
            <p className="text-[10px] text-white/70 mt-1">
              Your account has run out of tokens required for ZK validation and gas delegation. Top up to resume execution.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <span className="text-[10px] text-electric-cyan tracking-widest font-black uppercase">Capital Allocation & Settlement</span>
          <h2 className="text-white text-base font-bold font-sans tracking-tight">Workspace Treasury</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              balance.mutate();
              tx.mutate();
              usage.mutate();
              keys.mutate();
              if (activeTab === "webhooks") loadWebhooks();
              if (activeTab === "settings") loadSettings();
            }}
            className="p-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-white/5 mb-6">
        <button
          onClick={() => setActiveTab("wallet")}
          className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === "wallet" ? "border-brand-400 text-brand-400" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Reserves & Top-ups
        </button>
        <button
          onClick={() => setActiveTab("keys")}
          className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === "keys" ? "border-brand-400 text-brand-400" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab("webhooks")}
          className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === "webhooks" ? "border-brand-400 text-brand-400" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Webhooks Feed
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 text-xs font-bold uppercase border-b-2 transition-all cursor-pointer ${
            activeTab === "settings" ? "border-brand-400 text-brand-400" : "border-transparent text-white/40 hover:text-white/70"
          }`}
        >
          Integrations & Models
        </button>
      </div>

      {err && (
        <div className="mb-6 p-3 border border-laser-red/30 bg-laser-red/10 text-[10px] text-laser-red">
          {err}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-3 border border-matrix-emerald/30 bg-matrix-emerald/10 text-[10px] text-matrix-emerald">
          {successMsg}
        </div>
      )}

      {/* TABS CONTENT */}
      {activeTab === "wallet" && (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Balance Card */}
            <div className="p-4 border border-white/10 bg-black/60 relative overflow-hidden group hover:border-[#b8860b]/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 text-[9px] uppercase font-bold text-white/30 tracking-tight">STABLE_RESERVE</div>
              <div className="text-[9px] text-[#b8860b] tracking-wider font-bold mb-1 flex items-center gap-1">
                <Coins className="w-3 h-3" /> AVAILABLE BALANCE
              </div>
              <h3 className="text-white font-sans text-xl font-bold leading-normal mt-2">
                {balance.isLoading ? "Loading..." : formatUSDC(balance.data?.balance ?? balance.data?.tokens)}
              </h3>
              <div className="flex items-center gap-1.5 mt-3 text-[9px] text-matrix-emerald">
                <CheckCircle2 className="w-3 h-3" /> SLA Performance Locked
              </div>
            </div>

            {/* 30D Burn Rate */}
            <div className="p-4 border border-white/10 bg-black/60 relative overflow-hidden group hover:border-electric-cyan/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 text-[9px] uppercase font-bold text-white/30 tracking-tight">CONSUMPTION</div>
              <div className="text-[9px] text-electric-cyan tracking-wider font-bold mb-1 flex items-center gap-1">
                <Activity className="w-3 h-3" /> SPENT (30D)
              </div>
              <h3 className="text-white font-sans text-xl font-bold leading-normal mt-2">
                {usage.isLoading ? "Loading..." : formatUSDC(usage.data?.last_30d ?? usage.data?.spent_30d)}
              </h3>
              <div className="text-[9px] text-white/40 mt-3 font-sans">
                Tracked across all governed clusters
              </div>
            </div>

            {/* Avg Per Day */}
            <div className="p-4 border border-white/10 bg-black/60 relative overflow-hidden group hover:border-matrix-emerald/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 text-[9px] uppercase font-bold text-white/30 tracking-tight">ATTRIBUTION</div>
              <div className="text-[9px] text-matrix-emerald tracking-wider font-bold mb-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> DAILY AVG
              </div>
              <h3 className="text-white font-sans text-xl font-bold leading-normal mt-2">
                {usage.isLoading ? "Loading..." : formatUSDC(usage.data?.avg_per_day)}
              </h3>
              <div className="text-[9px] text-white/40 mt-3 font-sans">
                Auto-compiling average usage frequency
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top-up Options */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 border border-white/10 bg-black/40">
                <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider mb-4 border-b border-white/5 pb-2">
                  Top-up Options
                </h3>
                <div className="space-y-2">
                  {topupOptions.map((o: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => topup(o.amount || o.tokens)}
                      disabled={busy}
                      className="w-full text-left px-3 py-2 rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs flex justify-between items-center transition-all cursor-pointer"
                    >
                      <span className="text-white/80">{o.label || `${o.tokens || o.amount} Tokens`}</span>
                      <span className="text-[#b8860b] font-bold">{formatUSDC(o.price)}</span>
                    </button>
                  ))}
                  {topupOptions.length === 0 && (
                    <div className="text-white/30 text-[10px] text-center py-4">No top-up packages available</div>
                  )}
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="lg:col-span-8">
              <div className="border border-white/10 bg-black/40 overflow-hidden">
                <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider p-4 border-b border-white/5">
                  Protocol Settlement History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[9px] text-white/30 uppercase bg-black/25">
                        <th className="p-3">Time</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Reference</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {transactionList.slice(0, 50).map((r: any, idx: number) => {
                        const isCredit = r.amount > 0;
                        return (
                          <tr key={idx} className="hover:bg-white/[0.01] text-[10px] transition-colors">
                            <td className="p-3 text-white/50">{r.ts || r.created_at}</td>
                            <td className="p-3 text-white/80 font-bold">{r.type || r.kind}</td>
                            <td className="p-3 text-white/40">{r.reference || r.endpoint || "—"}</td>
                            <td className={`p-3 text-right font-bold ${isCredit ? "text-matrix-emerald" : "text-laser-red"}`}>
                              {isCredit ? "+" : ""}{formatUSDC(r.amount ?? r.tokens)}
                            </td>
                          </tr>
                        );
                      })}
                      {transactionList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-white/20 text-[10px]">
                            No recent ZK-validation settlements
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "keys" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Key Creation Form */}
          <div className="lg:col-span-4">
            <div className="p-4 border border-white/10 bg-black/40 space-y-4">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider border-b border-white/5 pb-2">
                Generate API Key
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-white/40 uppercase block mb-1">Key Description</label>
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. Production Agent Server"
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-white/20 font-mono focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-white/40 uppercase block mb-1.5">Permission Scopes</label>
                  <div className="space-y-1.5">
                    {ALL_SCOPES.map((s) => {
                      const active = newKeyScopes.includes(s.id);
                      return (
                        <label
                          key={s.id}
                          className={`flex items-center gap-2.5 p-2 border cursor-pointer transition-all select-none ${
                            active
                              ? "border-brand-400/50 bg-brand-400/10"
                              : "border-white/5 bg-black/40 hover:border-white/15"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleScope(s.id)}
                            className="rounded bg-black border-white/10 text-brand-400 focus:ring-0 focus:ring-offset-0"
                          />
                          <div className="flex-1">
                            <span className={`text-[10px] font-bold uppercase tracking-wide ${active ? "text-brand-400" : "text-white/50"}`}>
                              {s.label}
                            </span>
                            <span className="text-[9px] text-white/30 ml-1.5">{s.desc}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {keyErr && <div className="text-[9px] text-laser-red">{keyErr}</div>}
                
                <button
                  onClick={createApiKey}
                  disabled={keyBusy || newKeyScopes.length === 0}
                  className="w-full py-2 bg-brand-400 text-black font-bold text-xs uppercase cursor-pointer hover:bg-brand-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Generate Key
                </button>
              </div>

              {newKeyToken && (
                <div className="p-3 border border-matrix-emerald/30 bg-matrix-emerald/5 rounded space-y-2 animate-fade-up">
                  <div className="text-[9px] text-matrix-emerald uppercase font-bold">Copy Key Credentials (Shown Once)</div>
                  <div className="flex items-center gap-2 bg-black/80 p-2 border border-white/5 rounded">
                    <code className="text-[10px] text-white break-all flex-1">{newKeyToken}</code>
                    <button 
                      onClick={copyKeyToClipboard} 
                      className="p-1.5 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3.5 h-3.5 text-matrix-emerald" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Keys List Table */}
          <div className="lg:col-span-8">
            <div className="border border-white/10 bg-black/40 overflow-hidden">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider p-4 border-b border-white/5">
                Active Client Credentials
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] text-white/30 uppercase bg-black/25">
                      <th className="p-3">Name</th>
                      <th className="p-3">Prefix</th>
                      <th className="p-3">Scopes</th>
                      <th className="p-3">Created At</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {keyList.map((k: any) => {
                      const scopes: string[] = k.scopes || [];
                      return (
                        <tr key={k.id || k.key_id} className="hover:bg-white/[0.01] text-[10px] transition-colors">
                          <td className="p-3 text-white/80 font-bold">
                            <span className="flex items-center gap-1.5"><KeyRound className="w-3 h-3 text-brand-400" /> {k.name}</span>
                          </td>
                          <td className="p-3 text-white/40"><code className="bg-white/5 px-1">{k.prefix || k.preview || "—"}…</code></td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {scopes.length > 0 ? scopes.map((s) => (
                                <span
                                  key={s}
                                  className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${
                                    s === "admin" ? "bg-laser-red/15 text-laser-red border border-laser-red/20" :
                                    s === "write" ? "bg-[#b8860b]/15 text-[#b8860b] border border-[#b8860b]/20" :
                                    "bg-brand-400/10 text-brand-400 border border-brand-400/20"
                                  }`}
                                >{s}</span>
                              )) : <span className="text-white/20 text-[9px]">—</span>}
                            </div>
                          </td>
                          <td className="p-3 text-white/50">{(k.created_at || "").slice(0, 10)}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => revokeApiKey(k.id || k.key_id)}
                              className="p-1 px-2 rounded border border-laser-red/20 bg-laser-red/5 hover:bg-laser-red/10 text-laser-red transition-all cursor-pointer text-[9px] uppercase font-bold"
                            >
                              Revoke
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {keyList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-white/20 text-[10px]">
                          No client credentials registered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "webhooks" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Webhook Endpoint Config */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 border border-white/10 bg-black/40 space-y-4">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider border-b border-white/5 pb-2">
                Register Webhook Endpoint
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[9px] text-white/40 uppercase block mb-1">Destination URL</label>
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api.yourdomain.com/webhooks"
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-white/20 font-mono focus:outline-none focus:border-brand-400"
                  />
                </div>

                <div>
                  <label className="text-[9px] text-white/40 uppercase block mb-1">Triggering Events</label>
                  <div className="bg-black/60 p-2.5 border border-white/10 max-h-32 overflow-y-auto space-y-1.5">
                    {["budget.cap_exceeded", "kill_switch.activated", "inference.completed", "sla.breach"].map((evt) => {
                      const active = webhookEvents.includes(evt);
                      return (
                        <label key={evt} className="flex items-center gap-2 text-[10px] text-white/60 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              setWebhookEvents(prev => 
                                active ? prev.filter(e => e !== evt) : [...prev, evt]
                              );
                            }}
                            className="rounded bg-black border-white/10 text-brand-400 focus:ring-0"
                          />
                          {evt}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {webhookErr && <div className="text-[9px] text-laser-red">{webhookErr}</div>}

                <button
                  onClick={createWebhook}
                  disabled={webhookBusy}
                  className="w-full py-2 bg-brand-400 text-black font-bold text-xs uppercase cursor-pointer hover:bg-brand-500 transition-colors flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Save Webhook
                </button>
              </div>
            </div>
          </div>

          {/* Webhooks Feed List */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border border-white/10 bg-black/40 overflow-hidden">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider p-4 border-b border-white/5">
                Active Event Endpoints
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] text-white/30 uppercase bg-black/25">
                      <th className="p-3">Endpoint URL</th>
                      <th className="p-3">Subscribed Events</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {endpoints.map((ep) => (
                      <tr key={ep.id} className="hover:bg-white/[0.01] text-[10px] transition-colors">
                        <td className="p-3 text-white/80 font-bold truncate max-w-[200px]">{ep.url}</td>
                        <td className="p-3 text-white/40 text-[9px]">{ep.events.join(", ")}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => deleteWebhook(ep.id)}
                            className="p-1 px-2 rounded border border-laser-red/20 bg-laser-red/5 hover:bg-laser-red/10 text-laser-red transition-all cursor-pointer text-[9px] uppercase font-bold"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                    {endpoints.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-white/20 text-[10px]">
                          No outbound webhooks registered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deliveries log Feed */}
            <div className="border border-white/10 bg-black/40 overflow-hidden">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider p-4 border-b border-white/5">
                Outbound Event Delivery Log
              </h3>
              <div className="overflow-x-auto font-mono text-[9px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] text-white/30 uppercase bg-black/25">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Event</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {deliveries.map((dl) => (
                      <tr key={dl.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-3 text-white/50">{dl.delivered_at.slice(11, 19)} UTC</td>
                        <td className="p-3 text-white/80 font-bold">{dl.event}</td>
                        <td className={`p-3 font-bold ${dl.status === "success" ? "text-matrix-emerald" : "text-laser-red"}`}>
                          {dl.status.toUpperCase()} ({dl.status_code})
                        </td>
                        <td className="p-3 text-right text-white/40">{dl.duration_ms} ms</td>
                      </tr>
                    ))}
                    {deliveries.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-white/20 text-[10px]">
                          No recent event dispatch records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-up">
          {/* Model Selection Panel */}
          <div className="lg:col-span-6 space-y-4">
            <div className="p-4 border border-white/10 bg-black/40 space-y-4">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-brand-400" /> Model Configuration
              </h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] text-white/40 uppercase block mb-1">Gateway Default Model (Inference)</label>
                  <select
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-brand-400"
                  >
                    <option value="llama3.2:latest">Llama 3.2 (Core Gateway Model)</option>
                    <option value="llama3.1:latest">Llama 3.1 (High Capacity)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (OpenAI Interlink)</option>
                    <option value="gpt-4o">GPT-4o (OpenAI Premium Interlink)</option>
                    <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic Interlink)</option>
                  </select>
                  <span className="text-[9px] text-white/25 mt-1 block">
                    All standard API gateway completions default to this model unless explicitly requested in request bodies.
                  </span>
                </div>
              </div>
            </div>

            {/* GitHub Credentials Panel */}
            <div className="p-4 border border-white/10 bg-black/40 space-y-4">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-brand-400" /> GitHub Integration Key
              </h3>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] text-white/40 uppercase block mb-1">Personal Access Token (PAT) / OAuth Token</label>
                  <input
                    type="password"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    placeholder={gitToken ? "••••••••••••••••••••" : "Paste your github_pat_... token here"}
                    className="w-full bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white placeholder-white/20 font-mono focus:outline-none focus:border-brand-400"
                  />
                  <span className="text-[9px] text-white/25 mt-1 block leading-relaxed">
                    Connecting your GitHub token allows Repo Risk Gate to sweep private repositories and pull source files securely without standard browser redirects.
                  </span>
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-between p-4 border border-white/10 bg-black/40">
              <span className="text-[10px]">
                {settingsSaved && <span className="text-matrix-emerald font-bold">✓ CONFIGURATION SAVED</span>}
                {settingsErr && <span className="text-laser-red font-bold">Error: {settingsErr}</span>}
              </span>
              <button
                onClick={saveSettings}
                disabled={settingsBusy}
                className="py-2 px-6 bg-brand-400 hover:bg-brand-500 text-black font-bold text-xs uppercase cursor-pointer transition-colors disabled:opacity-40"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Connected Services Grid */}
          <div className="lg:col-span-6">
            <div className="p-4 border border-white/10 bg-black/40 space-y-4 h-full">
              <h3 className="text-[10px] text-white/60 uppercase font-bold tracking-wider border-b border-white/5 pb-2">
                Connected Infrastructures
              </h3>
              
              <div className="space-y-2">
                <div className="p-3 bg-black/60 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center rounded">
                      <Github className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">GitHub API</div>
                      <div className="text-[9px] text-white/30">Tree analysis and source fetch</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-matrix-emerald font-bold">CONNECTED</span>
                </div>

                <div className="p-3 bg-black/60 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center rounded">
                      <Coins className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Base Mainnet</div>
                      <div className="text-[9px] text-white/30">x402 protocol settlement channel</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-matrix-emerald font-bold">CONNECTED (Chain 8453)</span>
                </div>

                <div className="p-3 bg-black/60 border border-white/5 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center rounded">
                      <Webhook className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Committee Slack Feed</div>
                      <div className="text-[9px] text-white/30">Budget limit breach alerts channel</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-white/30">UNCONFIGURED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function TreasuryPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-full flex items-center justify-center bg-[#030303] font-mono text-white/30 text-[10px] uppercase tracking-widest">
        Initializing Treasury Protocol...
      </div>
    }>
      <TreasuryContent />
    </Suspense>
  );
}
