"use client";

import { ReactNode } from "react";
import { ShieldCheck, Network, Lock, Activity } from "lucide-react";
import { LogoWordmark } from "./Logo";

const HIGHLIGHTS = [
  { icon: Network, title: "Smart routing", desc: "Every prompt routed across providers by policy and cost." },
  { icon: ShieldCheck, title: "Governed by default", desc: "HIPAA, SOC2, PCI-DSS, GDPR — evidence on every call." },
  { icon: Lock, title: "Sovereign perimeter", desc: "Your keys, your region, your audit trail. No leakage." },
  { icon: Activity, title: "Live observability", desc: "Spend, latency, and policy interceptions in real time." },
];

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen w-full grid lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-border">
        <div className="absolute inset-0 -z-10 brand-glow opacity-40" />
        <div className="flex items-center gap-3">
          <LogoWordmark height={30} />
          <span className="text-[10px] text-ink-400 uppercase tracking-[0.2em] border-l border-border pl-3">Control Plane</span>
        </div>

        <div className="max-w-md animate-fade-up">
          <h2 className="text-3xl font-semibold leading-tight text-gradient">
            The sovereign AI control plane.
          </h2>
          <p className="text-sm text-ink-400 mt-3">
            Watch every prompt routed, policed, and audited — on your perimeter, your keys, your region.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3">
                <div className="mt-0.5 w-9 h-9 rounded-lg glass grid place-items-center text-brand-400 shrink-0">
                  <h.icon size={16} />
                </div>
                <div>
                  <div className="text-sm font-medium text-ink-50">{h.title}</div>
                  <div className="text-xs text-ink-400">{h.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-[11px] text-ink-600">
          © {new Date().getFullYear()} Veklom · Sovereign AI Hub
        </div>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <LogoWordmark height={28} />
          </div>

          <div className="card p-8">
            <div className="text-[11px] text-brand-400 uppercase tracking-[0.2em] mb-2">{eyebrow}</div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-ink-400 mt-2">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
