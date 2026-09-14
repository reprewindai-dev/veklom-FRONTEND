"use client";

import { useEffect, useState } from "react";
import {
  readSessionCapabilityLease,
  type SessionCapabilityLease,
} from "@/lib/cos/lease-session";
import { SANDBOX_PROJECT, useSandboxMode } from "@/lib/cos/sandbox";

export function ScopeTag({ project }: { project?: string }) {
  const sandbox = project === SANDBOX_PROJECT;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${sandbox ? "border-cos-warn/50 bg-cos-warn/10 text-cos-warn" : "border-cos-border bg-cos-surface2/50 text-cos-steel"}`}>
      {sandbox ? "SANDBOX" : "PRODUCTION"}
    </span>
  );
}

export function EnvironmentFrame() {
  const sandbox = useSandboxMode();
  const [lease, setLease] = useState<SessionCapabilityLease | null>(() => readSessionCapabilityLease());

  useEffect(() => {
    const syncLease = () => setLease(readSessionCapabilityLease());
    syncLease();
    window.addEventListener("veklom.capability_lease.changed", syncLease);
    return () => window.removeEventListener("veklom.capability_lease.changed", syncLease);
  }, []);

  if (sandbox) {
    return (
      <div className="flex w-full items-stretch border-b border-cos-warn/30 bg-cos-warn/[0.08] text-cos-warn">
        <div className="w-2 shrink-0 bg-[repeating-linear-gradient(135deg,rgba(245,158,11,0.9)_0_6px,transparent_6px_12px)]" />
        <div className="flex min-h-9 flex-1 flex-wrap items-center gap-2 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] lg:px-7">
          <span>SANDBOX SCOPE · project={SANDBOX_PROJECT} · consequences are real, target is disposable</span>
          {lease ? <span>· mount {lease.mountId} · expires {lease.expiresAt ?? "Not returned"}</span> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-8 w-full items-center border-b border-cos-border/60 bg-cos-surface2/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel lg:px-7">
      PRODUCTION SCOPE · project={lease?.project ?? "—"}
    </div>
  );
}
