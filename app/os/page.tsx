"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Boxes, Clock3, Sparkles } from "lucide-react";
import { capabilities, type Capability } from "@/lib/cos/capabilities";
import { CapabilityCard } from "@/components/cos/CapabilityCard";
import { CapabilitySearch } from "@/components/cos/CapabilitySearch";
import { ProofBadge } from "@/components/cos/ProofBadge";

export default function CapabilityHome() {
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
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 lg:px-10 lg:py-12">
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.25em] text-cos-accent"><Sparkles size={13} />Capability home</div><h1 className="text-4xl font-semibold tracking-tight text-cos-text md:text-5xl">What do you need to do?</h1><p className="mt-3 max-w-xl text-sm leading-6 text-cos-muted">Search, mount, govern, and prove the capabilities that move work through the runtime.</p></div><div className="flex items-center gap-2 text-xs text-cos-steel"><ProofBadge status="Present" /> <span>Catalog metadata</span></div></div>
      <CapabilitySearch value={query} onChange={setQuery} />
      <div className="mt-12"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><Clock3 size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Recently used</h2></div><span className="font-mono text-[10px] text-cos-steel">LOCAL HISTORY</span></div>{recent.length ? <div className="grid gap-4 md:grid-cols-3">{recent.map((capability) => <CapabilityCard key={capability.id} capability={capability} onOpen={openCapability} />)}</div> : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">Your recently used capabilities will appear here.</div>}</div>
      <div className="mt-12"><div className="mb-4 flex items-center gap-2"><Boxes size={16} className="text-cos-accent" /><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Mounted capabilities</h2></div>{mounted.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{mounted.map((capability) => <CapabilityCard key={capability.id} capability={capability} onOpen={openCapability} />)}</div> : <div className="rounded-xl border border-dashed border-cos-border bg-cos-surface2/60 px-5 py-8 text-sm text-cos-muted">No mounted capabilities match this search.</div>}</div>
      <div className="mt-12"><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-medium uppercase tracking-[0.16em] text-cos-text">Capability catalog</h2><span className="font-mono text-[10px] text-cos-steel">{filtered.length} entries</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((capability) => <CapabilityCard key={capability.id} capability={capability} onOpen={openCapability} />)}</div></div>
      <div className="mt-10 flex items-center gap-2 border-t border-cos-border pt-5 font-mono text-[10px] text-cos-steel"><ArrowUpRight size={13} className="text-cos-accent" />Backend routes are shown on capability detail surfaces; no route response is treated as proof here.</div>
    </section>
  );
}
