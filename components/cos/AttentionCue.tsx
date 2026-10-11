"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VeklomActivityCue, type ActivityKind } from "./VeklomActivityCue";
import { useAttention } from "@/lib/cos/useAttention";
import type { AttentionItem, AttentionSummary, SourceRead } from "@/lib/cos/attention";

const KIND: Record<AttentionItem["source"], ActivityKind> = { approval: "authority", run: "execution" };
const SOURCE_LABEL = { approvals: "Approvals (GET /v1/governance/v2/quarantine)", runs: "Runs (GET /v1/runs)" } as const;
const READ_LABEL: Record<SourceRead, string> = { pending: "checking", ok: "read", unavailable: "could not be read" };

/**
 * The list behind the system cue: most urgent first, each row the real state CAPPO returned,
 * a link to where it lives, and the evidence identifier when there is one.
 */
export function AttentionPanel({
  items,
  summary,
  reads,
  onNavigate,
}: {
  items: AttentionItem[];
  summary: AttentionSummary;
  reads: Record<keyof typeof SOURCE_LABEL, SourceRead>;
  onNavigate?: () => void;
}) {
  const shown = items.slice(0, 12);
  return (
    <div role="dialog" aria-label="What needs you" className="w-[min(92vw,380px)] rounded-xl border border-cos-border bg-cos-surface p-3 shadow-xl">
      <p className="text-sm font-semibold text-cos-text">{summary.label}</p>
      {shown.length ? (
        <ul className="mt-3 space-y-2" data-testid="attention-items">
          {shown.map((item) => (
            <li key={`${item.source}-${item.id}`} className="rounded-lg border border-cos-border bg-cos-bg/35 px-3 py-2">
              <Link href={item.href} onClick={onNavigate} className="flex items-start gap-2 hover:text-cos-accent">
                <VeklomActivityCue kind={KIND[item.source]} condition={item.condition} size={16} showCaption={false} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-medium text-cos-text">{item.title}</span>
                  <span className="block truncate text-[11px] text-cos-muted">{item.detail}</span>
                  <span className="block truncate font-mono text-[10px] text-cos-steel">
                    {item.source} {item.id}{item.evidenceRef ? ` · evidence ${item.evidenceRef}` : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {items.length > shown.length ? <p className="mt-2 text-[11px] text-cos-muted">{items.length - shown.length} more in Tracker</p> : null}
      <ul className="mt-3 space-y-0.5 border-t border-cos-border pt-2 font-mono text-[10px] text-cos-steel">
        {(Object.keys(SOURCE_LABEL) as (keyof typeof SOURCE_LABEL)[]).map((key) => (
          <li key={key}>{SOURCE_LABEL[key]}: {READ_LABEL[reads[key]]}</li>
        ))}
        <li>Approvals are held in CAPPO memory and are lost if it restarts.</li>
      </ul>
    </div>
  );
}

/** The system cue in the OS chrome: the single glance at what needs the human. */
export function AttentionCue({ signedIn, loading }: { signedIn: boolean; loading: boolean }) {
  const { items, summary, reads, refresh } = useAttention(signedIn);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onClick = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  if (!signedIn) {
    return <VeklomActivityCue kind="system" condition={loading ? "active" : "failed"} size={18} showCaption={false} />;
  }
  return (
    <div ref={root} className="relative flex items-center">
      <button
        type="button"
        onClick={() => { if (!open) refresh(); setOpen((value) => !value); }}
        aria-expanded={open}
        aria-label={`${summary.label}. Show what needs you`}
        title={summary.label}
        className="relative flex items-center rounded-full"
      >
        <VeklomActivityCue kind="system" condition={summary.condition} size={18} showCaption={false} />
        {summary.count ? (
          <span data-testid="attention-count" className="absolute -right-1.5 -top-1.5 min-w-[16px] rounded-full bg-cos-warn px-1 text-center font-mono text-[9px] font-semibold leading-4 text-cos-bg">
            {summary.count > 9 ? "9+" : summary.count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-50 mt-3">
          <AttentionPanel items={items} summary={summary} reads={reads} onNavigate={() => setOpen(false)} />
        </div>
      ) : null}
    </div>
  );
}
