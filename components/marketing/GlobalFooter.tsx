"use client";

import Link from "next/link";
import React from "react";
import { PremiumLogo } from "@/components/brand/PremiumPrimitives";

interface GlobalFooterProps {
  isMachine?: boolean;
}

const groups = [
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

export function GlobalFooter({ isMachine = true }: GlobalFooterProps) {
  return (
    <footer
      className="relative z-20 mt-24 border-t border-rule px-6 py-14 text-sm text-cos-text/60 transition-colors duration-500 data-[machine=true]:border-wire data-[machine=true]:text-cos-text/50 lg:px-12"
      data-machine={isMachine}
    >
      <div className="mx-auto grid max-w-7xl gap-12 xl:grid-cols-[1fr_2fr]">
        <div>
          <PremiumLogo />
          <p className="mt-6 max-w-sm font-sans text-sm leading-7 text-cos-text/55">
            Governed machine action infrastructure. Authority before consequence. Evidence after execution. No residual agency after termination.
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <h4 className="mb-2 text-[10px] font-bold uppercase tracking-[.2em] text-cos-text/40">{group.title}</h4>
              {group.links.map(([href, label]) => (
                <Link key={href} href={href} className="transition-colors hover:text-cos-accent">{label}</Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-14 flex max-w-7xl flex-col gap-4 border-t border-rule pt-7 text-xs data-[machine=true]:border-wire md:flex-row md:items-center md:justify-between">
        <div>&copy; {new Date().getFullYear()} VEKLOM · governed machine infrastructure</div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/.well-known/security.txt" className="hover:text-cos-text">security.txt</Link>
          <Link href="/privacy" className="hover:text-cos-text">Privacy</Link>
          <Link href="/terms" className="hover:text-cos-text">Terms</Link>
          <Link href="/support" className="hover:text-cos-text">Support</Link>
        </div>
      </div>
    </footer>
  );
}
