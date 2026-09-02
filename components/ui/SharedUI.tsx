import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// --- Branding ---
export function VeklomLogoLockup() { return ( <div className="flex items-center gap-4"> <Link href="/" className="flex items-center gap-3 font-mono font-bold text-sm tracking-widest text-theme-ink hover:text-theme-accent transition-colors"> <img src="/brand/veklom-shield-512.png" alt="Veklom" className="h-8 w-8 rounded-sm border border-theme-border/50 object-contain" /> <span className="text-lg">VEKLOM</span> </Link> <div className="h-4 w-px bg-theme-border hidden sm:block"></div> <span className="text-theme-inkDim font-mono text-[10px] uppercase tracking-widest hidden sm:inline-block"> Capability OS </span> </div> ); }

// --- Layout ---
export function PageHeader({ title, description, badge }: { title: string, description: string, badge?: React.ReactNode }) {
  return (
    <div className="mb-12 border-b border-theme-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-sans font-bold text-theme-ink mb-2">{title}</h1>
        <p className="text-theme-inkDim text-sm max-w-2xl">{description}</p>
      </div>
      {badge && <div className="hidden sm:block">{badge}</div>}
    </div>
  );
}

export function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-lg font-bold font-mono text-theme-accent uppercase tracking-widest border-b border-theme-border pb-2 mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}

// --- Cards ---
export function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-theme-surface border border-theme-border rounded p-6 shadow-sm hover:border-theme-accent transition-all ${className}`}>
      {children}
    </div>
  );
}

export function EvidenceCard({ file, desc, status }: { file: string, desc: string, status: 'VERIFIED' | 'PENDING' }) {
  return (
    <Card className="group">
      <div className="flex justify-between items-start mb-2">
        <span className="font-mono text-sm font-bold text-theme-ink group-hover:text-theme-accent transition-colors">{file}</span>
        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
          status === 'VERIFIED' 
            ? 'text-theme-verified border-theme-verified/40 bg-theme-verified/10' 
            : 'text-theme-warn border-theme-warn/40 bg-theme-warn/10'
        }`}>
          {status}
        </span>
      </div>
      <p className="text-sm text-theme-inkDim">{desc}</p>
    </Card>
  );
}

// --- Chips & Badges ---
export type StatusType = 'verified' | 'warn' | 'danger' | 'info' | 'unknown' | string;

export function StatusPill({ status, label, className = "" }: { status: string, label?: string, className?: string }) {
  let colors = "text-theme-inkDim border-theme-border bg-theme-surface2";
  let icon = null;
  const s = status.toUpperCase();
  const textLabel = label || status;
  
  if (s === "VERIFIED" || s === "ALLOW" || s === "HEALTHY") {
    colors = "text-theme-verified border-theme-verified/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>;
  } else if (s === "DEGRADED" || s === "WARN" || s === "GOVERNED") {
    colors = "text-theme-warn border-theme-warn/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
  } else if (s === "FAILED" || s === "DENY" || s === "INVALID" || s === "REPLAY_DENIED" || s === "DANGER") {
    colors = "text-theme-danger border-theme-danger/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>;
  } else if (s === "LIVE" || s === "INFO") {
    colors = "text-theme-info border-theme-info/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>;
  } else if (s === "UNKNOWN" || s === "OUTCOME_UNKNOWN") {
    colors = "text-theme-unknown border-theme-unknown/40 bg-transparent";
    icon = <svg className="w-3 h-3 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;
  }

  return (
    <span className={`inline-flex items-center px-4 py-1.5 text-xs font-bold font-mono tracking-widest uppercase border rounded ${colors} ${className}`}>
      {icon}
      {textLabel}
    </span>
  );
}

export function ProofChip({ label, state = 'unknown' }: { label: string, state?: StatusType }) {
  return <StatusPill status={state} label={label} />;
}

// --- Buttons ---
export function PrimaryButton({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center px-6 py-3 bg-theme-ink text-theme-bg hover:opacity-90 transition-opacity font-bold rounded">
      {children}
    </Link>
  );
}

export function SecondaryButton({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center px-6 py-3 border border-theme-border bg-theme-surface hover:border-theme-accent text-theme-ink transition-colors font-bold rounded">
      {children}
    </Link>
  );
}

// --- Specifics ---
export function CapabilityLifecycle() {
  const steps = ['Capability', 'Bind', 'Govern', 'Execute', 'Prove', 'Reconcile'];
  return (
    <div className="w-full bg-theme-surface2 border-y border-theme-border py-8 overflow-x-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-theme-inkDim">
          {steps.map((step, idx) => (
            <React.Fragment key={step}>
              <span className="text-theme-ink border border-theme-border bg-theme-surface px-3 py-1.5 rounded">{step}</span>
              {idx < steps.length - 1 && <span className="text-theme-accent">&rarr;</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
