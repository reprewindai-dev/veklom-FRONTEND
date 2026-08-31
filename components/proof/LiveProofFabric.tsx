"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Service = {
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

type LiveProof = {
  source: string;
  synthetic: boolean;
  observedAt: string;
  summary: { healthy: number; total: number; state: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" };
  services: Service[];
};

function stateTone(state: string) {
  if (state === "HEALTHY") return "text-theme-verified";
  if (state === "DEGRADED") return "text-theme-warn";
  return "text-theme-danger";
}

export function LiveProofFabric({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<LiveProof | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const response = await fetch("/api/proof/live", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = (await response.json()) as LiveProof;
      setData(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reach proof fabric");
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
    try { return new Date(data.observedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }); }
    catch { return data.observedAt; }
  }, [data?.observedAt]);

  return (
    <section id="live" className="relative overflow-hidden rounded-[28px] border border-theme-border bg-theme-surface shadow-[0_35px_100px_rgba(2,8,23,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgb(var(--theme-accent)/0.10),transparent_38%)]" aria-hidden="true" />
      <div className="relative border-b border-theme-border px-5 py-4 sm:px-7 sm:py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-theme-inkDim">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-theme-accent opacity-30" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-theme-accent" />
              </span>
              Direct runtime observation
            </div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-theme-ink sm:text-2xl">Live Veklom fabric</h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-theme-inkDim">
            <span>Observed {observed}</span>
            <button onClick={refresh} className="rounded-full border border-theme-border bg-theme-bg px-3 py-1.5 font-medium text-theme-ink transition hover:border-theme-ink/25">Refresh</button>
          </div>
        </div>
      </div>

      <div className={`relative ${compact ? "p-5 sm:p-7" : "p-5 sm:p-7 md:p-9"}`}>
        {loading && !data ? (
          <div className="grid min-h-48 place-items-center text-sm text-theme-inkDim">Contacting real Veklom endpoints…</div>
        ) : error && !data ? (
          <div className="rounded-2xl border border-theme-danger/20 bg-theme-danger/5 p-5 text-sm text-theme-danger">Live proof fabric unavailable: {error}</div>
        ) : data ? (
          <>
            <div className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className={`text-4xl font-semibold tracking-[-0.05em] ${stateTone(data.summary.state)}`}>{data.summary.state}</div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-theme-inkDim">{data.summary.healthy} of {data.summary.total} core runtime probes returned healthy at this observation. BYOS and LockerPhycer are treated as primary Veklom planes, not supporting footnotes.</p>
              </div>
              <div className="rounded-full border border-theme-border bg-theme-bg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-theme-inkDim">Source · {data.source.replaceAll("_", " ")}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {data.services.map((service) => (
                <div key={service.id} className="group relative min-h-56 overflow-hidden rounded-2xl border border-theme-border bg-theme-bg p-5 transition duration-300 hover:-translate-y-0.5 hover:border-theme-ink/15 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-inkDim">{service.id}</div>
                      <div className="mt-2 text-lg font-semibold tracking-[-0.02em] text-theme-ink">{service.label}</div>
                    </div>
                    <span className={`mt-1 h-2.5 w-2.5 rounded-full ${service.healthy ? "bg-theme-verified shadow-[0_0_0_6px_rgb(var(--theme-verified)/0.08)]" : "bg-theme-danger shadow-[0_0_0_6px_rgb(var(--theme-danger)/0.08)]"}`} />
                  </div>
                  <p className="mt-4 text-xs leading-5 text-theme-inkDim">{service.role}</p>
                  <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-theme-inkDim">HTTP</div>
                      <div className="mt-1 font-mono text-sm text-theme-ink">{service.status ?? "—"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-theme-inkDim">Latency</div>
                      <div className="mt-1 font-mono text-sm text-theme-ink">{service.latencyMs} ms</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!compact && (
              <div className="mt-7 flex flex-col gap-4 border-t border-theme-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-2xl text-xs leading-5 text-theme-inkDim">Health is evidence of reachability and service response only. It is not a substitute for consequence-level authorization/evidence proof. Real governed execution happens inside Capability OS under authenticated authority.</p>
                <Link href="/login?returnTo=/os" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-theme-ink px-5 text-sm font-semibold text-theme-bg transition hover:-translate-y-0.5">Enter Capability OS →</Link>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
