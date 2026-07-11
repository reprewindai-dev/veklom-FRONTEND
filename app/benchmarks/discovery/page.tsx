"use client";

import React from "react";
import { useApi } from "@/hooks/useApi";

interface DiscoveryState {
  source: { discovery_app: string; byos: string };
  proof: {
    state: "verified" | "partial" | "error";
    reason: string;
    probes: Array<{
      route: string;
      state: "verified" | "needs_auth" | "needs_payment" | "error";
      status: number;
      detail?: string;
      count?: number;
      payment?: { price_usdc?: string; network?: string; asset?: string; challenge_id?: string };
    }>;
  };
  registryRows: number | null;
  paidSearch: { price_usdc?: string; network?: string; asset?: string; challenge_id?: string } | null;
}

function badgeClass(state: DiscoveryState["proof"]["probes"][number]["state"]) {
  if (state === "verified") return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
  if (state === "needs_payment") return "border-cyan-500/30 text-cyan-300 bg-cyan-500/10";
  if (state === "needs_auth") return "border-amber-500/30 text-amber-300 bg-amber-500/10";
  return "border-red-500/30 text-red-300 bg-red-500/10";
}

export default function VeklomDiscoveryPage() {
  const { data } = useApi<DiscoveryState>("/benchmarks/discovery/state", { refreshInterval: 30000 });
  const paidSearch = data?.paidSearch;

  return (
    <div className="w-full h-full bg-[#030303] overflow-hidden flex flex-col">
      <div className="shrink-0 border-b border-white/10 bg-black px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Veklom Discovery Proof State</div>
            <div className="mt-1 text-sm text-white">
              {data?.proof.reason || "Checking Discovery shell, BYOS x402 manifest, PGL registry, and cAPI routes..."}
            </div>
            <div className="mt-1 text-[10px] text-white/40 font-mono">
              PGL registry rows: {typeof data?.registryRows === "number" ? data.registryRows : "Needs proof"}
              {paidSearch?.price_usdc ? ` · Paid search: ${paidSearch.price_usdc} USDC on ${paidSearch.network || "base"}` : ""}
            </div>
          </div>
          <div className="xl:ml-auto flex flex-wrap gap-2">
            {data?.proof.probes.map((probe) => (
              <span
                key={probe.route}
                title={probe.detail || probe.route}
                className={`px-2 py-1 rounded border text-[10px] font-mono ${badgeClass(probe.state)}`}
              >
                {probe.route} · {probe.status}
              </span>
            ))}
          </div>
        </div>
      </div>
      <iframe
        src="https://veklomdiscovery.vercel.app"
        className="w-full flex-1 border-0"
        title="Veklom Discovery"
      />
    </div>
  );
}
