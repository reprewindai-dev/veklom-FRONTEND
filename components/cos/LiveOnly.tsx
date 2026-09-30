"use client";

import { SANDBOX_COPY } from "@/lib/cos/sandbox";

/**
 * Marks an action that CAPPO (or the owning service) cannot scope to sandbox.
 * Such actions are disabled while sandbox mode is on instead of pretending to
 * run them in a sandbox.
 */
export function LiveOnlyNotice({ action, reason }: { action: string; reason: string }) {
  return (
    <div data-testid="live-only" className="rounded-lg border border-cos-warn/40 bg-cos-warn/[0.08] p-3 text-xs text-cos-warn">
      <span className="mr-2 rounded-full border border-cos-warn/60 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em]">{SANDBOX_COPY.liveOnly}</span>
      <strong>{action}</strong> is disabled in sandbox: {reason}
    </div>
  );
}
