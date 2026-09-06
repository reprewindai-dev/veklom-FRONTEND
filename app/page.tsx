import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, AuthorityOrb, LiveSignal, StageLabel } from "@/components/brand/PremiumPrimitives";
import { LiveProofFabric } from "@/components/proof/LiveProofFabric";

const laws = [
  { index: "01", title: "Authority", body: "Every execution begins inside an explicit identity, capability, policy, budget and time boundary." },
  { index: "02", title: "Lifecycle", body: "Persistent and ephemeral compute can share the same authority semantics. Lifecycle changes; authority does not become ambient." },
  { index: "03", title: "Evidence", body: "Execution does not become truth because a runtime says it succeeded. Consequences remain bound to observable evidence." },
];

const demands = [
  { title: "Bound what can execute.", body: "Define what the machine may do, what it may touch, what it may spend, how long the authority lasts, and which execution context is allowed to use it." },
  { title: "Use the same contract across compute.", body: "A long-lived service and a short-lived execution should not require two unrelated trust models. Veklom keeps the capability contract stable while lifecycle policy changes." },
  { title: "Keep consequence separate from claim.", body: "An executor claiming success is not enough. Veklom is built to preserve the distinction between authorization, execution, observation and established outcome." },
  { title: "Leave evidence after compute disappears.", body: "Execution can be temporary. The authority record, consequence evidence and causal history are designed to remain inspectable after the runtime is gone." },
];

const flow = ["Request capability", "Bind authority", "Materialize compute", "Execute", "Observe consequence", "Preserve evidence"];

export default function LandingPage() {
  return (
    <HumanAppShell>
      <div className="relative overflow-hidden">
        <AmbientField />

        <section className="relative mx-auto grid min-h-[calc(100vh-72px)] w-full max-w-[1480px] items-center gap-12 px-5 py-16 sm:px-8 md:py-20 lg:grid-cols-[1.04fr_.96fr] lg:gap-16 lg:px-10 xl:py-24">
          <div className="relative z-10 max-w-[760px]">
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <LiveSignal label="Capability OS · early access" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-inkDim">Governed compute infrastructure</span>
            </div>

            <h1 className="text-[clamp(4rem,8.6vw,8.8rem)] font-semibold leading-[0.82] tracking-[-0.075em] text-theme-ink">
              Give machines<br />capability.<br /><span className="text-theme-inkDim">Not a blank check.</span>
            </h1>

            <p className="mt-9 max-w-2xl text-lg leading-8 text-theme-inkDim md:text-[1.35rem] md:leading-9">
              Veklom is building governed compute infrastructure: bounded capability, identity, authority, lifecycle, execution, observation and evidence under one execution contract. Persistent services and ephemeral work can run without turning compute into ambient authority.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/os" className="group inline-flex min-h-14 items-center justify-center gap-5 rounded-full bg-theme-ink px-7 text-sm font-semibold text-theme-bg shadow-[0_20px_55px_rgba(0,0,0,.16)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,0,0,.22)]">
                Open Capability OS <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/proof" className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-surface/70 px-7 text-sm font-semibold text-theme-ink backdrop-blur transition hover:border-theme-ink/20 hover:bg-theme-surface">Inspect proof</Link>
              <Link href="/vlink" className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-surface/70 px-7 text-sm font-semibold text-theme-ink backdrop-blur transition hover:border-theme-ink/20 hover:bg-theme-surface">Connect existing system</Link>
            </div>

            <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-theme-border pt-6">
              <div><div className="text-[10px] uppercase tracking-[.2em] text-theme-inkDim">Authority</div><div className="mt-2 text-sm font-medium text-theme-ink">Bound before execution</div></div>
              <div><div className="text-[10px] uppercase tracking-[.2em] text-theme-inkDim">Compute</div><div className="mt-2 text-sm font-medium text-theme-ink">Lifecycle is explicit</div></div>
              <div><div className="text-[10px] uppercase tracking-[.2em] text-theme-inkDim">Evidence</div><div className="mt-2 text-sm font-medium text-theme-ink">Preserved after action</div></div>
            </div>
          </div>

          <div className="relative z-10 lg:translate-x-3">
            <AuthorityOrb />
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
            <div>
              <StageLabel>Governed compute</StageLabel>
              <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">Compute should not exist outside its authority.</h2>
              <p className="mt-7 max-w-lg text-base leading-8 text-theme-inkDim">Cloud platforms usually start with a resource, workload, service or function. Veklom starts one level higher: what bounded capability is allowed to exist, under whose authority, for what lifecycle, and with what evidence of the result.</p>
              <p className="mt-5 max-w-lg text-base leading-8 text-theme-inkDim">That makes persistent service, ephemeral execution and consequential action different lifecycle expressions of the same governed execution contract — not separate trust systems.</p>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">What the contract has to hold</div>
              <div className="mt-5 grid gap-px overflow-hidden rounded-[26px] border border-theme-border bg-theme-border sm:grid-cols-2">
                {demands.map((demand) => (
                  <article key={demand.title} className="bg-theme-surface p-7">
                    <h3 className="text-xl font-semibold tracking-[-.03em] text-theme-ink">{demand.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-theme-inkDim">{demand.body}</p>
                  </article>
                ))}
              </div>
            </div>
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
              <StageLabel>Evidence over theater</StageLabel>
              <h2 className="mt-5 max-w-3xl text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">See what is actually answering — and what is not yet proven.</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-theme-inkDim">Reachability is not consequence proof. The public proof surface separates live service state from engineering claims and keeps unknown outcomes unknown.</p>
          </div>
          <LiveProofFabric compact />
        </section>

        <section className="relative overflow-hidden border-y border-theme-border bg-[#05070b] text-white">
          <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle_at_20%_20%,rgba(103,232,249,.18),transparent_26%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,.16),transparent_28%)]" aria-hidden="true" />
          <div className="relative mx-auto grid w-full max-w-[1480px] gap-14 px-5 py-24 sm:px-8 md:py-32 lg:grid-cols-[.85fr_1.15fr] lg:px-10">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">From capability to evidence</div>
              <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[.96] tracking-[-.055em] md:text-6xl">The runtime can disappear. The governed record should not.</h2>
              <p className="mt-7 max-w-lg text-base leading-8 text-white/58">Veklom is designed so execution lifecycle and authority lifecycle are explicit. Compute may persist, terminate or be reconstructed; the authority and consequence record remain separately inspectable.</p>
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
                <h2 className="mt-6 max-w-4xl text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-7xl">Use what is available now. Inspect what is proven. Build from a bounded capability.</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
                <Link href="/os" className="inline-flex min-h-14 items-center justify-center rounded-full bg-theme-ink px-7 text-sm font-semibold text-theme-bg">Open Capability OS →</Link>
                <Link href="/proof" className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-bg px-7 text-sm font-semibold text-theme-ink">Inspect proof</Link>
                <Link href="/vlink" className="inline-flex min-h-14 items-center justify-center rounded-full border border-theme-border bg-theme-bg px-7 text-sm font-semibold text-theme-ink">Connect existing system</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </HumanAppShell>
  );
}
