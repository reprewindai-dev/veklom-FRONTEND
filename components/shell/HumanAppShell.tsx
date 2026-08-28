"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { VeklomLogoLockup } from "@/components/ui/SharedUI";

export function HumanAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-theme-bg text-theme-ink font-sans selection:bg-theme-accent/20">
      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <VeklomLogoLockup />

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/proof" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/proof') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>Proof</Link>
            <Link href="/conformance" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/conformance') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>Conformance</Link>
            <Link href="/architecture" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/architecture') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>Architecture</Link>
            <Link href="/demo" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/demo') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>Demo</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/machine" className="hidden lg:inline-flex text-[10px] font-mono text-theme-inkDim hover:text-theme-accent transition-colors uppercase border border-theme-border px-2 py-1 rounded">
              Machine Surface
            </Link>
            <div className="h-4 w-px bg-theme-border hidden lg:block"></div>
            <ThemeToggle />
            <Link href="/os" className="px-4 py-1.5 bg-theme-ink text-theme-bg hover:opacity-90 transition-opacity text-xs font-mono uppercase font-bold rounded">
              Log In / OS
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>

      <footer className="border-t border-theme-border bg-theme-surface mt-auto py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-theme-inkDim">
            &copy; {new Date().getFullYear()} Veklom
          </div>
          <div className="flex gap-4 font-mono text-[10px] uppercase text-theme-inkDim tracking-widest">
            <Link href="/proof" className="hover:text-theme-ink">Proof</Link>
            <Link href="/architecture" className="hover:text-theme-ink">Architecture</Link>
            <Link href="/machine" className="hover:text-theme-accent">Machine</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
