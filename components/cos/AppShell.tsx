"use client";

import { useEffect, useState } from "react";
import { Clock3, Command, Cpu, Moon, ShieldCheck, Sun } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { LeftNav } from "./LeftNav";
import { VeklomLogo } from "./VeklomLogo";
import { ProofBadge } from "./ProofBadge";
import { CommandPalette } from "./CommandPalette";
import { TerminalConsole } from "./TerminalConsole";
import { SandboxProvider } from "@/lib/cos/sandbox";
import { ProdSandboxToggle } from "./ProdSandboxToggle";

type HumanTheme = "light" | "dark";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  const [sandbox, setSandbox] = useState(false);
  const [theme, setTheme] = useState<HumanTheme>("dark");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [clock, setClock] = useState("");
  const [health, setHealth] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);

  useEffect(() => {
    const savedEnvironment = window.localStorage.getItem("veklom.environment");
    setSandbox(savedEnvironment === "sandbox");

    const savedTheme = window.localStorage.getItem("veklom.human-theme");
    const initialTheme: HumanTheme = savedTheme === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().slice(11, 19) + " UTC");
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    import("@/lib/api").then(({ api }) => {
      const fetchHealth = () => api.get("/v1/health").then(setHealth).catch(() => setHealth(null));
      const fetchBalance = () => api.get("/v1/wallet/balance").then(setBalance).catch(() => setBalance(null));
      fetchHealth();
      fetchBalance();
      const hTimer = setInterval(fetchHealth, 30000);
      const bTimer = setInterval(fetchBalance, 60000);
      return () => {
        clearInterval(hTimer);
        clearInterval(bTimer);
      };
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
      if (event.ctrlKey && event.key === "`") {
        event.preventDefault();
        setTerminalOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTheme = () => {
    const nextTheme: HumanTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("veklom.human-theme", nextTheme);
  };

  const identity = loading ? "Loading identity" : me?.email || me?.name || "Requester identity unavailable";

  return (
    <SandboxProvider value={sandbox}>
      <div className="cos-shell relative flex min-h-screen overflow-hidden bg-cos-bg font-sans text-cos-text transition-colors duration-200">
        <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_78%_0%,color-mix(in_srgb,var(--theme-accent)_13%,transparent),transparent_29%),radial-gradient(circle_at_16%_92%,color-mix(in_srgb,var(--theme-accent)_5%,transparent),transparent_27%)]" />
        <div className="pointer-events-none fixed inset-0 -z-0 bg-cos-grid bg-[size:56px_56px] opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_78%)]" />
        <div className="relative z-10 flex min-h-screen w-full flex-col">
          <header className="relative flex min-h-[76px] items-center justify-between gap-4 border-b border-cos-border/80 bg-cos-bg/70 px-4 shadow-[0_12px_35px_-28px_rgba(0,229,255,0.8)] backdrop-blur-2xl lg:px-7">
            <div className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-px bg-gradient-to-r from-transparent via-cos-accent/55 to-transparent" />
            <div className="flex items-center gap-5">
              <VeklomLogo />
              <span className="hidden border-l border-cos-border pl-5 font-mono text-[9px] uppercase tracking-[0.2em] text-cos-steel md:inline">
                Capability Operating System
              </span>
              <span className="hidden rounded border border-cos-accent/25 px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-cos-steel lg:inline">
                Consequence Authority Infrastructure
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <ProdSandboxToggle sandbox={sandbox} onChange={setSandbox} />
              <button
                onClick={toggleTheme}
                className="rounded-full border border-cos-border bg-cos-surface2/50 p-2.5 text-cos-steel transition hover:border-cos-accent/50 hover:text-cos-accent"
                aria-label={theme === "dark" ? "Switch to day mode" : "Switch to night mode"}
                title={theme === "dark" ? "Day mode" : "Night mode"}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="hidden items-center gap-2 rounded-full border border-cos-border bg-cos-surface2/40 px-3 py-2 text-cos-muted md:flex">
                <Cpu size={14} className={health ? "text-cos-verified" : "text-cos-steel"} />
                Runtime <ProofBadge status={health ? "Verified" : "Needs proof"} />
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-cos-border bg-cos-surface2/40 px-3 py-2 text-cos-muted xl:flex">
                <ShieldCheck size={14} className="text-cos-steel" />
                {identity}
              </div>
              {balance && (
                <div className="hidden items-center gap-2 rounded-full border border-cos-border bg-cos-surface2/40 px-3 py-2 font-mono text-[10px] text-cos-accent xl:flex">
                  {(balance.balance ?? balance.tokens ?? 0).toLocaleString()} TKNS
                </div>
              )}
              <button
                onClick={() => setPaletteOpen(true)}
                className="rounded-full border border-cos-border bg-cos-surface2/50 p-2.5 text-cos-steel transition hover:border-cos-accent/50 hover:text-cos-accent"
                aria-label="Open command palette"
              >
                <Command size={16} />
              </button>
              <span className="hidden items-center gap-1 rounded-full border border-cos-border px-3 py-2 font-mono text-[10px] text-cos-steel xl:flex">
                <Clock3 size={13} />
                {clock}
              </span>
            </div>
          </header>
          <div className="flex min-h-0 flex-1">
            <LeftNav onTerminal={() => setTerminalOpen(true)} />
            <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
        <TerminalConsole open={terminalOpen} onClose={() => setTerminalOpen(false)} />
      </div>
    </SandboxProvider>
  );
}
