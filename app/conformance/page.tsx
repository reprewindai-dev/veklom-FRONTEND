import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata = {
  title: "Conformance | Veklom",
  description: "Evidence-scoped conformance for Veklom Capability OS.",
};

const invariants = [
  ["Authority", "No consequence beyond granted authority."],
  ["Evidence", "No truth claim beyond observable evidence."],
  ["Agency", "No residual execution authority after termination."],
  ["Monotonicity", "Derived authority may preserve or narrow scope; it does not silently widen."],
  ["Uncertainty", "Unknown outcomes stay unknown until reconciliation."],
  ["Fail closed", "Missing or invalid authority denies before consequence."],
];

const proofClasses = [
  ["SOURCE_OBSERVED", "Canonical source contains the behavior. Deployment is not implied."],
  ["TEST_VERIFIED", "An executable falsifier passed in the stated environment."],
  ["RUNTIME_OBSERVED", "A declared service responded in the tested runtime profile."],
  ["CONSEQUENCE_VERIFIED", "A real consequence and authoritative post-state/evidence were observed."],
  ["UNVERIFIED", "Required evidence has not yet been produced."],
];

export default function ConformancePage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-50" />

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Evidence-scoped conformance"
            title="A claim is only as strong as the proof behind it."
            body="Veklom separates source presence, tests, runtime observation and real consequence evidence. The site does not convert a configured feature or passing health check into a stronger claim than it earned."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <div className="grid gap-px overflow-hidden rounded-[30px] border border-theme-border bg-theme-border sm:grid-cols-2 lg:grid-cols-3">
            {invariants.map(([title, body], index) => (
              <article key={title} className="min-h-[250px] bg-theme-surface p-7 md:p-8">
                <div className="text-[10px] font-semibold tracking-[.22em] text-theme-inkDim">{String(index + 1).padStart(2, "0")}</div>
                <h2 className="mt-14 text-2xl font-semibold tracking-[-.04em] text-theme-ink">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-theme-inkDim">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-theme-border bg-[#05070b] text-white">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.7fr_1.3fr] lg:px-10">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">Proof classes</div>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] md:text-6xl">One vocabulary for what is actually known.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/55">This is the language the public product should use everywhere: source, tests, live runtime, verified consequence, or unverified. Nothing gets promoted because it sounds better in marketing.</p>
            </div>

            <div className="grid gap-3">
              {proofClasses.map(([name, body], index) => (
                <div key={name} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-5 sm:grid-cols-[44px_190px_1fr] sm:items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold text-white/36">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-xs font-semibold text-cyan-200/85">{name}</span>
                  <span className="text-sm leading-6 text-white/55">{body}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 md:p-10">
              <StageLabel>Deployment truth</StageLabel>
              <h2 className="mt-6 text-3xl font-semibold leading-[1.02] tracking-[-.045em] text-theme-ink md:text-5xl">A healthy plane does not certify the whole system.</h2>
              <p className="mt-6 text-sm leading-7 text-theme-inkDim">BYOS Runtime, LockerPhycer, CAPPO, cAPI, Gnomledger/PGL, VLink and Guardian have separate responsibilities. The live proof page reports individual runtime observations rather than collapsing them into one global green badge.</p>
            </div>

            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 md:p-10">
              <StageLabel>Regulatory boundary</StageLabel>
              <h2 className="mt-6 text-3xl font-semibold leading-[1.02] tracking-[-.045em] text-theme-ink md:text-5xl">Evaluation is not certification.</h2>
              <p className="mt-6 text-sm leading-7 text-theme-inkDim">Veklom can be evaluated against privacy, security and AI governance frameworks, but the public product should not claim legal compliance, regulatory approval or universal alignment without a scoped assessment and deployment-specific evidence.</p>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/proof" className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg">Inspect live proof →</Link>
            <Link href="/architecture" className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink">See the runtime planes</Link>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
