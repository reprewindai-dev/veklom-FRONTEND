"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { PhaseTrace } from "@/lib/covenant/types";
import { cx, PHASE_STYLE } from "./util";
import { Json } from "./ui";

const CANONICAL = [
  "Identity & Security",
  "Capability & Policy",
  "Safety & Anomaly",
  "Cost & Budget",
  "Approval",
  "Execution",
  "Evidence & Proof",
  "Audit & Compliance",
  "Response",
];

interface Row {
  phase: number;
  name: string;
  status: keyof typeof PHASE_STYLE;
  duration_ms?: number;
  summary?: string;
  detail?: Record<string, unknown>;
  reached: boolean;
}

export function Pipeline({
  trace,
  runId,
}: {
  trace: PhaseTrace[] | null;
  runId: number;
}) {
  const [revealed, setRevealed] = useState(0);
  const [open, setOpen] = useState<number | null>(null);

  const rows: Row[] = CANONICAL.map((name, i) => {
    const t = trace?.find((x) => x.phase === i + 1);
    return t
      ? {
          phase: t.phase,
          name: t.name,
          status: t.status,
          duration_ms: t.duration_ms,
          summary: t.summary,
          detail: t.detail,
          reached: true,
        }
      : { phase: i + 1, name, status: "pending", reached: false };
  });

  const lastReached = trace?.length ? Math.max(...trace.map((t) => t.phase)) : 0;

  useEffect(() => {
    if (!trace) {
      setRevealed(0);
      return;
    }
    setRevealed(0);
    setOpen(null);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setRevealed(i);
      if (i >= 9) clearInterval(id);
    }, 230);
    return () => clearInterval(id);
  }, [trace, runId]);

  return (
    <div className="relative">
      {/* spine */}
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-signal/40 via-white/10 to-transparent" />
      <ol className="flex flex-col gap-1.5">
        {rows.map((row, idx) => {
          const visible = idx < revealed;
          const reachedAndVisible = visible && row.reached;
          const style = reachedAndVisible ? PHASE_STYLE[row.status] : PHASE_STYLE.pending;
          const beyond = row.phase > lastReached && lastReached > 0;
          const expandable = reachedAndVisible && row.detail;
          return (
            <li key={row.phase} className="relative">
              <motion.button
                type="button"
                disabled={!expandable}
                onClick={() => setOpen(open === row.phase ? null : row.phase)}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: visible ? 1 : 0.25, x: 0 }}
                transition={{ duration: 0.25 }}
                className={cx(
                  "flex w-full items-center gap-3 rounded-lg border bg-ink-800/40 px-3 py-2.5 text-left transition",
                  reachedAndVisible ? style.ring : "border-white/8",
                  expandable && "hover:bg-ink-700/60",
                )}
              >
                <span
                  className={cx(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-ink-900 font-mono text-[11px]",
                    reachedAndVisible ? style.ring : "border-white/10",
                  )}
                >
                  <span className={cx("absolute h-2 w-2 rounded-full", style.dot, reachedAndVisible && row.status === "pass" && "animate-pulseline")} />
                  <span className="relative ml-5 text-mute">{row.phase}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cx("truncate text-sm", reachedAndVisible ? "text-white" : "text-mute")}>
                      {row.name}
                    </span>
                    {reachedAndVisible && (
                      <span className={cx("font-mono text-[10px] uppercase tracking-wider", style.text)}>
                        {row.status}
                      </span>
                    )}
                  </div>
                  <div className="truncate font-mono text-[11px] text-mute">
                    {reachedAndVisible
                      ? row.summary
                      : beyond
                        ? "not reached — pipeline short-circuited"
                        : "awaiting…"}
                  </div>
                </div>
                {reachedAndVisible && row.duration_ms !== undefined && (
                  <span className="tnum shrink-0 font-mono text-[11px] text-mute">
                    {row.duration_ms.toFixed(1)}ms
                  </span>
                )}
                {expandable && (
                  <ChevronRight
                    size={14}
                    className={cx("shrink-0 text-mute transition", open === row.phase && "rotate-90")}
                  />
                )}
              </motion.button>
              <AnimatePresence>
                {open === row.phase && row.detail && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pl-12 pr-2"
                  >
                    <div className="py-2">
                      <Json data={row.detail} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
