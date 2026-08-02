"use client";

import Link from "next/link";
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
} from "lucide-react";
import type { Capability } from "@/lib/cos/capabilities";
import { ProofBadge } from "./ProofBadge";

const icons = { Cable, FileCheck2, FileCode2, PlugZap, Radar, ReceiptText, Route, ScanSearch, Send, ShieldCheck, Workflow };

export function CapabilityCard({ capability, onOpen }: { capability: Capability; onOpen?: (capability: Capability) => void }) {
  const Icon = icons[capability.icon as keyof typeof icons] || PlugZap;
  return (
    <Link
      href={capability.backendRoute.startsWith("/os/") ? capability.backendRoute : `/os/mount?capability=${capability.id}`}
      onClick={() => onOpen?.(capability)}
      className="group flex min-h-[218px] flex-col justify-between rounded-xl border border-cos-border bg-cos-surface p-5 shadow-[0_18px_55px_-35px_rgba(0,229,255,0.45)] transition hover:-translate-y-0.5 hover:border-cos-accent/50 hover:bg-cos-surface2"
    >
      <div>
        <div className="mb-5 flex items-start justify-between">
          <span className="rounded-lg border border-cos-accent/20 bg-cos-accent/10 p-2.5 text-cos-accent"><Icon size={20} /></span>
          <ProofBadge status={capability.proofStatus} />
        </div>
        <h3 className="text-lg font-medium text-cos-text">{capability.name}</h3>
        <p className="mt-2 text-sm leading-6 text-cos-muted">{capability.description}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-cos-border pt-3 text-[10px] uppercase tracking-[0.12em]">
        <div><div className="text-cos-steel">Kind</div><div className="mt-1 text-cos-text">{capability.kind}</div></div>
        <div><div className="text-cos-steel">Trust</div><div className="mt-1 text-cos-text">{capability.trustRequirement}</div></div>
      </div>
    </Link>
  );
}
