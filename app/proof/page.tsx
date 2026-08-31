import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";
import { LiveProofFabric } from "@/components/proof/LiveProofFabric";

export const metadata = {
  title: "Live Proof | Veklom",
  description: "Observed Veklom runtime state and consequence-proof boundaries.",
};

const proofLevels = [
  {
    n: "01",
    title: "Reachability",
    body: "A declared service answers from the runtime endpoint that is actually configured. No simulated availability state is substituted.",
  },
  {
    n: "02",
    title: "Authority",
    body: "An authenticated execution must carry authority that is valid for the requested consequence. Public health does not prove authorization.",
  },
  {
    n: "03",
    title: "Consequence",
    body: "A real action is observed or reconciled. Unknown outcomes remain unknown instead of being promoted to success.",
  },
  {
    n: "04",
    title: "Evidence",
    body: "The resulting evidence binds the execution back to the authority and observed result. That proof belongs to the governed execution itself.",
  },
];

export default function ProofPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-60" />

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-14 pt-20 sm:px-8 md:pb-20 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Proof, not theater"
            title="See what is actually alive."
            body="Veklom's public proof surface no longer runs a canned success harness. It observes real service endpoints, exposes degradation when it exists, and keeps consequence-level claims behind real governed execution."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <LiveProofFabric />
        </section>

        <section className="border-y border-theme-border bg-theme-surface/68">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
            <div>
              <StageLabel>What a proof means</StageLabel>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">Green health is not the same thing as governed consequence.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-theme-inkDim">The public surface intentionally separates transport liveness from authority and evidence. That keeps the website from claiming more than the runtime has actually shown.</p>
            </div>

            <div className="grid gap-px overflow-hidden rounded-[26px] border border-theme-border bg-theme-border sm:grid-cols-2">
              {proofLevels.map((item) => (
                <article key={item.n} className="min-h-[280px] bg-theme-bg p-7 md:p-8">
                  <div className="text-[10px] font-semibold tracking-[.22em] text-theme-inkDim">{item.n}</div>
                  <h3 className="mt-14 text-2xl font-semibold tracking-[-.035em] text-theme-ink">{item.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-theme-inkDim">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[30px] border border-theme-border bg-[#05070b] p-7 text-white sm:p-9 md:p-12">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">Consequence-level proof</div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.02] tracking-[-.045em] md:text-5xl">Run the real path inside Capability OS.</h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/58">A real proof run requires authenticated authority, an actual requested capability, an execution identity, and the resulting evidence. That is not something the public landing page should forge for visual effect.</p>
              <Link href="/login?returnTo=/os" className="mt-9 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black">Enter Capability OS →</Link>
            </div>

            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 sm:p-9 md:p-12">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Machine inspection</div>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-theme-ink">Prefer raw surfaces?</h2>
              <p className="mt-5 text-sm leading-7 text-theme-inkDim">Use the machine interface for protocol discovery, route surfaces, service observation, and machine-readable endpoints rather than a marketing abstraction.</p>
              <div className="mt-9 grid gap-2">
                <Link href="/machine" className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink">Open machine surface <span>↗</span></Link>
                <Link href="/conformance" className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink">Read conformance <span>↗</span></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
