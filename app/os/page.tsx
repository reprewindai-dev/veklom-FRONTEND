"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Boxes, Clock3, Sparkles } from "lucide-react";
import { capabilities, type Capability } from "@/lib/cos/capabilities";
import { CapabilityCard } from "@/components/cos/CapabilityCard";
import { CapabilitySearch } from "@/components/cos/CapabilitySearch";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { BeaconDiscovery } from "@/components/cos/BeaconDiscovery";

export default function CapabilityHome() {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [recentIds, setRecentIds] = useState<string[]>([]);
  useEffect(() => {
    try { setRecentIds(JSON.parse(localStorage.getItem("veklom.cos.recent-capabilities") || "[]")); } catch { setRecentIds([]); }
  }, []);
  const openCapability = (capability: Capability) => {
    const next = [capability.id, ...recentIds.filter((id) => id !== capability.id)].slice(0, 6);
    setRecentIds(next);
    localStorage.setItem("veklom.cos.recent-capabilities", JSON.stringify(next));
  };
  const filtered = useMemo(() => capabilities.filter((capability) => `${capability.name} ${capability.description} ${capability.kind}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const recent = recentIds.map((id) => capabilities.find((capability) => capability.id === id)).filter(Boolean) as Capability[];
  const mounted = filtered.filter((capability) => capability.mountState === "Mounted");
  const trustSpine = [
    { name: "Identity", sub1: "Sovereign ID Verification", sub2: "Workspace Mount State" },
    { name: "Capability (cAPI)", sub1: "Action Discovery & Routing", sub2: "Contract Enveloping" },
    { name: "Govern (CAPPO)", sub1: "Jurisdiction & Context Shaping", sub2: "PII Scrubbing & Filtering" },
    { name: "Execute (BYOS)", sub1: "Sovereign Inference", sub2: "Isolated Execution" },
    { name: "Evidence (PGL)", sub1: "GnomLedger Smart Ledger", sub2: "Cryptographic Hashing" },
    { name: "Settle (x402)", sub1: "Void Compute Splitting", sub2: "Ledger Finalization" }
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cos-accent"><Sparkles size={13} />VEKLOM · MACHINE-TO-MACHINE TRUST INFRASTRUCTURE</div><h1 className="text-4xl font-semibold tracking-tight text-cos-text md:text-5xl">What do you need to do?</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-cos-muted">The trust layer machines pass through — prove identity, capability, governance, execution, evidence, and settlement.</p></div>
        <div className="flex items-center gap-2 text-xs text-cos-steel"><ProofBadge status="Present" /> <span>Catalog metadata</span></div>
      </motion.div>
      <CapabilitySearch value={query} onChange={setQuery} />
      <BeaconDiscovery />
      <div className="mt-10 rounded-2xl border border-cos-border bg-cos-surface2/55 p-6 shadow-cos-card lg:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-cos-accent">One machine action</div>
            <h2 className="mt-1 text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Veklom Trust Spine</h2>
          </div>
          <span className="font-mono text-[10px] text-cos-steel">IDENTITY → SETTLEMENT</span>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-2">
          {trustSpine.map((stage, index) => (
            <div key={stage.name} className="flex flex-col lg:flex-row items-center flex-1">
              <div className="flex flex-col gap-3 rounded-lg border border-cos-border bg-cos-bg/50 p-4 w-full h-full relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cos-unknown shadow-[0_0_10px_rgba(107,114,128,0.7)]" />
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">{index + 1}. {stage.name}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-cos-muted">{stage.sub1}</span>
                  <span className="text-xs text-cos-muted">{stage.sub2}</span>
                </div>
                <div className="mt-2">
                  <ProofBadge status="Needs proof" />
                </div>
              </div>
              {index < trustSpine.length - 1 && (
                <div className="hidden lg:flex items-center justify-center w-6 shrink-0 mx-2">
                  <ArrowUpRight className="text-cos-accent/50 rotate-45" size={16} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Clock3 size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Recently used</h2></div><span className="font-mono text-[10px] text-cos-steel">LOCAL HISTORY</span></div>{recent.length ? <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.05 } } }} className="grid gap-4 md:grid-cols-3">{recent.map((capability) => <motion.div key={capability.id} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}><CapabilityCard capability={capability} onOpen={openCapability} /></motion.div>)}</motion.div> : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">Your recently used capabilities will appear here.</div>}</div>
      <div className="mt-12"><div className="mb-4 flex items-center gap-2"><Boxes size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Mounted capabilities</h2></div>{mounted.length ? <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } } }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{mounted.map((capability) => <motion.div key={capability.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><CapabilityCard capability={capability} onOpen={openCapability} /></motion.div>)}</motion.div> : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">No mounted capabilities match this search.</div>}</div>
      <div className="mt-12"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Capability catalog</h2><span className="font-mono text-[10px] text-cos-steel">{filtered.length} entries</span></div><motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.035 } } }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((capability) => <motion.div key={capability.id} variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><CapabilityCard capability={capability} onOpen={openCapability} /></motion.div>)}</motion.div></div>
      <div className="mt-10 flex items-center gap-2 border-t border-cos-border pt-5 font-mono text-[10px] text-cos-steel"><ArrowUpRight size={13} className="text-cos-accent" />Backend routes are shown on capability detail surfaces; no route response is treated as proof here.</div>
    </section>
  );
}
