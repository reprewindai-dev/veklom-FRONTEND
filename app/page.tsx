import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { ProofChip, CapabilityLifecycle } from "@/components/ui/SharedUI";

const constitutionalRules = [
  ["01", "Identity", "A machine execution is attributable before consequence."],
  ["02", "Authority", "Capability is bounded by scope, policy, budget, and time."],
  ["03", "Consequence", "Execution crosses a fail-closed governed boundary."],
  ["04", "Evidence", "The result is bound back to the authority that permitted it."],
];

export default function LandingPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] border-b border-theme-border bg-theme-surface2 opacity-40" />

        <section className="relative max-w-7xl mx-auto px-6 pt-10 md:pt-16 pb-20 md:pb-28 w-full">
          <div className="flex items-center flex-wrap gap-2 pb-7 border-b border-theme-border">
            <ProofChip label="FOUNDATIONAL BASELINE SEALED" state="verified" />
            <ProofChip label="6 CONSTITUTIONAL INVARIANTS" state="verified" />
            <ProofChip label="INBOUND TRUTH" state="verified" />
            <ProofChip label="FAIL-CLOSED" state="verified" />
            <ProofChip label="ACTIVATION IN PROGRESS" state="info" />
          </div>

          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)] gap-14 lg:gap-20 pt-14 md:pt-20 items-start">
            <div>
              <div className="inline-flex items-center gap-3 mb-7 font-mono text-[11px] font-bold uppercase tracking-[0.24em] text-theme-accent">
                <span className="inline-block w-8 h-px bg-theme-accent" />
                Machine Authority Infrastructure
              </div>

              <h1 className="max-w-5xl text-5xl sm:text-6xl md:text-7xl lg:text-[5.4rem] font-sans font-semibold tracking-[-0.045em] leading-[0.94] text-theme-ink mb-8">
                Govern what machines are allowed to cause.
              </h1>

              <p className="max-w-3xl text-lg md:text-2xl text-theme-inkDim leading-relaxed mb-10">
                Models create capability. <span className="text-theme-ink font-medium">Veklom governs consequence.</span> Give automation bounded authority to act across real systems, then preserve evidence of what actually happened.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Link
                  href="/get"
                  className="group inline-flex min-h-14 items-center justify-between gap-8 rounded border border-theme-ink bg-theme-ink px-6 py-4 text-theme-bg font-bold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <span>Get Veklom</span>
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/proof"
                  className="inline-flex min-h-14 items-center justify-center rounded border border-theme-border bg-theme-surface px-6 py-4 text-theme-ink font-bold transition-colors hover:border-theme-accent"
                >
                  Inspect the proof
                </Link>
              </div>

              <p className="font-mono text-[11px] uppercase tracking-wider text-theme-inkDim">
                Start with a governed workspace. No synthetic demo required.
              </p>
            </div>

            <aside className="relative lg:mt-3">
              <div className="absolute -inset-3 border border-theme-border opacity-40 rounded" aria-hidden="true" />
              <div className="relative border border-theme-border bg-theme-surface shadow-sm rounded overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border bg-theme-surface2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-theme-inkDim">The consequence boundary</span>
                  <span className="font-mono text-[10px] font-bold text-theme-verified">FAIL CLOSED</span>
                </div>
                <div className="p-5 md:p-6 space-y-1">
                  {constitutionalRules.map(([num, title, text]) => (
                    <div key={num} className="grid grid-cols-[42px_1fr] gap-3 py-4 border-b border-theme-border last:border-b-0">
                      <span className="font-mono text-[10px] text-theme-inkDim">{num}</span>
                      <div>
                        <div className="font-mono text-xs font-bold uppercase tracking-widest text-theme-ink mb-1.5">{title}</div>
                        <p className="text-sm leading-relaxed text-theme-inkDim">{text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-theme-border px-5 py-4 font-mono text-[11px] text-theme-ink">
                  CAPABILITY <span className="text-theme-accent">≠</span> AUTHORITY
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="relative border-y border-theme-border bg-theme-surface">
          <div className="max-w-7xl mx-auto px-6 py-16 md:py-20 grid lg:grid-cols-[0.72fr_1.28fr] gap-12 lg:gap-20">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-theme-accent mb-4">The invariant</p>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight text-theme-ink">
                Capability without authority produces no consequence.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-px bg-theme-border border border-theme-border">
              <div className="bg-theme-bg p-6 md:p-7">
                <div className="font-mono text-[10px] uppercase tracking-widest text-theme-inkDim mb-7">Authority monotonicity</div>
                <p className="text-lg text-theme-ink leading-relaxed">Authority can be preserved or narrowed. It cannot silently widen as work moves across systems.</p>
              </div>
              <div className="bg-theme-bg p-6 md:p-7">
                <div className="font-mono text-[10px] uppercase tracking-widest text-theme-inkDim mb-7">Explicit uncertainty</div>
                <p className="text-lg text-theme-ink leading-relaxed">Unknown outcomes stay unknown until reconciliation. Veklom does not manufacture success.</p>
              </div>
              <div className="bg-theme-bg p-6 md:p-7">
                <div className="font-mono text-[10px] uppercase tracking-widest text-theme-inkDim mb-7">Inbound truth</div>
                <p className="text-lg text-theme-ink leading-relaxed">Context does not become authority merely because another system reported it.</p>
              </div>
              <div className="bg-theme-bg p-6 md:p-7">
                <div className="font-mono text-[10px] uppercase tracking-widest text-theme-inkDim mb-7">Evidence continuity</div>
                <p className="text-lg text-theme-ink leading-relaxed">Proof binds identity, authority, constraints, and the actual consequence.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 border border-theme-border bg-theme-surface p-7 md:p-10 rounded">
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-theme-accent mb-5">Sealed foundation</div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-theme-ink mb-5">The foundation is no longer the product question.</h2>
              <p className="max-w-3xl text-base md:text-lg text-theme-inkDim leading-relaxed mb-8">
                The foundational baseline covers bounded consequence authority, fail-closed rejection, disruption-safe finality, offline authority behavior, independent ingress, and evidence-backed replay/idempotency behavior. Product work now builds on that boundary instead of repeatedly redefining it.
              </p>
              <Link href="/conformance" className="font-mono text-xs font-bold uppercase tracking-widest text-theme-ink hover:text-theme-accent transition-colors">
                Read conformance →
              </Link>
            </div>

            <div className="border border-theme-border bg-theme-ink text-theme-bg p-7 md:p-10 rounded flex flex-col justify-between min-h-[320px]">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-5">Activation v1</div>
                <h2 className="text-3xl font-semibold tracking-tight leading-tight mb-4">See authority work, not just read about it.</h2>
                <p className="text-sm leading-relaxed opacity-75">
                  The current product gate is a first-run path from bounded grant to allowed consequence, intentional denial, and inspectable evidence.
                </p>
              </div>
              <Link href="/get" className="mt-10 inline-flex items-center justify-between border-t border-current/25 pt-5 font-bold">
                Start with Veklom <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        <CapabilityLifecycle />

        <div className="fixed z-40 bottom-5 right-5 hidden md:block">
          <Link
            href="/get"
            className="group flex items-center gap-5 rounded border border-theme-ink bg-theme-ink px-5 py-3.5 text-theme-bg shadow-xl transition-transform hover:-translate-y-1"
          >
            <span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.18em] opacity-60">Machine authority starts here</span>
              <span className="block text-sm font-bold">Get Veklom</span>
            </span>
            <span aria-hidden="true" className="text-xl transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </main>
    </HumanAppShell>
  );
}
