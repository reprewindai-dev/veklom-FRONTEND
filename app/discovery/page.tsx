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
  const { data } = useApi<DiscoveryState>("/discovery/state", { refreshInterval: 30000 });
  const paidSearch = data?.paidSearch;
  const proofState = data?.proof.state || "partial";

  return (
    <div className="relative w-full h-full bg-[#030303] overflow-hidden">
      <iframe
        src="https://discovery.veklom.com"
        className="absolute inset-0 h-full w-full border-0"
        title="Veklom Discovery"
      />
      <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex justify-end">
        <div className="pointer-events-auto max-w-[720px] rounded border border-white/10 bg-black/90 px-3 py-2 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-1 text-[10px] font-mono uppercase ${
                proofState === "verified"
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : proofState === "error"
                    ? "border-red-500/30 text-red-300 bg-red-500/10"
                    : "border-amber-500/30 text-amber-300 bg-amber-500/10"
              }`}
            >
              Discovery Proof: {proofState}
            </span>
            <span className="text-[10px] text-white/60 font-mono">
              PGL {typeof data?.registryRows === "number" ? data.registryRows : "needs proof"}
              {paidSearch?.price_usdc ? ` · x402 ${paidSearch.price_usdc} USDC` : ""}
            </span>
          </div>
          <div className="mt-2 max-h-16 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-1">
              {data?.proof.probes.map((probe) => (
                <span
                  key={probe.route}
                  title={probe.detail || probe.route}
                  className={`px-1.5 py-0.5 rounded border text-[9px] font-mono ${badgeClass(probe.state)}`}
                >
                  {probe.route} · {probe.status}
                </span>
              ))}
              {!data && (
                <span className="px-1.5 py-0.5 rounded border border-white/15 text-[9px] font-mono text-white/50">
                  checking live proof...
                </span>
              )}
            </div>
          </div>
          {data?.proof.reason && (
            <div className="mt-1 text-[9px] text-white/45 font-mono">
              {data.proof.reason}
            </div>
          )}
          <div className="mt-2 flex justify-end">
            <a
              href="https://discovery.veklom.com"
              target="_blank"
              rel="noreferrer"
              className="text-[9px] font-mono uppercase text-cyan-300 underline-offset-2 hover:underline"
            >
              Open Discovery App
            </a>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-4 z-10">
        <div className="rounded border border-white/10 bg-black/80 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-white/45">
          Live Discovery App
        </div>
      </div>
    </div>
  );
}
