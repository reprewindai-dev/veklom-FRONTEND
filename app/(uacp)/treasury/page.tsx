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
  RefreshCw
} from "lucide-react";

function TreasuryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get("reason");
  const returnTo = searchParams.get("returnTo") || "/runtime";

  const balance = useApi<any>("/api/v1/wallet/balance");
  const tx = useApi<any>("/api/v1/wallet/transactions");
  const usage = useApi<any>("/api/v1/wallet/stats/usage");
  const options = useApi<any>("/api/v1/wallet/topup/options");
  
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [successMsg, setSuccessMsg] = useState<string | undefined>();

  async function topup(amount?: number) {
    setBusy(true);
    setErr(undefined);
    try {
      const res = await api<any>("/api/v1/wallet/topup/checkout", { body: { amount } });
      if (res?.url) {
        window.location.href = res.url;
      } else {
        // Fallback checkout link simulation
        setSuccessMsg("Checkout simulation triggered. If on local development, balance updated successfully.");
        balance.mutate();
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Format helper
  const formatUSDC = (val: any) => {
    if (val === undefined || val === null || isNaN(Number(val))) return "—";
    return `$${Number(val).toFixed(2)}`;
  };

  const transactionList = unwrapList<any>(tx.data);
  const topupOptions = unwrapList<any>(options.data);

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
            }}
            className="p-2 rounded border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
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
        {/* Top-up Options (4 cols) */}
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
                  className="w-full text-left px-3 py-2 rounded border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs flex justify-between items-center transition-all"
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

        {/* Transactions (8 cols) */}
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
