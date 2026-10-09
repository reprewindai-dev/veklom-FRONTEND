"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Command, Cpu, FileCheck2, FlaskConical, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LeftNav, MobileNav } from "./LeftNav";
import { AccountMenu } from "./AccountMenu";
import { CapabilityContextBar } from "./CapabilityContextBar";
import { useCapabilityContext } from "@/lib/cos/capability-context";
import { VeklomLogo } from "./VeklomLogo";
import { ProofBadge } from "./ProofBadge";
import { CommandPalette } from "./CommandPalette";
import { TerminalConsole } from "./TerminalConsole";
import {
  ENVIRONMENT_CHANGED_EVENT,
  readEnvironmentIsSandbox,
  SANDBOX_COPY,
  SandboxProvider,
} from "@/lib/cos/sandbox";
import { readSessionCapabilityLease, type SessionCapabilityLease } from "@/lib/cos/lease-session";
import { ProdSandboxToggle } from "./ProdSandboxToggle";
import { EnvironmentFrame } from "./EnvironmentFrame";

export function RuntimePill({ sandbox }: { sandbox: boolean }) {
  return (
    <span
      data-testid="runtime-pill"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] ${sandbox ? "border-cos-warn/60 bg-cos-warn/10 text-cos-warn" : "border-cos-accent/40 bg-cos-accent/5 text-cos-accent"}`}
    >
      {sandbox ? <FlaskConical size={13} /> : <Cpu size={13} />}
      {sandbox ? SANDBOX_COPY.runtimePill : SANDBOX_COPY.liveRuntimePill}
    </span>
  );
}

export function EnvironmentFooter({ sandbox }: { sandbox: boolean }) {
  return (
    <footer
      data-testid="environment-footer"
      className={`flex min-h-8 items-center gap-2 border-t px-4 font-mono text-[10px] uppercase tracking-[0.16em] lg:px-7 ${sandbox ? "border-cos-warn/40 bg-cos-warn/[0.08] text-cos-warn" : "border-cos-border bg-cos-bg/70 text-cos-steel"}`}
    >
      <span aria-hidden="true">●</span>
      {sandbox ? SANDBOX_COPY.footer : SANDBOX_COPY.liveFooter}
    </footer>
  );
}

export function SandboxWatermark() {
  return <div className="cos-sandbox-watermark" aria-hidden="true" data-testid="sandbox-watermark"><span>SANDBOX</span></div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { capabilityId, capability, clear: clearCapability } = useCapabilityContext();
  const [navOpen, setNavOpen] = useState(false);
  const [sandbox, setSandbox] = useState(false);
  // Pages render only once the environment is resolved so no screen can issue
  // a request (or show cached state) in the wrong environment.
  const [environmentReady, setEnvironmentReady] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [clock, setClock] = useState("");
  const [lease, setLease] = useState<SessionCapabilityLease | null>(() => readSessionCapabilityLease());
  useEffect(() => {
    const syncLease = () => setLease(readSessionCapabilityLease());
    syncLease();
    window.addEventListener("veklom.capability_lease.changed", syncLease);
    return () => window.removeEventListener("veklom.capability_lease.changed", syncLease);
  }, []);
  useEffect(() => {
    const syncEnvironment = () => {
      setSandbox(readEnvironmentIsSandbox());
      setEnvironmentReady(true);
    };
    syncEnvironment();
    window.addEventListener(ENVIRONMENT_CHANGED_EVENT, syncEnvironment);
    return () => window.removeEventListener(ENVIRONMENT_CHANGED_EVENT, syncEnvironment);
  }, []);
  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19) + " UTC");
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(true); }
      if (event.ctrlKey && event.key === "`") { event.preventDefault(); setTerminalOpen((value) => !value); }
    };
    window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler);
  }, []);
  const environmentKey = sandbox ? "sandbox" : "live";
  return (
    <SandboxProvider value={sandbox}>
    <div data-environment={environmentKey} className={`cos-shell relative flex min-h-screen overflow-hidden bg-cos-bg font-sans text-cos-text ${sandbox ? "ring-2 ring-inset ring-cos-warn/40" : ""}`}>
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_78%_0%,rgb(var(--theme-accent)/0.13),transparent_29%),radial-gradient(circle_at_16%_92%,rgb(var(--theme-accent)/0.055),transparent_27%),linear-gradient(180deg,var(--theme-bg)_0%,var(--theme-bg)_100%)]" />
      <div className="pointer-events-none fixed inset-0 -z-0 bg-cos-grid bg-[size:56px_56px] opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
      {sandbox ? <SandboxWatermark /> : null}
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <header className="relative flex min-h-[76px] items-center justify-between gap-4 border-b border-cos-border/80 bg-cos-bg/70 px-4 shadow-[0_12px_35px_-28px_rgb(var(--theme-accent)/0.8)] backdrop-blur-2xl lg:px-7">
          <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px bg-gradient-to-r from-transparent via-cos-accent/55 to-transparent" />
          <div className="flex items-center gap-3 lg:gap-5">
            <button type="button" onClick={() => setNavOpen(true)} className="rounded-full border border-cos-border bg-cos-surface2/50 p-2.5 text-cos-steel transition hover:text-cos-accent lg:hidden" aria-label="Open navigation"><Menu size={16} /></button>
            <VeklomLogo />
            <Link href="/proof" className="hidden items-center gap-1 text-xs text-cos-steel transition hover:text-cos-accent lg:inline-flex" title="What is proven, with its evidence"><FileCheck2 size={13} />Proof</Link>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <RuntimePill sandbox={sandbox} />
            <ProdSandboxToggle sandbox={sandbox} onChange={setSandbox} />
            {lease && !lease.terminated ? <div className="hidden items-center gap-2 rounded-full border border-cos-border bg-cos-surface2/40 px-3 py-2 text-cos-muted md:flex"><Cpu size={14} className="text-cos-steel" />Held mount <ProofBadge status="Present" /></div> : null}
            <div className="hidden md:block"><AccountMenu /></div>
            <span className="hidden sm:inline-flex"><ThemeToggle /></span>
            <button onClick={() => setPaletteOpen(true)} className="rounded-full border border-cos-border bg-cos-surface2/50 p-2.5 text-cos-steel transition hover:border-cos-accent/50 hover:text-cos-accent" aria-label="Open command palette"><Command size={16} /></button>
            <span className="hidden items-center gap-1 rounded-full border border-cos-border px-3 py-2 font-mono text-[10px] text-cos-steel xl:flex"><Clock3 size={13} />{clock}</span>
          </div>
        </header>
        <EnvironmentFrame />
        <CapabilityContextBar capability={capability} onClear={clearCapability} />
        <div className="flex min-h-0 flex-1">
          <LeftNav onTerminal={() => setTerminalOpen(true)} sandbox={sandbox} capabilityId={capabilityId} />
          {/* Keyed by environment: switching modes remounts every page so no
              in-memory mount, execution or evidence state crosses over. */}
          <main key={environmentKey} className="min-w-0 flex-1 overflow-y-auto">{environmentReady ? children : null}</main>
        </div>
        <EnvironmentFooter sandbox={sandbox} />
      </div>
      <MobileNav open={navOpen} onClose={() => setNavOpen(false)} onTerminal={() => setTerminalOpen(true)} sandbox={sandbox} capabilityId={capabilityId} footer={<AccountMenu compact />} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onTerminal={() => setTerminalOpen(true)} capabilityId={capabilityId} />
      <TerminalConsole open={terminalOpen} onClose={() => setTerminalOpen(false)} />
    </div>
    </SandboxProvider>
  );
}
