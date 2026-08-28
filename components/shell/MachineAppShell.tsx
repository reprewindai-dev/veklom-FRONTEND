"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MachineAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  
  // Force machine theme on this shell without touching localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'machine');
    return () => {
      // Re-evaluate human theme from localStorage when unmounting
      const humanTheme = localStorage.getItem('veklom-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', humanTheme);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col min-h-screen font-mono selection:bg-theme-accent/20" data-theme="machine">
      <header className="border-b border-theme-border bg-theme-bg py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4"><img src="/logo.jpg" alt="Veklom Machine Logo" className="w-8 h-8 rounded-sm grayscale border border-theme-border/50" /><div><h1 className="text-sm font-bold tracking-widest text-theme-ink uppercase">Veklom / Machine Protocol</h1>
            <p className="text-theme-inkDim text-[10px] mt-1">v1.0.0 &middot; capability-os-governance-engine</p>
          </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <span className="px-2 py-0.5 bg-theme-surface border border-theme-border text-[10px] text-theme-info font-bold uppercase">STATUS: ONLINE</span>
              <span className="px-2 py-0.5 bg-theme-surface border border-theme-border text-[10px] text-theme-verified font-bold uppercase">P5/C0 VERIFIED</span>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-theme-inkDim hover:text-theme-ink transition-colors border border-theme-border bg-theme-surface px-3 py-1.5 rounded-sm shadow-sm">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Human
            </Link>
          </div>
        </div>
      </header>

      <div className="border-b border-theme-border bg-theme-surface2 text-[10px] uppercase tracking-widest text-theme-inkDim py-2 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-6 flex gap-6 whitespace-nowrap">
          <Link href="/machine" className={`hover:text-theme-ink ${pathname === '/machine' ? 'text-theme-ink font-bold' : ''}`}>MANIFEST</Link>
          <Link href="/machine/claims.json" className="hover:text-theme-ink">CLAIM_REGISTRY</Link>
          <Link href="/machine/conformance.json" className="hover:text-theme-ink">CONFORMANCE_MATRIX</Link>
          <Link href="/machine/evidence-index.json" className="hover:text-theme-ink">EVIDENCE_INDEX</Link>
          <Link href="/machine/openapi.json" className="hover:text-theme-ink">OPENAPI</Link>
          <Link href="/mcp" className={`hover:text-theme-ink ${pathname.startsWith('/mcp') ? 'text-theme-ink font-bold' : ''}`}>MCP_TOOLS</Link>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {children}
      </main>
    </div>
  );
}


