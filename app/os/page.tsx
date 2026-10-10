"use client";

import { useEffect, useMemo, useState } from "react";
import { BeaconDiscovery } from "@/components/cos/BeaconDiscovery";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Boxes, Clock3, Sparkles } from "lucide-react";
import { capabilities, type Capability } from "@/lib/cos/capabilities";
import { CapabilityCard } from "@/components/cos/CapabilityCard";
import { CapabilitySearch } from "@/components/cos/CapabilitySearch";
import { ConsequenceRing } from "@/components/cos/ConsequenceRing";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";
import { SandboxScenarios } from "@/components/cos/SandboxScenarios";
import { GettingStarted } from "@/components/cos/GettingStarted";
import { environmentStorageSuffix, SANDBOX_COPY, useSandboxMode } from "@/lib/cos/sandbox";

export default function CapabilityHome() {
  const reduceMotion = useReducedMotion();
  const sandbox = useSandboxMode();
  const recentKey = `veklom.cos.recent-capabilities${environmentStorageSuffix(sandbox)}`;
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [holdingAuthority, setHoldingAuthority] = useState(0);

  useEffect(() => {
    try {
      setRecentIds(JSON.parse(localStorage.getItem(recentKey) || "[]"));
    } catch {
      setRecentIds([]);
    }
    setHoldingAuthority(readSessionCapabilityLease() ? 1 : 0);
  }, [recentKey]);

  const openCapability = (capability: Capability) => {
    const next = [capability.id, ...recentIds.filter((id) => id !== capability.id)].slice(0, 6);
    setRecentIds(next);
    try {
      localStorage.setItem(recentKey, JSON.stringify(next));
    } catch {
      // Storage may be unavailable in a restricted browser context.
    }
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
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
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
          {capabilities.length} in catalog ·{" "}
          <span className={holdingAuthority ? "text-cos-warn" : undefined} title="Grant held by this browser session in this environment">{holdingAuthority} holding authority ({sandbox ? "sandbox" : "live"})</span>
        </p>
      </motion.div>

      <GettingStarted />

      <ConsequenceRing subject="What this workspace can currently prove" />

      <CapabilitySearch value={query} onChange={setQuery} />
      {sandbox ? (
        <div data-testid="sandbox-strip" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-cos-warn/40 bg-cos-warn/[0.08] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-warn">
          {SANDBOX_COPY.strip.map((item, index) => (
            <span key={item} className="flex items-center gap-3">{index > 0 ? <span aria-hidden="true">|</span> : null}{item}</span>
          ))}
        </div>
      ) : null}
      <SandboxScenarios />
      <BeaconDiscovery />

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Clock3 size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Recently used</h2></div>
          <span className="font-mono text-[10px] text-cos-steel">LOCAL HISTORY</span>
        </div>
        {recent.length ? (
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.05 } } }} className="grid gap-4 md:grid-cols-3">
            {recent.map((capability) => <motion.div key={capability.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}><CapabilityCard capability={capability} onOpen={openCapability} /></motion.div>)}
          </motion.div>
        ) : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">Your recently used capabilities will appear here.</div>}
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center gap-2"><Boxes size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">{sandbox ? "Sandbox capabilities" : "Mounted capabilities"}</h2></div>
        {sandbox ? null : <p className="-mt-2 mb-4 text-xs leading-5 text-cos-steel">Installed in this workspace. Mounting a capability grants no authority: authority is requested per operation and decided by Veklom's authority layer.</p>}
        {mounted.length ? (
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {mounted.map((capability) => <motion.div key={capability.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><CapabilityCard capability={capability} onOpen={openCapability} /></motion.div>)}
          </motion.div>
        ) : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">No mounted capabilities match this search.</div>}
      </div>

      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Capability catalog</h2><span className="font-mono text-[10px] text-cos-steel">{filtered.length} entries</span></div>
        <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.035 } } }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((capability) => <motion.div key={capability.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><CapabilityCard capability={capability} onOpen={openCapability} /></motion.div>)}
        </motion.div>
      </div>

      <div className="mt-10 flex items-center gap-2 border-t border-cos-border pt-5 font-mono text-[10px] text-cos-steel">
        <ArrowUpRight size={13} className="text-cos-accent" />Backend routes are shown on capability detail surfaces; no route response is treated as proof here.
      </div>
    </section>
  );
}
