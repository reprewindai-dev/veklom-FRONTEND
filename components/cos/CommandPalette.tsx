"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Command, Search } from "lucide-react";
import { capabilities } from "@/lib/cos/capabilities";
import { navGroups } from "@/lib/cos/nav";
import { capabilityHref, withCapability } from "@/lib/cos/capability-context";

/** "Jump to a capability or workspace": workspaces in navigation order, then capabilities, each opening in its own workspace. */
export function CommandPalette({ open, onClose, onTerminal, capabilityId }: { open: boolean; onClose: () => void; onTerminal: () => void; capabilityId?: string | null }) {
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();
  useEffect(() => { if (!open) setQuery(""); }, [open]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); }
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  const term = query.toLowerCase();
  const workspaces = navGroups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
    .filter((item) => item.label.toLowerCase().includes(term));
  const filteredCapabilities = capabilities.filter((item) => (
    item.name.toLowerCase().includes(term) || item.lifecycleStage.toLowerCase().includes(term)
  ));
  const rowClass = "flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm text-cos-text hover:bg-cos-surface2";
  return (
    <AnimatePresence>
      {open && <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-cos-bg/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: -14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cos-border bg-cos-surface shadow-cos-glow" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-cos-border px-5 py-4"><Search size={18} className="text-cos-accent" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a capability or workspace" className="flex-1 bg-transparent text-cos-text outline-none placeholder:text-cos-muted" /><kbd className="font-mono text-xs text-cos-steel">ESC</kbd></div>
        <div className="max-h-[55vh] overflow-y-auto p-3">
          <div className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-cos-steel">Workspaces</div>
          {workspaces.map((item) => item.action === "terminal" ? (
            <button key={item.id} type="button" onClick={() => { onClose(); onTerminal(); }} className={rowClass}><span className="flex items-center gap-3"><Command size={14} className="text-cos-accent" />{item.label}</span><span className="font-mono text-[10px] text-cos-steel">{item.hint}</span></button>
          ) : (
            <Link key={item.id} href={withCapability(item.route ?? "/os", capabilityId)} onClick={onClose} className={rowClass}><span className="flex items-center gap-3"><Command size={14} className="text-cos-accent" />{item.label}</span><span className="flex items-center gap-2 font-mono text-[10px] text-cos-steel">{item.group}<ArrowRight size={14} /></span></Link>
          ))}
          <div className="mt-3 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-cos-steel">Capabilities</div>
          {filteredCapabilities.map((item) => <Link key={item.id} href={capabilityHref(item)} onClick={onClose} className={rowClass}><span>{item.name}</span><span className="font-mono text-[10px] text-cos-steel">opens in {item.lifecycleStage}</span></Link>)}
        </div>
      </motion.div>
      </motion.div>}
    </AnimatePresence>
  );
}
