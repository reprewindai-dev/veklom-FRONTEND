"use client";

import { useEffect, useState } from "react";
import {
  readSessionCapabilityLease,
  type SessionCapabilityLease,
} from "@/lib/cos/lease-session";
import {
  environmentForProject,
  SANDBOX_COPY,
  SANDBOX_PROJECT,
  useSandboxMode,
} from "@/lib/cos/sandbox";

/** Environment tag for any mount / execution / evidence / receipt row, derived from CAPPO's returned project. */
export function ScopeTag({ project }: { project?: string }) {
  const environment = environmentForProject(project);
  const style = environment === "sandbox"
    ? "border-cos-warn/50 bg-cos-warn/10 text-cos-warn"
    : environment === "live"
      ? "border-cos-accent/40 bg-cos-accent/5 text-cos-accent"
      : "border-cos-border bg-cos-surface2/50 text-cos-steel";
  const label = environment === "sandbox" ? "SANDBOX" : environment === "live" ? "LIVE" : "UNSCOPED";
  return (
    <span
      data-environment-tag={environment}
      title={environment === "unscoped" ? "The authority layer returned no project scope for this record" : `project=${project}`}
      className={`inline-flex items-center rounded-full border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] ${style}`}
    >
      {label}
    </span>
  );
}

/** Persistent, non-dismissible sandbox banner. Rendered on every /os screen by AppShell. */
export function SandboxBanner() {
  return (
    <div
      role="status"
      data-testid="sandbox-banner"
      className="flex w-full items-center justify-center border-b border-cos-warn/40 bg-cos-warn/[0.14] px-4 py-2 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-cos-warn"
    >
      {SANDBOX_COPY.banner}
    </div>
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
      <div className="w-full">
        <SandboxBanner />
        <div className="flex w-full items-stretch border-b border-cos-warn/30 bg-cos-warn/[0.06] text-cos-warn">
          <div className="w-2 shrink-0 bg-[repeating-linear-gradient(135deg,rgba(255,184,0,0.9)_0_6px,transparent_6px_12px)]" />
          <div className="flex min-h-8 flex-1 flex-wrap items-center gap-2 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] lg:px-7">
            <span>Sandbox scope · project={SANDBOX_PROJECT} · mounts, executions and evidence are sandbox-scoped</span>
            {lease ? <span>· mount {lease.mountId} · expires {lease.expiresAt ?? "Not returned"}</span> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="live-frame" className="flex min-h-8 w-full items-center border-b border-cos-border/60 bg-cos-surface2/20 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel lg:px-7">
      LIVE SCOPE · project={lease?.project ?? "—"}
    </div>
  );
}
