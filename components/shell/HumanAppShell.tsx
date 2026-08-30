"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { VeklomLogoLockup } from "@/components/ui/SharedUI";
import { AcquisitionPrompt } from "@/components/acquisition/AcquisitionPrompt";

const navItems = [
  ["/proof", "Proof"],
  ["/conformance", "Conformance"],
  ["/architecture", "Architecture"],
  ["/docs", "Docs"],
] as const;

export function HumanAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-theme-bg text-theme-ink font-sans selection:bg-theme-accent/20 overflow-x-hidden">
      <AcquisitionPrompt />
      <header className="border-b border-theme-border bg-theme-bg/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="min-w-0 shrink">
            <VeklomLogoLockup />
          </div>

          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            {navItems.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith(href) ? "text-theme-accent font-bold" : "text-theme-inkDim hover:text-theme-ink"}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link href="/machine" className="hidden xl:inline-flex text-[10px] font-mono text-theme-inkDim hover:text-theme-accent transition-colors uppercase border border-theme-border px-2 py-1 rounded">
              Machine Surface
            </Link>
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <Link href="/login" className="hidden md:inline-flex px-3 py-2 text-xs font-mono uppercase font-bold text-theme-inkDim hover:text-theme-ink transition-colors">
              Log in
            </Link>
            <Link href="/get" className="group inline-flex items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-2 bg-theme-ink text-theme-bg hover:opacity-90 transition-all text-[10px] sm:text-xs font-mono uppercase font-bold rounded shadow-sm whitespace-nowrap">
              <span className="hidden min-[360px]:inline">Get Veklom</span>
              <span className="min-[360px]:hidden">Get</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded border border-theme-border bg-theme-surface text-theme-ink"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="veklom-mobile-navigation"
            >
              {mobileMenuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="veklom-mobile-navigation" className="md:hidden border-t border-theme-border bg-theme-bg shadow-lg">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 grid gap-1" aria-label="Mobile navigation">
              {navItems.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`min-h-11 flex items-center rounded px-3 font-mono text-xs uppercase tracking-wide transition-colors ${pathname.startsWith(href) ? "bg-theme-surface text-theme-accent font-bold" : "text-theme-inkDim hover:bg-theme-surface hover:text-theme-ink"}`}
                >
                  {label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2 mt-1 border-t border-theme-border">
                <Link href="/login" className="min-h-11 inline-flex items-center justify-center rounded border border-theme-border text-xs font-mono uppercase font-bold text-theme-ink">
                  Log in
                </Link>
                <div className="min-h-11 flex items-center justify-center rounded border border-theme-border bg-theme-surface">
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col w-full min-w-0">
        {children}
      </main>

      <footer className="border-t border-theme-border bg-theme-surface mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="font-mono text-xs text-theme-inkDim text-center md:text-left">
            &copy; {new Date().getFullYear()} Veklom · Machine Authority Infrastructure
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 font-mono text-[10px] uppercase text-theme-inkDim tracking-widest">
            <Link href="/get" className="font-bold text-theme-accent hover:text-theme-ink">Get Veklom</Link>
            <Link href="/proof" className="hover:text-theme-ink">Proof</Link>
            <Link href="/architecture" className="hover:text-theme-ink">Architecture</Link>
            <Link href="/security" className="hover:text-theme-ink">Security</Link>
            <Link href="/docs" className="hover:text-theme-ink">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
