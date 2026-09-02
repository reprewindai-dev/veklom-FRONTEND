"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RuntimeService = {
  id: string;
  label: string;
  role: string;
  endpoint: string;
  reachable: boolean;
  healthy: boolean;
  status: number | null;
  latencyMs: number;
  payload?: unknown;
  error?: string;
};

type RuntimeProof = {
  source: string;
  synthetic: boolean;
  observedAt: string;
  summary: { healthy: number; total: number; state: string };
  services: RuntimeService[];
};

const machineRoutes = [
  ["/machine/claims.json", "claims.json", "Claim registry"],
  ["/machine/conformance.json", "conformance.json", "Conformance matrix"],
  ["/machine/evidence-index.json", "evidence-index.json", "Evidence index"],
  ["/machine/openapi.json", "openapi.json", "Machine OpenAPI"],
  ["/mcp/manifest.json", "mcp/manifest.json", "MCP manifest"],
  ["/mcp/tools.json", "mcp/tools.json", "MCP tool registry"],
  ["/llms.txt", "llms.txt", "Machine-readable orientation"],
];

function tone(healthy: boolean) {
  return healthy ? "text-theme-verified" : "text-theme-danger";
}

export function MachineSurface() {
  const [data, setData] = useState<RuntimeProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch("/api/proof/live", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as RuntimeProof;
      setData(payload);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "runtime_probe_failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, []);

  const observed = useMemo(() => {
    if (!data?.observedAt) return "—";
    try { return new Date(data.observedAt).toISOString(); }
    catch { return data.observedAt; }
  }, [data?.observedAt]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-theme-border bg-theme-surface p-6 sm:p-8 md:p-10">
        <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_80%_0%,rgb(var(--theme-accent)/.12),transparent_30%)]" aria-hidden="true" />
        <div className="relative grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.24em] text-theme-inkDim">Machine protocol / live runtime</div>
            <h1 className="mt-5 max-w-3xl font-sans text-4xl font-semibold leading-[.94] tracking-[-.055em] text-theme-ink sm:text-5xl md:text-7xl">Read the system without the marketing layer.</h1>
            <p className="mt-6 max-w-2xl font-sans text-sm leading-7 text-theme-inkDim md:text-base">This surface observes declared runtime planes directly and links to the raw machine-readable registries. No static ONLINE badge is emitted when the backend cannot prove it.</p>
            <p className="mt-6 max-w-2xl font-sans text-sm leading-7 text-theme-inkDim md:text-base">You are reading this as a machine would receive it. Resolve a capability, get scoped authority, execute, produce evidence, settle. Nothing here runs past its granted scope. That is enforced, not promised.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-theme-border bg-theme-bg p-4">
              <div className="text-[9px] uppercase tracking-[.2em] text-theme-inkDim">Source</div>
              <div className="mt-3 text-xs font-semibold text-theme-ink">{data?.source || (loading ? "PROBING" : "UNAVAILABLE")}</div>
            </div>
            <div className="rounded-2xl border border-theme-border bg-theme-bg p-4">
              <div className="text-[9px] uppercase tracking-[.2em] text-theme-inkDim">Observed</div>
              <div className="mt-3 break-all text-[10px] text-theme-ink">{observed}</div>
            </div>
            <div className="rounded-2xl border border-theme-border bg-theme-bg p-4">
              <div className="text-[9px] uppercase tracking-[.2em] text-theme-inkDim">Synthetic</div>
              <div className="mt-3 text-xs font-semibold text-theme-ink">{data ? String(data.synthetic) : "—"}</div>
            </div>
          </div>
        </div>
      </section>

      {error && !data ? (
        <section className="rounded-[24px] border border-theme-danger/20 bg-theme-danger/5 p-5 text-sm text-theme-danger">runtime_probe_error: {error}</section>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-theme-border bg-theme-surface">
        <div className="flex flex-col gap-3 border-b border-theme-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Core runtime planes</div>
            <div className="mt-2 font-sans text-2xl font-semibold tracking-[-.035em] text-theme-ink">BYOS and LockerPhycer sit at the center of execution.</div>
          </div>
          <button onClick={refresh} className="w-fit rounded-full border border-theme-border bg-theme-bg px-4 py-2 text-[9px] font-semibold uppercase tracking-[.18em] text-theme-inkDim transition hover:text-theme-ink">refresh probes</button>
        </div>

        <div className="grid gap-px bg-theme-border lg:grid-cols-5">
          {data?.services?.map((service) => (
            <article key={service.id} className="min-h-[270px] bg-theme-bg p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="text-[9px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">{service.id}</div>
                <span className={`h-2.5 w-2.5 rounded-full ${service.healthy ? "bg-theme-verified shadow-[0_0_0_6px_rgb(var(--theme-verified)/.07)]" : "bg-theme-danger shadow-[0_0_0_6px_rgb(var(--theme-danger)/.07)]"}`} />
              </div>
              <h2 className="mt-6 font-sans text-xl font-semibold tracking-[-.035em] text-theme-ink">{service.label}</h2>
              <p className="mt-3 font-sans text-xs leading-5 text-theme-inkDim">{service.role}</p>
              <dl className="mt-8 grid grid-cols-2 gap-3 border-t border-theme-border pt-4 text-[9px]">
                <div><dt className="uppercase tracking-[.18em] text-theme-inkDim">HTTP</dt><dd className={`mt-2 text-xs font-semibold ${tone(service.healthy)}`}>{service.status ?? "—"}</dd></div>
                <div><dt className="uppercase tracking-[.18em] text-theme-inkDim">Latency</dt><dd className="mt-2 text-xs font-semibold text-theme-ink">{service.latencyMs}ms</dd></div>
              </dl>
            </article>
          )) || (
            <div className="col-span-full grid min-h-56 place-items-center bg-theme-bg text-[10px] uppercase tracking-[.18em] text-theme-inkDim">{loading ? "probing runtime…" : "no runtime observation"}</div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-[28px] border border-theme-border bg-[#050708] p-6 text-white sm:p-8">
          <div className="text-[9px] font-semibold uppercase tracking-[.22em] text-white/40">Execution topology</div>
          <div className="mt-7 space-y-3">
            {[
              ["intent", "Need / machine request"],
              ["byos", "BYOS Runtime · workspace + execution substrate"],
              ["locker", "LockerPhycer · host execution boundary"],
              ["cappo", "CAPPO · consequence authorization"],
              ["capi", "cAPI / VLink · connection and transport"],
              ["pgl", "Gnomledger / PGL · evidence + provenance"],
            ].map(([id, text], index, all) => (
              <React.Fragment key={id}>
                <div className="grid grid-cols-[36px_1fr] items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-[9px] text-white/40">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-[11px] text-white/72">{text}</span>
                </div>
                {index < all.length - 1 && <div className="ml-[17px] h-3 border-l border-dashed border-white/15" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-theme-border bg-theme-surface p-6 sm:p-8">
          <div className="text-[9px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Machine-readable surfaces</div>
          <div className="mt-6 grid gap-2">
            {machineRoutes.map(([href, label, desc]) => (
              <Link key={href} href={href} className="group grid min-h-14 grid-cols-[1fr_auto] items-center gap-4 rounded-2xl border border-theme-border bg-theme-bg px-4 transition hover:border-theme-ink/18 hover:bg-theme-surface2">
                <div>
                  <div className="text-[10px] font-semibold text-theme-ink">/{label}</div>
                  <div className="mt-1 font-sans text-[11px] text-theme-inkDim">{desc}</div>
                </div>
                <span className="text-theme-inkDim transition group-hover:translate-x-1 group-hover:text-theme-ink">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-theme-border bg-theme-surface p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Truth boundary</div>
            <h2 className="mt-5 font-sans text-3xl font-semibold leading-[1.02] tracking-[-.045em] text-theme-ink">Reachability is not consequence proof.</h2>
          </div>
          <div className="grid gap-3 font-sans text-sm leading-7 text-theme-inkDim sm:grid-cols-2">
            <p className="rounded-2xl border border-theme-border bg-theme-bg p-5">A health response proves that a declared surface answered within the probe window. It does not prove that CAPPO granted a specific consequence.</p>
            <p className="rounded-2xl border border-theme-border bg-theme-bg p-5">For real execution proof, use the live Activation path inside Capability OS, where denial, allowed execution and persisted evidence come from backend-issued state.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
