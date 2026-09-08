"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Boxes, Clock3, Sparkles } from "lucide-react";
import { capabilities, type Capability } from "@/lib/cos/capabilities";
import { CapabilityCard } from "@/components/cos/CapabilityCard";
import { CapabilitySearch } from "@/components/cos/CapabilitySearch";
import { BeaconDiscovery } from "@/components/cos/BeaconDiscovery";
import { ConsequenceRing } from "@/components/cos/ConsequenceRing";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";

export default function CapabilityHome() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [holdingAuthority, setHoldingAuthority] = useState(0);

  useEffect(() => {
    try {
      setRecentIds(JSON.parse(localStorage.getItem("veklom.cos.recent-capabilities") || "[]"));
    } catch {
      setRecentIds([]);
    }
    setHoldingAuthority(readSessionCapabilityLease() ? 1 : 0);
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
          {capabilities.length} in catalog · {capabilities.filter((capability) => capability.mountState === "Mounted").length} mounted ·{" "}
          <span className={holdingAuthority ? "text-cos-warn" : undefined}>{holdingAuthority} holding authority</span>
        </p>
      </motion.div>

      <ConsequenceRing subject="What this workspace can currently prove" />

      <CapabilitySearch value={query} onChange={setQuery} />
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
        <div className="mb-4 flex items-center gap-2"><Boxes size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Mounted capabilities</h2></div>
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
