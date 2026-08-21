"use client";

import React from "react";
import { useApi } from "@/hooks/useApi";

interface VeklomIdState {
  source: { identity_app: string; byos: string };
  proof: {
    state: "verified" | "partial" | "error";
    reason: string;
    probes: Array<{ route: string; state: "verified" | "needs_proof" | "error"; status: number; detail?: string; count?: number }>;
  };
  registryRows: number | null;
}

export default function VeklomIdPage() {
  const { data } = useApi<VeklomIdState>("/veklom-id/state", { refreshInterval: 30000 });

  return (
    <div className="w-full h-full bg-[#030303] overflow-hidden flex flex-col">
      <div className="shrink-0 border-b border-white/10 bg-black px-4 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/40">Veklom ID Proof State</div>
            <div className="text-sm text-white mt-1">{data?.proof.reason || "Checking Veklom ID app and BYOS identity routes..."}</div>
            <div className="text-[10px] text-white/40 font-mono mt-1">
              PGL registry rows: {typeof data?.registryRows === "number" ? data.registryRows : "Needs proof"} · Source: {data?.source.identity_app || "https://id.veklom.com"}
            </div>
          </div>
          <div className="lg:ml-auto flex flex-wrap gap-2">
            {data?.proof.probes.map((probe) => (
              <span
                key={probe.route}
                title={probe.detail || probe.route}
                className={`px-2 py-1 rounded border text-[10px] font-mono ${
                  probe.state === "verified"
                    ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                    : probe.state === "needs_proof"
                      ? "border-amber-500/30 text-amber-300 bg-amber-500/10"
                      : "border-red-500/30 text-red-300 bg-red-500/10"
                }`}
              >
                {probe.route} · {probe.status}
              </span>
            ))}
          </div>
        </div>
      </div>
      <iframe 
        src="https://id.veklom.com" 
        className="w-full flex-1 border-0"
        title="Veklom ID Layer 1" 
      />
    </div>
  );
}
