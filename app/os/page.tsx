"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Boxes, Clock3, Sparkles } from "lucide-react";
import { capabilities, type Capability } from "@/lib/cos/capabilities";
import { CapabilityCard } from "@/components/cos/CapabilityCard";
import { CapabilitySearch } from "@/components/cos/CapabilitySearch";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { BeaconDiscovery } from "@/components/cos/BeaconDiscovery";
import { ConsequenceRing } from "@/components/cos/ConsequenceRing";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";

export default function CapabilityHome() {
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [pulse, setPulse] = useState<any>(null);
  const [pulseError, setPulseError] = useState<string | null>(null);
  const [holdingAuthority, setHoldingAuthority] = useState(0);

  useEffect(() => {
    setHoldingAuthority(readSessionCapabilityLease() ? 1 : 0);
  }, []);

  useEffect(() => {
    try {
      setRecentIds(JSON.parse(localStorage.getItem("veklom.cos.recent-capabilities") || "[]"));
    } catch {
      setRecentIds([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    import("@/lib/api").then(({ api }) => {
      if (cancelled) return;

      const fetchPulse = async () => {
        if (cancelled) return;
        try {
          const nextPulse = await api.get("/api/v1/platform/pulse");
          if (cancelled) return;
          setPulse(nextPulse);
          setPulseError(null);
        } catch (error) {
          if (cancelled) return;
          setPulse(null);
          setPulseError(error instanceof Error ? error.message : "Platform pulse unavailable");
        }
      };

      void fetchPulse();
      if (cancelled) return;
      timer = setInterval(fetchPulse, 15000);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  const openCapability = (capability: Capability) => {
    const next = [capability.id, ...recentIds.filter((id) => id !== capability.id)].slice(0, 6);
    setRecentIds(next);
    localStorage.setItem("veklom.cos.recent-capabilities", JSON.stringify(next));
  };

  const filtered = useMemo(
    () => capabilities.filter((capability) => `${capability.name} ${capability.description} ${capability.kind}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  const recent = recentIds.map((id) => capabilities.find((capability) => capability.id === id)).filter(Boolean) as Capability[];
  const mounted = filtered.filter((capability) => capability.mountState === "Mounted");

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"
      >
        <div>
          <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cos-accent">
            <Sparkles size={13} />VEKLOM · CONSEQUENCE AUTHORITY INFRASTRUCTURE
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-cos-text md:text-5xl">What do you need to do?</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cos-muted">
            Discover capabilities, compose work, request bounded authority, execute, and preserve evidence without confusing presence with proof.
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cos-steel">
          {capabilities.length} in catalog · {capabilities.filter((capability) => capability.mountState === "Mounted").length} mounted ·{" "}
          <span className={holdingAuthority ? "text-cos-warn" : undefined}>{holdingAuthority} holding authority</span>
        </p>
      </motion.div>

      <ConsequenceRing subject="What this workspace can currently prove" />

      <CapabilitySearch value={query} onChange={setQuery} />
      <BeaconDiscovery />

      {pulse ? (
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-xl border border-cos-border bg-cos-surface2/55 p-5">
            <span className="mb-2 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cos-steel">
              <span className="h-1.5 w-1.5 rounded-full bg-cos-info" />Global Latency
            </span>
            <span className="text-3xl font-semibold text-cos-text">{pulse.latency_ms ?? pulse.latency ?? "—"} <span className="text-sm text-cos-muted">ms</span></span>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-cos-border bg-cos-surface2/55 p-5">
            <span className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cos-steel">Throughput</span>
            <span className="text-3xl font-semibold text-cos-text">{pulse.throughput_req_sec ?? pulse.throughput ?? "—"} <span className="text-sm text-cos-muted">req/s</span></span>
          </div>
          <div className="flex flex-col justify-between rounded-xl border border-cos-border bg-cos-surface2/55 p-5">
            <span className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cos-steel">Error Rate</span>
            <span className="text-3xl font-semibold text-cos-text">{pulse.error_rate_pct ?? pulse.error_rate ?? "—"} <span className="text-sm text-cos-muted">%</span></span>
          </div>
        </div>
      ) : pulseError ? (
        <div className="mt-10 rounded-xl border border-cos-warn/30 bg-cos-warn/5 p-5">
          <div className="flex items-center gap-2"><ProofBadge status="Degraded" /><span className="text-sm font-medium text-cos-text">Platform pulse unavailable</span></div>
          <p className="mt-2 text-xs leading-5 text-cos-muted">{pulseError}. No telemetry values are being synthesized.</p>
        </div>
      ) : (
        <div className="mt-10 rounded-xl border border-cos-border bg-cos-surface2/40 p-5">
          <div className="flex items-center gap-2"><ProofBadge status="Needs proof" /><span className="text-sm text-cos-muted">Loading platform pulse.</span></div>
        </div>
      )}

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Clock3 size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Recently used</h2></div>
          <span className="font-mono text-[10px] text-cos-steel">LOCAL HISTORY</span>
        </div>
        {recent.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {recent.map((capability) => <div key={capability.id}><CapabilityCard capability={capability} onOpen={openCapability} /></div>)}
          </div>
        ) : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">Your recently used capabilities will appear here.</div>}
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2"><Boxes size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Mounted capabilities</h2></div>
        {mounted.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mounted.map((capability) => <div key={capability.id}><CapabilityCard capability={capability} onOpen={openCapability} /></div>)}
          </div>
        ) : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">No mounted capabilities match this search.</div>}
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Capability catalog</h2><span className="font-mono text-[10px] text-cos-steel">{filtered.length} entries</span></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((capability) => <div key={capability.id}><CapabilityCard capability={capability} onOpen={openCapability} /></div>)}
        </div>
      </div>

      <div className="mt-10 flex items-center gap-2 border-t border-cos-border pt-5 font-mono text-[10px] text-cos-steel">
        <ArrowUpRight size={13} className="text-cos-accent" />Backend routes are shown on capability detail surfaces; no route response is treated as proof here.
      </div>
    </section>
  );
}
