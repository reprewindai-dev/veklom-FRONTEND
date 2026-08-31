import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export type SystemState = "RUNTIME" | "SOURCE" | "PROOF" | "SPEC" | "MIXED";

export interface SystemLandingProps {
  eyebrow: string;
  title: string;
  body: string;
  role: string;
  state: SystemState;
  stateDetail: string;
  owns: string[];
  doesNotOwn: string[];
  interfaces: Array<{ label: string; value: string }>;
  proofNote: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

const stateLabel: Record<SystemState, string> = {
  RUNTIME: "Runtime-backed",
  SOURCE: "Source-backed",
  PROOF: "Proof surface",
  SPEC: "Specification",
  MIXED: "Mixed verification",
};

export function SystemLanding(props: SystemLandingProps) {
  const {
    eyebrow,
    title,
    body,
    role,
    state,
    stateDetail,
    owns,
    doesNotOwn,
    interfaces,
    proofNote,
    primaryHref = "/architecture",
    primaryLabel = "See architecture",
    secondaryHref = "/proof",
    secondaryLabel = "Inspect proof",
  } = props;

  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-55" />

        <section className="relative mx-auto grid w-full max-w-[1480px] gap-12 px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:px-10">
          <PremiumPageIntro eyebrow={eyebrow} title={title} body={body} />

          <div className="overflow-hidden rounded-[30px] border border-theme-border bg-[#05070b] p-6 text-white shadow-[0_36px_110px_rgba(0,0,0,.18)] sm:p-8">
            <div className="absolute opacity-60" aria-hidden="true" />
            <div className="flex items-start justify-between gap-5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/38">Current classification</div>
                <div className="mt-4 text-2xl font-semibold tracking-[-.04em] text-white">{stateLabel[state]}</div>
              </div>
              <span className="rounded-full border border-cyan-200/20 bg-cyan-200/[.08] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-cyan-100">{state}</span>
            </div>
            <p className="mt-7 text-sm leading-7 text-white/58">{stateDetail}</p>
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/32">Architectural role</div>
              <div className="mt-3 text-lg font-medium text-white/88">{role}</div>
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[30px] border border-theme-border bg-theme-surface p-7 sm:p-9">
              <StageLabel>Owns</StageLabel>
              <div className="mt-7 grid gap-3">
                {owns.map((item, index) => (
                  <div key={item} className="grid grid-cols-[34px_1fr] gap-4 rounded-2xl border border-theme-border bg-theme-bg/55 px-4 py-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-theme-border text-[9px] font-semibold text-theme-inkDim">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm leading-6 text-theme-ink">{item}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-theme-border bg-theme-surface p-7 sm:p-9">
              <StageLabel>Boundary</StageLabel>
              <h2 className="mt-7 text-3xl font-semibold tracking-[-.045em] text-theme-ink">Power stays narrow on purpose.</h2>
              <div className="mt-6 grid gap-3">
                {doesNotOwn.map((item) => (
                  <div key={item} className="flex gap-3 rounded-2xl border border-theme-border bg-theme-bg/55 px-4 py-4 text-sm leading-6 text-theme-inkDim">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-theme-accent" />
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section className="border-y border-theme-border bg-theme-surface/62">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
            <div>
              <StageLabel>Interfaces</StageLabel>
              <h2 className="mt-6 text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-5xl">The surface should tell you where the truth comes from.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-theme-inkDim">Veklom does not promote a configured URL or a code path into a runtime claim. Interfaces are shown so operators can verify the actual boundary themselves.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {interfaces.map((item) => (
                <div key={`${item.label}:${item.value}`} className="rounded-[24px] border border-theme-border bg-theme-bg p-5">
                  <div className="text-[9px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">{item.label}</div>
                  <div className="mt-4 break-words font-mono text-xs leading-6 text-theme-ink">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="relative overflow-hidden rounded-[34px] border border-theme-border bg-theme-ink p-8 text-theme-bg sm:p-10 md:p-12">
            <div className="absolute right-[-8rem] top-[-9rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgb(var(--theme-accent)/.24),transparent_70%)] blur-3xl" aria-hidden="true" />
            <div className="relative max-w-3xl">
              <div className="text-[10px] font-semibold uppercase tracking-[.24em] text-white/40">Claim boundary</div>
              <p className="mt-6 text-2xl font-semibold leading-9 tracking-[-.035em] text-white sm:text-3xl">{proofNote}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href={primaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#06080d]">{primaryLabel} →</Link>
                <Link href={secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[.04] px-6 text-sm font-semibold text-white">{secondaryLabel}</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
