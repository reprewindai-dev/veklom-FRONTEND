import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";
import { LiveProofFabric } from "@/components/proof/LiveProofFabric";

export const metadata = {
  title: "Proof | Veklom Governed Compute",
  description: "What Veklom has demonstrated, what remains unproven, and the live runtime surfaces available today.",
};

const proofLevels = [
  {
    n: "01",
    title: "Real route authority",
    body: "The current proof branch exercises the real /v1/exec consequence boundary with bounded capability leases and Biscuit authority. Invalid authority, wrong executor, mutated intent and inactive mounts are rejected.",
  },
  {
    n: "02",
    title: "Common contract",
    body: "Persistent-service and ephemeral execution token types are both represented in the capability-mount contract and can traverse the same governed execution route. Lifecycle policy differs; bounded authority remains explicit.",
  },
  {
    n: "03",
    title: "Workspace isolation",
    body: "Execution context is workspace-bound. A capability mounted to one workspace is not valid in another authenticated workspace. This is an authority boundary, not a UI convention.",
  },
  {
    n: "04",
    title: "Consequence evidence",
    body: "The stronger Activation path can re-observe durable target state directly. Generic provider execution still needs stronger independent consequence establishment before it should be called fully proven.",
  },
];

const claims = [
  ["Demonstrated", "A real HTTP execution path is dominated by capability lease checks, scoped authority and a common governed execution handler."],
  ["Demonstrated", "Persistent and ephemeral execution modes can share the same capability/authority contract shape while carrying different lifecycle semantics."],
  ["Demonstrated", "Workspace scope mismatch, invalid/incorrect authority, mutated action intent and inactive capability context can fail closed."],
  ["Not yet proven", "Wasmtime and Firecracker are not yet established as real interchangeable execution substrates under the same Veklom contract."],
  ["Not yet proven", "Generic executor success is not yet equivalent to independently established business consequence."],
  ["Not yet proven", "Cross-provider production-scale governed compute, host-compromise resistance and hardware isolation remain outside the current proof."],
];

export default function ProofPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-60" />

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-14 pt-20 sm:px-8 md:pb-20 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Governed compute proof"
            title="What is demonstrated. What is still a thesis."
            body="Veklom's proof surface separates live reachability, authority enforcement, lifecycle behavior and consequence establishment. The current evidence supports a real governed execution path across persistent and ephemeral capability contexts. It does not yet support calling every runtime or every consequence independently proven."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/os" className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg">Open Capability OS →</Link>
            <Link href="/vlink" className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink">Connect existing system</Link>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <LiveProofFabric />
        </section>

        <section className="border-y border-theme-border bg-theme-surface/68">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
            <div>
              <StageLabel>Current proof boundary</StageLabel>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">The governed execution path is real. The full cloud thesis is not sealed yet.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-theme-inkDim">This distinction matters. The proof supports bounded authority across the actual execution route and a shared persistent/ephemeral contract. It does not yet prove real multi-hypervisor materialization or universal consequence truth.</p>
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
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-[30px] border border-theme-border bg-[#05070b] p-7 text-white sm:p-9 md:p-12">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">Claim ledger</div>
              <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.02] tracking-[-.045em] md:text-5xl">Use the strong claim. Keep the boundary visible.</h2>
              <div className="mt-8 space-y-4">
                {claims.map(([status, body], index) => (
                  <div key={`${status}-${index}`} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                    <div className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/45">{status}</div>
                    <p className="mt-2 text-sm leading-7 text-white/72">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 sm:p-9 md:p-12">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Available today</div>
              <h2 className="mt-5 text-3xl font-semibold tracking-[-.045em] text-theme-ink">Capability OS is the product surface.</h2>
              <p className="mt-5 text-sm leading-7 text-theme-inkDim">People should be able to enter the current Capability OS, inspect available capabilities, use the surfaces that are already wired, and connect existing systems through VLink as those routes are brought online. Early access should expose what exists rather than hiding it behind a future-state promise.</p>
              <div className="mt-9 grid gap-2">
                <Link href="/os" className="flex min-h-12 items-center justify-between rounded-2xl bg-theme-ink px-4 text-sm font-semibold text-theme-bg">Open Capability OS <span>→</span></Link>
                <Link href="/vlink" className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink">Connect with VLink <span>↗</span></Link>
                <Link href="/machine" className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink">Machine surface <span>↗</span></Link>
                <Link href="/conformance" className="flex min-h-12 items-center justify-between rounded-2xl border border-theme-border bg-theme-bg px-4 text-sm font-medium text-theme-ink">Conformance boundary <span>↗</span></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
