"use client";

import Link from"next/link";
import { motion, useReducedMotion } from"framer-motion";
import {
 Cable,
 FileCheck2,
 FileCode2,
 PlugZap,
 Radar,
 ReceiptText,
 Route,
 ScanSearch,
 Send,
 ShieldCheck,
 Workflow,
} from"lucide-react";
import type { Capability } from"@/lib/cos/capabilities";
import { ProofBadge } from"./ProofBadge";

const icons = { Cable, FileCheck2, FileCode2, PlugZap, Radar, ReceiptText, Route, ScanSearch, Send, ShieldCheck, Workflow };

export function CapabilityCard({ capability, onOpen }: { capability: Capability; onOpen?: (capability: Capability) => void }) {
 const Icon = icons[capability.icon as keyof typeof icons] || PlugZap;
 const reduceMotion = useReducedMotion();
 return (
 <motion.div
 whileHover={reduceMotion ? undefined : { y: -5 }}
 transition={{ type:"spring", stiffness: 360, damping: 28 }}
 className="group relative rounded-xl bg-cos-border p-px shadow-cos-card transition-shadow hover:shadow-cos-glow"
 >
 <Link
 href={capability.route.startsWith("/os/") ? capability.route : `/os/mount?capability=${capability.id}`}
 onClick={() => onOpen?.(capability)}
 className="relative flex min-h-[228px] flex-col justify-between overflow-hidden rounded-[11px] bg-cos-surface p-5"
 >
 <div className="pointer-events-none absolute inset-0 bg-cos-sheen opacity-70" />
 <div>
 <div className="relative mb-5 flex items-start justify-between">
 <span className="rounded-lg border border-cos-accent/20 bg-cos-accent/10 p-2.5 text-cos-accent shadow-[0_0_25px_-10px_#00E5FF]"><Icon size={20} /></span>
 <ProofBadge status={capability.evidence.proofState} />
 </div>
 <div className="relative flex items-center gap-2"><h3 className="text-lg font-medium text-cos-text">{capability.name}</h3><span className="rounded border border-cos-border bg-cos-surface2 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-cos-steel">{capability.kind}</span></div>
 <p className="relative mt-2 text-sm leading-6 text-cos-muted">{capability.description}</p>
 </div>
 <div className="relative mt-5 flex items-end justify-between border-t border-cos-border pt-3">
 <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.12em]"><span className="rounded border border-cos-border bg-cos-surface2 px-2 py-1 text-cos-steel">Trust · {capability.trustRequirement}</span><span className="rounded border border-cos-accent/15 bg-cos-accent/5 px-2 py-1 text-cos-accent">{capability.mountState}</span></div>
 <span className="translate-x-1 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-accent opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">Open →</span>
 </div>
 </Link>
 </motion.div>
 );
}
