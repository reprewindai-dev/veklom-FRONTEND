import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, AuthorityOrb, LiveSignal, StageLabel } from "@/components/brand/PremiumPrimitives";
import { LiveProofFabric } from "@/components/proof/LiveProofFabric";

const laws = [
  { index: "01", title: "Authority", body: "Every consequence begins inside an explicit identity, policy, budget and time boundary." },
  { index: "02", title: "Evidence", body: "Execution does not become truth because a model says it succeeded. Outcomes remain bound to observable evidence." },
  { index: "03", title: "Agency", body: "Execution identity is temporary. When the execution ends, its authority ends with it." },
];

const flow = ["Mount capability", "Bind authority", "Execute", "Observe", "Reconcile", "Preserve evidence"];

export default function LandingPage() {
  return (
    <HumanAppShell>
      <div className="relative overflow-hidden">
        <AmbientField />

        <section className="relative mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1480px] items-center gap-12 px-5 py-16 sm:px-8 md:py-20 lg:grid-cols-[1.04fr_.96fr] lg:gap-16 lg:px-10 xl:py-24">
          <div className="relative z-10 max-w-[760px]">
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <LiveSignal label="Capability OS · early access" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-inkDim">Governed machine action</span>
            </div>

            <h1 className="text-[clamp(4rem,8.6vw,8.8rem)] font-semibold leading-[0.82] tracking-[-0.075em] text-theme-ink">
              Give machines<br />capability.<br /><span className="text-theme-inkDim">Not a blank check.</span>
            </h1>

            <p className="mt-9 max-w-2xl text-lg leading-8 text-theme-inkDim md:text-[1.35rem] md:leading-9">
              Veklom is the authority layer between machine intent and real-world consequence. Mount a capability, bind it to policy, budget and time, execute through a governed boundary, then preserve what actually happened.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/login?returnTo=/os" className="group inline-flex min-h-14 items-center justify-center gap-5 rounded-full bg-theme-ink px-7 text-sm font-semibold text-theme-bg shadow-[0_20px_55px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,0,0,.22)]">
                Open Capability OS <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/proof" className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-surface/70 px-7 text-sm font-semibold text-theme-ink backdrop-blur transition hover:border-theme-ink/20 hover:bg-theme-surface">Inspect live proof</Link>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-theme-border pt-6">
              <div><div className="text-[10px] uppercase tracking-[.2em] text-theme-inkDim">Authority</div><div className="mt-2 text-sm font-medium text-theme-ink">Bound before action</div></div>
              <div><div className="text-[10px] uppercase tracking-[.2em] text-theme-inkDim">Evidence</div><div className="mt-2 text-sm font-medium text-theme-ink">Observed after action</div></div>
              <div><div className="text-[10px] uppercase tracking-[.2em] text-theme-inkDim">Agency</div><div className="mt-2 text-sm font-medium text-theme-ink">Ends at termination</div></div>
            </div>
          </div>

          <div className="relative z-10 lg:translate-x-3">
            <AuthorityOrb />
          </div>
        </section>

        <section className="relative border-y border-theme-border bg-theme-surface/68 backdrop-blur-xl">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.68fr_1.32fr] lg:px-10">
            <div>
              <StageLabel>The operating law</StageLabel>
              <h2 className="mt-6 max-w-md text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">A machine can know what to do and still not be allowed to do it.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[26px] border border-theme-border bg-theme-border md:grid-cols-3">
              {laws.map((law) => (
                <article key={law.index} className="min-h-[320px] bg-theme-bg p-7 md:p-8">
                  <div className="text-[10px] font-semibold tracking-[.2em] text-theme-inkDim">{law.index}</div>
                  <h3 className="mt-20 text-2xl font-semibold tracking-[-.035em] text-theme-ink">{law.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-theme-inkDim">{law.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <StageLabel>No synthetic green lights</StageLabel>
              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">Look at the system that is actually answering.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-theme-inkDim">This surface probes real Veklom service endpoints. If something is unavailable, it shows unavailable. It does not replace consequence-level proof with a canned demo.</p>
          </div>
          <LiveProofFabric compact />
        </section>

        <section className="relative overflow-hidden border-y border-theme-border bg-[#05070b] text-white">
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_20%,rgba(103,232,249,.18),transparent_26%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,.16),transparent_28%)]" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-[1480px] gap-14 px-5 py-24 sm:px-8 md:py-32 lg:grid-cols-[.85fr_1.15fr] lg:px-10">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">From intent to evidence</div>
              <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[.96] tracking-[-.055em] md:text-6xl">The action disappears. The evidence does not.</h2>
              <p className="mt-7 max-w-lg text-base leading-8 text-white/58">Veklom is designed for temporary execution identity and durable consequence evidence. The machine does its job, authority terminates, and the record remains inspectable.</p>
            </div>
            <div className="grid content-center gap-3">
              {flow.map((item, index) => (
                <div key={item} className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[.035] px-5 py-4 backdrop-blur transition hover:border-cyan-300/25 hover:bg-white/[.055]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold text-white/42">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-medium tracking-[-.01em] text-white/88">{item}</span>
                  <span className="ml-auto text-white/25 transition group-hover:translate-x-1 group-hover:text-cyan-200">→</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="relative overflow-hidden rounded-[36px] border border-theme-border bg-theme-surface px-6 py-14 shadow-[0_40px_120px_rgba(2,8,23,.08)] sm:px-10 md:px-14 md:py-20">
            <div className="absolute right-[-7rem] top-[-8rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(var(--theme-accent)/.18),transparent_68%)] blur-2xl" aria-hidden="true" />
            <div className="relative grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <StageLabel>Capability OS</StageLabel>
                <h2 className="mt-6 max-w-4xl text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-7xl">Machines are starting to act. Give them a boundary worth trusting.</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link href="/login?returnTo=/os" className="inline-flex min-h-14 items-center justify-center rounded-full bg-theme-ink px-7 text-sm font-semibold text-theme-bg">Open Capability OS →</Link>
                <Link href="/architecture" className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-bg px-7 text-sm font-semibold text-theme-ink">See architecture</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HumanAppShell>
  );
}
