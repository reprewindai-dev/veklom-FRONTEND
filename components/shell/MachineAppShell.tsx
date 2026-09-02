"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { VeklomMark } from "@/components/brand/PremiumPrimitives";

const routes = [
  ["/machine", "Runtime"],
  ["/machine/claims.json", "Claims"],
  ["/machine/conformance.json", "Conformance"],
  ["/machine/evidence-index.json", "Evidence"],
  ["/machine/openapi.json", "OpenAPI"],
  ["/mcp", "MCP"],
] as const;

export function MachineAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "machine");
    return () => {
      const humanTheme = localStorage.getItem("veklom-theme") || "dark";
      document.documentElement.setAttribute("data-theme", humanTheme);
    };
  }, []);

  return (
    <div className="min-h-screen flex-1 bg-theme-bg font-mono text-theme-ink" data-theme="machine">
      <header className="sticky top-0 z-50 border-b border-theme-border bg-theme-bg/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] w-full max-w-[1540px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <Link href="/machine" className="group flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-theme-border bg-theme-surface text-theme-ink shadow-[0_10px_30px_rgba(0,0,0,.25)]">
              <VeklomMark className="h-8 w-8 object-contain grayscale" />
            </span>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[.22em] text-theme-ink">Veklom / machine</div>
              <div className="mt-1 text-[9px] uppercase tracking-[.18em] text-theme-inkDim">runtime truth surface</div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/proof/live" className="hidden rounded-full border border-theme-border bg-theme-surface px-3 py-2 text-[9px] font-semibold uppercase tracking-[.16em] text-theme-inkDim transition hover:text-theme-ink sm:inline-flex">raw runtime json ↗</a>
            <Link href="/" className="inline-flex min-h-10 items-center justify-center rounded-full bg-theme-ink px-4 text-[10px] font-semibold uppercase tracking-[.16em] text-theme-bg transition hover:opacity-90">Human surface →</Link>
          </div>
        </div>

        <div className="border-t border-theme-border/70">
          <nav className="mx-auto flex w-full max-w-[1540px] gap-1 overflow-x-auto px-5 py-2 sm:px-8 lg:px-10" aria-label="Machine protocol navigation">
            {routes.map(([href, label]) => {
              const active = pathname === href || (href !== "/machine" && pathname.startsWith(href));
              return (
                <Link key={href} href={href} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.18em] transition ${active ? "bg-theme-surface2 text-theme-ink" : "text-theme-inkDim hover:bg-theme-surface hover:text-theme-ink"}`}>{label}</Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1540px] px-5 py-8 sm:px-8 md:py-12 lg:px-10">{children}</main>
    </div>
  );
}
