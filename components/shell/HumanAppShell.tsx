"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { PremiumLogo } from "@/components/brand/PremiumPrimitives";

const navItems = [
  ["/proof", "Proof"],
  ["/architecture", "Architecture"],
  ["/conformance", "Conformance"],
  ["/docs", "Docs"],
  ["/machine", "Machine"],
] as const;

const footerGroups = [
  {
    title: "Capability OS",
    links: [
      ["/byos", "BYOS Runtime"],
      ["/lockerphycer", "LockerPhycer"],
      ["/cappo", "CAPPO"],
      ["/capi", "cAPI"],
      ["/vlink", "VLink"],
      ["/guardian", "Guardian"],
    ],
  },
  {
    title: "Evidence & Network",
    links: [
      ["/pgl", "PGL / Gnomledger"],
      ["/eee", "EEE"],
      ["/vnp", "VNP"],
      ["/vcgb", "VCGB"],
      ["/proof", "Live Proof"],
      ["/conformance", "Conformance"],
    ],
  },
  {
    title: "Developers",
    links: [
      ["/docs", "Documentation"],
      ["/api", "API Directory"],
      ["/architecture", "Architecture"],
      ["/security", "Security"],
      ["/status", "System Status"],
      ["/support", "Support"],
    ],
  },
  {
    title: "Legal & Trust",
    links: [
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
      ["/acceptable-use", "Acceptable Use"],
      ["/cookies", "Cookies"],
      ["/dpa", "Data Processing Addendum"],
      ["/subprocessors", "Subprocessors"],
    ],
  },
] as const;

export function HumanAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen flex-1 flex-col overflow-x-hidden bg-theme-bg font-sans text-theme-ink">
      <header className="sticky top-0 z-50 border-b border-theme-border bg-theme-bg/78 backdrop-blur-2xl supports-[backdrop-filter]:bg-theme-bg/72">
        <div className="mx-auto flex h-[72px] w-full max-w-[1480px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <PremiumLogo />

          <nav className="hidden items-center gap-1 rounded-full border border-theme-border bg-theme-surface/72 p-1 md:flex" aria-label="Primary navigation">
            {navItems.map(([href, label]) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-full px-4 py-2 text-[12px] font-medium transition ${active ? "bg-theme-ink text-theme-bg shadow-sm" : "text-theme-inkDim hover:bg-theme-surface2 hover:text-theme-ink"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block"><ThemeToggle /></div>
            <Link href="/login" className="hidden rounded-full px-4 py-2 text-[12px] font-medium text-theme-inkDim transition hover:text-theme-ink md:inline-flex">Sign in</Link>
            <Link href="/login?returnTo=/os" className="group inline-flex min-h-10 items-center gap-3 rounded-full bg-theme-ink px-4 text-[12px] font-semibold text-theme-bg shadow-[0_10px_30px_rgba(0,0,0,.12)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(0,0,0,.18)] sm:px-5">
              Open Capability OS <span className="transition-transform group-hover:translate-x-0.5">↗</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-theme-border bg-theme-surface md:hidden"
              aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-theme-border bg-theme-bg/96 px-5 py-5 backdrop-blur-2xl md:hidden">
            <nav className="mx-auto grid max-w-[1480px] gap-1">
              {navItems.map(([href, label]) => (
                <Link key={href} href={href} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-medium text-theme-ink transition hover:bg-theme-surface">
                  {label}<span className="text-theme-inkDim">↗</span>
                </Link>
              ))}
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-theme-border pt-4">
                <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface text-sm font-medium">Sign in</Link>
                <div className="flex min-h-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface"><ThemeToggle /></div>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex w-full min-w-0 flex-1 flex-col">{children}</main>

      <footer className="mt-auto border-t border-theme-border bg-theme-surface/55">
        <div className="mx-auto w-full max-w-[1480px] px-5 py-14 sm:px-8 md:py-16 lg:px-10">
          <div className="grid gap-12 xl:grid-cols-[1.05fr_1.95fr]">
            <div>
              <PremiumLogo />
              <p className="mt-5 max-w-md text-sm leading-7 text-theme-inkDim">Governed machine action infrastructure. Authority before consequence. Evidence after execution. No residual agency after termination.</p>
              <div className="mt-8 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-theme-inkDim">
                <span className="rounded-full border border-theme-border bg-theme-bg px-3 py-1.5">Canada-first</span>
                <span className="rounded-full border border-theme-border bg-theme-bg px-3 py-1.5">Sovereign runtime</span>
                <span className="rounded-full border border-theme-border bg-theme-bg px-3 py-1.5">Evidence-led</span>
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {footerGroups.map((group) => (
                <div key={group.title}>
                  <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">{group.title}</div>
                  <div className="mt-5 grid gap-3 text-sm">
                    {group.links.map(([href, label]) => (
                      <Link key={href} href={href} className="text-theme-inkDim transition hover:translate-x-0.5 hover:text-theme-ink">{label}</Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-theme-border">
          <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-3 px-5 py-5 text-[11px] text-theme-inkDim sm:px-8 md:flex-row md:items-center md:justify-between lg:px-10">
            <span>© {new Date().getFullYear()} Veklom · Governed machine infrastructure</span>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Link href="/.well-known/security.txt" className="hover:text-theme-ink">security.txt</Link>
              <Link href="/privacy" className="hover:text-theme-ink">Privacy</Link>
              <Link href="/terms" className="hover:text-theme-ink">Terms</Link>
              <Link href="/support" className="hover:text-theme-ink">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
