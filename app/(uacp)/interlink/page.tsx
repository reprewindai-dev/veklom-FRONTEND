"use client";

import { Activity, Cable, Network, ShieldCheck } from "lucide-react";
import { useApi } from "@/hooks/useApi";

type InterlinkState = {
  live: boolean;
  proof: "VERIFIED_LIVE" | "UNVERIFIED";
  protocol?: { capabilities?: string[] } | null;
  openapi_servers: Array<{ server_id?: string }>;
  native_mcp_servers: Array<{ id?: string }>;
  total_tools: number | null;
  routes: Array<{ path: string; available: boolean }>;
};

export default function InterlinkPage() {
  const { data, error, isLoading } = useApi<InterlinkState>("/api/interlink/state", { refreshInterval: 15_000 });
  const connections = (data?.openapi_servers.length ?? 0) + (data?.native_mcp_servers.length ?? 0);
  const facts = [
    { label: "Runtime", value: data?.live ? "Live" : "Unavailable", Icon: Activity },
    { label: "Connections", value: String(connections), Icon: Network },
    { label: "Tools", value: data?.total_tools == null ? "No proof" : String(data.total_tools), Icon: Cable },
    { label: "Authority", value: "CAPPO", Icon: ShieldCheck },
  ];

  return (
    <main className="h-full overflow-y-auto bg-[#030303] p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-300/70"><Cable className="h-4 w-4" /> Capability OS / Interlink</div>
            <h1 className="text-2xl font-semibold">Governed connection surface</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/45">Live cAPI discovery and harness state, rendered natively in the workspace. Consequence authority remains with CAPPO.</p>
          </div>
          <span className={`rounded border px-3 py-1 text-[10px] font-mono ${data?.live ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-amber-400/30 bg-amber-400/10 text-amber-200"}`}>
            {isLoading ? "CHECKING" : data?.proof ?? "UNVERIFIED"}
          </span>
        </header>
        {error && <div className="rounded-lg border border-red-400/20 bg-red-500/5 p-4 text-sm text-red-200">cAPI live state is unavailable. No connection health has been inferred.</div>}
        <section className="grid gap-3 md:grid-cols-4">
          {facts.map(({ label, value, Icon }) => <div key={label} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><Icon className="mb-4 h-4 w-4 text-cyan-300/70" /><div className="text-[10px] font-mono uppercase tracking-wider text-white/35">{label}</div><div className="mt-1 text-lg font-medium">{value}</div></div>)}
        </section>
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/65">Canonical cAPI routes</h2>
            <div className="space-y-2 font-mono text-xs">{(data?.routes ?? []).map((route) => <div key={route.path} className="flex justify-between border-b border-white/5 py-2"><span className="text-white/55">{route.path}</span><span className={route.available ? "text-emerald-300" : "text-amber-200"}>{route.available ? "AVAILABLE" : "UNVERIFIED"}</span></div>)}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/65">Advertised capabilities</h2>
            <div className="flex flex-wrap gap-2">{(data?.protocol?.capabilities ?? []).map((capability) => <span key={capability} className="rounded border border-cyan-300/15 bg-cyan-300/5 px-2.5 py-1 text-xs text-cyan-100/70">{capability}</span>)}{!data?.protocol?.capabilities?.length && <span className="text-sm text-white/35">No live capabilities returned.</span>}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
