"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Command, Maximize2, X } from "lucide-react";
import { ProofBadge } from "./ProofBadge";

export function TerminalConsole({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);
  return (
    <AnimatePresence>
    {open && <motion.div initial={reduceMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 28 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="fixed inset-x-0 bottom-0 z-40 border-t border-cos-accent/25 bg-cos-bg/95 shadow-[0_-20px_80px_-35px_rgba(0,229,255,0.6)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl p-4">
        <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-cos-text"><Command size={15} className="text-cos-accent" />Terminal <ProofBadge status="Not started" /></div><div className="flex gap-2 text-cos-steel"><Maximize2 size={15} /><button onClick={onClose} aria-label="Close terminal"><X size={17} /></button></div></div>
        <div className="rounded-lg border border-cos-border bg-black/30 p-4"><p className="font-mono text-xs text-cos-muted">No runtime connected. Terminal execution is not started.</p><div className="mt-4 flex items-center gap-2"><span className="font-mono text-cos-accent">›</span><input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") setInput(""); }} placeholder="Connect a runtime to enter a directive" className="flex-1 bg-transparent font-mono text-sm text-cos-text outline-none placeholder:text-cos-steel/70" /></div></div>
      </div>
    </motion.div>}
    </AnimatePresence>
  );
}
