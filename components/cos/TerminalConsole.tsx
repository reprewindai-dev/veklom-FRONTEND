"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Command, Maximize2, X } from "lucide-react";
import { TerminalSession } from "./TerminalSession";

/** The always-available operator console overlay (Ctrl+`). Same session UI as /os/terminal. */
export function TerminalConsole({ open, onClose }: { open: boolean; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
    {open && <motion.div initial={reduceMotion ? false : { opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: 28 }} transition={{ duration: reduceMotion ? 0 : 0.2 }} className="fixed inset-x-0 bottom-0 z-40 border-t border-cos-accent/25 bg-cos-bg/95 shadow-[0_-20px_80px_-35px_rgba(0,229,255,0.6)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-cos-text"><Command size={15} className="text-cos-accent" />Terminal <span className="font-mono text-[10px] text-cos-steel">governed tool server · /api/mcp</span></div>
          <div className="flex items-center gap-3 text-cos-steel">
            <Link href="/os/terminal" onClick={onClose} aria-label="Open the terminal full screen" className="hover:text-cos-text"><Maximize2 size={15} /></Link>
            <button onClick={onClose} aria-label="Close terminal" className="hover:text-cos-text"><X size={17} /></button>
          </div>
        </div>
        <TerminalSession autoFocus className="h-[45vh]" />
      </div>
    </motion.div>}
    </AnimatePresence>
  );
}
