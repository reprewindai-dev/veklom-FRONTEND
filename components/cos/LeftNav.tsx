"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BookOpenCheck,
  Boxes,
  CircleDollarSign,
  Command,
  FileCheck2,
  LayoutGrid,
  LockKeyhole,
  Play,
  Route,
  Scale,
  Shield,
} from "lucide-react";
import { crossCuttingStages, spineStages, type StageDefinition } from "@/lib/cos/stages";

const icons = {
  capabilities: LayoutGrid,
  mount: Boxes,
  blueprint: BookOpenCheck,
  govern: Scale,
  execute: Play,
  evidence: FileCheck2,
  measure: Activity,
  settle: CircleDollarSign,
  authority: LockKeyhole,
  tracker: Route,
  terminal: Command,
} as const;

export function LeftNav({ onTerminal }: { onTerminal: () => void }) {
  const pathname = usePathname();
  const renderItem = (stage: StageDefinition) => {
    const Icon = icons[stage.id];
    const active = pathname === stage.route;
    return (
    <Link href={stage.route} key={stage.route} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-cos-accent/10 text-cos-accent" : "text-cos-muted hover:bg-cos-surface2 hover:text-cos-text"}`}>
      <Icon size={16} strokeWidth={active ? 2.4 : 1.8} />
      <span>{stage.label}</span>
      {active && <motion.span layoutId="cos-nav-active" className="ml-auto h-1.5 w-1.5 rounded-full bg-cos-accent shadow-[0_0_10px_#00E5FF]" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
    </Link>
    );
  };
  return (
    <aside className="hidden w-60 shrink-0 border-r border-cos-border bg-cos-bg/90 px-3 py-5 lg:block">
      <div className="mb-4 px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-steel">Capability lifecycle</div>
      <nav className="space-y-1">{spineStages.map(renderItem)}</nav>
      <div className="my-5 border-t border-cos-border" />
      <div className="mb-2 px-3 font-mono text-[9px] uppercase tracking-[0.22em] text-cos-steel">Cross-cutting</div>
      <nav className="space-y-1">{crossCuttingStages.filter((stage) => stage.id !== "terminal").map(renderItem)}</nav>
      <button onClick={onTerminal} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-cos-muted transition hover:bg-cos-surface2 hover:text-cos-text">
        <Command size={16} /><span>Terminal</span><kbd className="ml-auto font-mono text-[10px] text-cos-steel">⌃`</kbd>
      </button>
      <div className="mt-8 rounded-lg border border-cos-border bg-cos-surface2 p-3">
        <div className="flex items-center gap-2 text-xs text-cos-steel"><Shield size={14} /> Honest runtime state</div>
        <p className="mt-2 text-[11px] leading-5 text-cos-muted">A configured route or manifest is not operational proof.</p>
      </div>
    </aside>
  );
}
