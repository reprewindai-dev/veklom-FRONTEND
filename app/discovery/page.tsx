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
  const discoveryUrl = data?.source.discovery_app || "https://discovery.veklom.com";
  const originProbe = data?.proof.probes.find((probe) => probe.route.startsWith("https://"));
  const originDown = originProbe?.state === "error";

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#030303]">
      <iframe
        src={discoveryUrl}
        className="absolute inset-0 h-full w-full border-0"
        title="Veklom Discovery"
      />

      <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex justify-end">
        <div className="pointer-events-auto max-w-[720px] rounded border border-white/10 bg-black/90 px-3 py-2 shadow-2xl backdrop-blur">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded border px-2 py-1 text-[10px] font-mono uppercase ${
                proofState === "verified"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : proofState === "error"
                    ? "border-red-500/30 bg-red-500/10 text-red-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-300"
              }`}
            >
              Discovery Proof: {proofState}
            </span>
            <span className="text-[10px] font-mono text-white/60">
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
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-mono ${badgeClass(probe.state)}`}
                >
                  {probe.route} · {probe.status}
                </span>
              ))}
              {!data && (
                <span className="rounded border border-white/15 px-1.5 py-0.5 text-[9px] font-mono text-white/50">
                  checking live proof...
                </span>
              )}
            </div>
          </div>
          {data?.proof.reason && <div className="mt-1 text-[9px] font-mono text-white/45">{data.proof.reason}</div>}
        </div>
      </div>

      {originDown && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/70 px-5">
          <div className="max-w-lg border border-red-500/25 bg-black/90 p-5 text-center shadow-2xl">
            <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-red-300">Discovery Origin Down</div>
            <h1 className="mt-2 text-xl font-black uppercase tracking-wide text-white">Game service is not serving yet</h1>
            <p className="mt-3 text-sm leading-6 text-white/60">
              The control plane is pointed at the real Discovery game origin, but that origin is returning {originProbe?.status || "an error"}.
              Gameplay remains locked until the Discovery service is redeployed and returns live game routes.
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-4 z-10">
        <div className="rounded border border-white/10 bg-black/80 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-white/45">
          Live Discovery Game
        </div>
      </div>
    </div>
  );
}
