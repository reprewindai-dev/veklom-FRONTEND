"use client";

import Link from "next/link";
import { ArrowRight, Crosshair, X } from "lucide-react";
import type { CapabilityContract } from "@/lib/cos/capabilities";
import { capabilityHref } from "@/lib/cos/capability-context";

/** Shows which capability every workspace is operating on, and lets the operator change it. */
export function CapabilityContextBar({ capability, onClear }: { capability?: CapabilityContract; onClear: () => void }) {
  if (!capability) return null;
  return (
    <div data-testid="capability-context" className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-cos-border bg-cos-surface2/40 px-4 py-2 text-xs lg:px-7">
      <Crosshair size={13} className="text-cos-accent" />
      <span className="text-cos-steel">Working on</span>
      <span className="font-medium text-cos-text">{capability.name}</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">{capability.lifecycleStage} · {capability.mountState}</span>
      <Link href={capabilityHref(capability)} className="inline-flex items-center gap-1 text-cos-accent hover:underline">Open its workspace <ArrowRight size={12} /></Link>
      <button type="button" onClick={onClear} className="ml-auto inline-flex items-center gap-1 rounded-full border border-cos-border px-2 py-1 text-cos-muted hover:text-cos-text" aria-label="Clear the selected capability">
        <X size={12} /> Clear
      </button>
    </div>
  );
}
