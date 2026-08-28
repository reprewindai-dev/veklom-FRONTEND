"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function Header() {
  const pathname = usePathname() || "";

  // Machine surfaces handle their own headers
  if (pathname.startsWith("/machine") || pathname.startsWith("/mcp")) {
    return null;
  }

  // Simplified header for auth routes
  if (pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/forgot-password")) {
    return (
      <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="font-mono font-bold text-sm tracking-widest text-theme-ink hover:text-theme-accent transition-colors flex items-center gap-2">
            VEKLOM
          </Link>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-theme-border bg-theme-bg/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo Lockup */}
        <div className="flex items-center gap-4">
          <Link href="/" className="font-mono font-bold text-sm tracking-widest text-theme-ink hover:text-theme-accent transition-colors">
            VEKLOM
          </Link>
          <div className="h-4 w-px bg-theme-border"></div>
          <span className="text-theme-inkDim font-mono text-[10px] uppercase tracking-widest hidden sm:inline-block">
            Capability OS
          </span>
        </div>

        {/* Primary Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/os" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/os') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>OS Cockpit</Link>
          <Link href="/proof" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/proof') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>Canonical Proof</Link>
          <Link href="/demo" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/demo') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>Harness Demo</Link>
          <Link href="/architecture" className={`text-xs font-mono uppercase tracking-wide transition-colors ${pathname.startsWith('/architecture') ? 'text-theme-accent font-bold' : 'text-theme-inkDim hover:text-theme-ink'}`}>Architecture</Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <Link href="/machine" className="hidden lg:inline-flex text-xs font-mono text-theme-inkDim hover:text-theme-accent transition-colors uppercase">
            [Machine Surface]
          </Link>
          <div className="h-4 w-px bg-theme-border hidden lg:block"></div>
          <ThemeToggle />
          <Link href="/login" className="px-4 py-1.5 bg-theme-ink text-theme-bg hover:opacity-90 transition-opacity text-xs font-mono uppercase font-bold rounded">
            Access OS
          </Link>
        </div>

      </div>
    </header>
  );
}
