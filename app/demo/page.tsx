import React from 'react';
import Link from 'next/link';
import { HumanAppShell } from "@/components/shell/HumanAppShell";

const demos = [
  {
    id: "governed-machine",
    title: "Governed Machine Demo",
    description: "Watch a machine request a consequential action. Attack it from every angle: over-authority, tamper, race, unknown outcome, replay.",
    badge: "LIVE HARNESS",
    badgeColor: "text-theme-verified border-theme-verified/40 bg-theme-verified/10",
    href: "/demo/governed-machine",
    steps: 6,
  },
  {
    id: "p5-proof",
    title: "P5 Truth-State Proof",
    description: "Canonical evidence at tag veklom-p5-closure-v1. 75/75 adversarial tests. TLC safety checked. Liveness not claimed.",
    badge: "CANONICAL",
    badgeColor: "text-theme-verified border-theme-verified/40 bg-theme-verified/10",
    href: "/proof",
    steps: null,
  },
  {
    id: "network-lease",
    title: "NetworkLease / Tunnel Demo",
    description: "CAPPO authorizes a NetworkLease. A Cloudflare Tunnel hostname exists because the lease exists. Revoke the lease, the hostname becomes DENY.",
    badge: "LAB",
    badgeColor: "text-theme-warn border-theme-warn/40 bg-theme-warn/10",
    href: "#",
    steps: null,
  },
] as const;

export const metadata = {
  title: "Demo Hub | Veklom",
  description: "Interactive demonstrations of governed machine action.",
};

export default function DemoPage() {
  return (
    <HumanAppShell>
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-sans font-bold mb-4 text-theme-ink">Veklom Demo Hub</h1>
          <p className="text-theme-inkDim text-lg max-w-2xl leading-relaxed">
            Interactive demonstrations of governed machine action. These are not static mockups;
            they are functional slices of the Capability OS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <Link
              key={demo.id}
              href={demo.href}
              className={`group block bg-theme-surface border border-theme-border rounded p-6 shadow-sm hover:border-theme-accent transition-all ${
                demo.href === "#" ? "opacity-60 cursor-not-allowed pointer-events-none" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${demo.badgeColor}`}>
                  {demo.badge}
                </span>
                {demo.steps && (
                  <span className="font-mono text-[10px] text-theme-inkDim uppercase tracking-widest">
                    {demo.steps} Steps
                  </span>
                )}
              </div>
              
              <h2 className="text-lg font-bold font-mono tracking-wide text-theme-ink mb-2 group-hover:text-theme-accent transition-colors">
                {demo.title}
              </h2>
              <p className="text-sm text-theme-inkDim leading-relaxed">
                {demo.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
    </HumanAppShell>
  );
}

