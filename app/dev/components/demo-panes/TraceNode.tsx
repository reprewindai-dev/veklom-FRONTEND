"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TraceNode({ data, defaultOpen = false }: { data: any, defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-transparent border-none text-[#FFB800] text-xs font-mono cursor-pointer p-0 hover:text-[#ffca40] transition-colors"
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {open ? "hide raw payload" : "view raw payload"}
      </button>
      
      <AnimatePresence>
        {open && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#050505] border border-[#262626] rounded-md p-3 text-[11px] leading-relaxed text-[#d4d4d4] overflow-x-auto mt-2 font-mono"
          >
            {JSON.stringify(data, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}
