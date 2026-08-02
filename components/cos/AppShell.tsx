"use client";

import { useEffect, useState } from "react";
import { Clock3, Command, Cpu, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LeftNav } from "./LeftNav";
import { VeklomLogo } from "./VeklomLogo";
import { ProofBadge } from "./ProofBadge";
import { CommandPalette } from "./CommandPalette";
import { TerminalConsole } from "./TerminalConsole";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const [sandbox, setSandbox] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [clock, setClock] = useState("");
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
  const identity = loading ? "Loading identity" : me?.email || me?.name || "Requester identity unavailable";
  return (
    <div className="cos-shell flex min-h-screen bg-cos-bg font-sans text-cos-text">
      <div className="fixed inset-0 -z-0 bg-[radial-gradient(circle_at_78%_0%,rgba(0,229,255,0.08),transparent_30%),linear-gradient(180deg,#0A0E1A_0%,#080B14_100%)]" />
      <div className="relative z-10 flex min-h-screen w-full flex-col">
        <header className="flex min-h-[68px] items-center justify-between gap-4 border-b border-cos-border bg-cos-bg/90 px-4 backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-5"><VeklomLogo /><span className="hidden border-l border-cos-border pl-5 font-mono text-[10px] uppercase tracking-[0.22em] text-cos-steel md:inline">Capability Operating System</span></div>
          <div className="flex items-center gap-3 text-xs">
            <button onClick={() => setSandbox((value) => !value)} className="rounded-full border border-cos-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel hover:border-cos-accent/50"><span className={sandbox ? "text-cos-warn" : "text-cos-accent"}>{sandbox ? "SANDBOX" : "PROD MODE"}</span></button>
            <div className="hidden items-center gap-2 text-cos-muted md:flex"><Cpu size={14} className="text-cos-steel" />Runtime <ProofBadge status="Needs proof" /></div>
            <div className="hidden items-center gap-2 text-cos-muted xl:flex"><ShieldCheck size={14} className="text-cos-steel" />{identity}</div>
            <button onClick={() => setPaletteOpen(true)} className="rounded-lg border border-cos-border p-2 text-cos-steel hover:border-cos-accent/50 hover:text-cos-accent" aria-label="Open command palette"><Command size={16} /></button>
            <span className="hidden items-center gap-1 font-mono text-[10px] text-cos-steel xl:flex"><Clock3 size={13} />{clock}</span>
          </div>
        </header>
        <div className="flex min-h-0 flex-1"><LeftNav onTerminal={() => setTerminalOpen(true)} /><main className="min-w-0 flex-1 overflow-y-auto">{children}</main></div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <TerminalConsole open={terminalOpen} onClose={() => setTerminalOpen(false)} />
    </div>
  );
}
