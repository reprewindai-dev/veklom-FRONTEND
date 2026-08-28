"use client";

import { useEffect, useState } from"react";
import Link from"next/link";
import { AnimatePresence, motion, useReducedMotion } from"framer-motion";
import { ArrowRight, Command, Search } from"lucide-react";
import { capabilities } from"@/lib/cos/capabilities";

const links = [
 ["Capabilities","/os"], ["Mount","/os/mount"], ["Blueprint","/os/blueprint"], ["Govern","/os/govern"],
 ["Execute","/os/execute"], ["Evidence","/os/evidence"], ["Measure","/os/measure"], ["Settle","/os/settle"],
 ["Authority","/os/authority"], ["Tracker","/os/tracker"],
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
 const [query, setQuery] = useState("");
 const reduceMotion = useReducedMotion();
 useEffect(() => { if (!open) setQuery(""); }, [open]);
 useEffect(() => {
 const handler = (event: KeyboardEvent) => {
 if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() ==="k") { event.preventDefault(); }
 if (event.key ==="Escape") onClose();
 };
 window.addEventListener("keydown", handler);
 return () => window.removeEventListener("keydown", handler);
 }, [onClose]);
 const term = query.toLowerCase();
 const filteredCapabilities = capabilities.filter((item) => item.name.toLowerCase().includes(term));
 const filteredLinks = links.filter(([label]) => label.toLowerCase().includes(term));
 return (
 <AnimatePresence>
 {open && <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }} className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}>
 <motion.div initial={reduceMotion ? false : { opacity: 0, y: -14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="w-full max-w-2xl overflow-hidden rounded-2xl border border-cos-border bg-cos-surface shadow-cos-glow" onMouseDown={(event) => event.stopPropagation()}>
 <div className="flex items-center gap-3 border-b border-cos-border px-5 py-4"><Search size={18} className="text-cos-accent" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a capability or workspace" className="flex-1 bg-transparent text-cos-text outline-none placeholder:text-cos-muted" /><kbd className="font-mono text-xs text-cos-steel">ESC</kbd></div>
 <div className="max-h-[55vh] overflow-y-auto p-3">
 <div className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-cos-steel">Workspaces</div>
 {filteredLinks.map(([label, href]) => <Link key={href} href={href} onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-cos-text hover:bg-cos-surface2"><span className="flex items-center gap-3"><Command size={14} className="text-cos-accent" />{label}</span><ArrowRight size={14} className="text-cos-steel" /></Link>)}
 <div className="mt-3 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-cos-steel">Capabilities</div>
 {filteredCapabilities.map((item) => <Link key={item.id} href={`/os/mount?capability=${item.id}`} onClick={onClose} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-cos-text hover:bg-cos-surface2"><span>{item.name}</span><span className="font-mono text-[10px] text-cos-steel">{item.lifecycleStage}</span></Link>)}
 </div>
 </motion.div>
 </motion.div>}
 </AnimatePresence>
 );
}
