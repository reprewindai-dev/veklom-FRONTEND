import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata = {
  title: "Documentation | Veklom",
  description: "Start, integrate, govern and verify with Veklom Capability OS.",
};

const guides = [
  {
    n: "01",
    title: "Enter Capability OS",
    body: "Authenticate through the BYOS identity/session boundary and open your workspace. Login establishes identity; it does not grant execution authority by itself.",
    href: "/login?returnTo=/os",
    cta: "Open workspace",
  },
  {
    n: "02",
    title: "Run live Activation",
    body: "Discover a capability from CAPPO, request a bounded lease, prove a real denial, execute the allowed operation, then inspect persisted evidence.",
    href: "/activate",
    cta: "Run Activation",
  },
  {
    n: "03",
    title: "Inspect runtime truth",
    body: "Observe BYOS, LockerPhycer, CAPPO, cAPI and Gnomledger/PGL from the public proof and machine surfaces without synthetic health state.",
    href: "/proof",
    cta: "Inspect proof",
  },
  {
    n: "04",
    title: "Integrate machines",
    body: "Use machine-readable discovery surfaces and VLink/MCP connection primitives without treating connection identity as execution authority.",
    href: "/machine",
    cta: "Open machine surface",
  },
];

const concepts = [
  ["BYOS Runtime", "Workspace, tenant and usable execution substrate."],
  ["LockerPhycer", "Security, identity and governed host-execution boundary."],
  ["CAPPO", "Fail-closed consequence authorization."],
  ["cAPI", "Cross-service interlink and connection path."],
  ["Gnomledger / PGL", "Durable evidence and provenance."],
  ["VLink", "Portable, scoped connection primitive."],
  ["Guardian", "Policy-bounded recovery plane."],
];

export default function DocumentationPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-45" />

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Documentation"
            title="Start with the system that actually runs."
            body="Veklom documentation follows the same rule as the runtime: no synthetic success paths. Begin with identity, move through bounded authority, execute through the real backend, and inspect the evidence that remains."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <div className="grid gap-4 md:grid-cols-2">
            {guides.map((guide) => (
              <Link key={guide.n} href={guide.href} className="group relative min-h-[300px] overflow-hidden rounded-[30px] border border-theme-border bg-theme-surface p-7 transition duration-300 hover:-translate-y-1 hover:border-theme-ink/15 hover:shadow-[0_30px_80px_rgba(2,8,23,.08)] md:p-9">
                <div className="text-[10px] font-semibold tracking-[.22em] text-theme-inkDim">{guide.n}</div>
                <h2 className="mt-14 max-w-md text-3xl font-semibold tracking-[-.045em] text-theme-ink">{guide.title}</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-theme-inkDim">{guide.body}</p>
                <div className="absolute bottom-7 left-7 right-7 flex items-center justify-between border-t border-theme-border pt-4 text-sm font-semibold text-theme-ink md:bottom-9 md:left-9 md:right-9">
                  {guide.cta}<span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="border-y border-theme-border bg-[#05070b] text-white">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.68fr_1.32fr] lg:px-10">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">Core vocabulary</div>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] md:text-6xl">Know which plane owns which responsibility.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-white/55">The architecture is intentionally separated. A connection plane should not mint authority. A recovery plane should not become root automation. A health endpoint should not become consequence proof.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {concepts.map(([name, body]) => (
                <div key={name} className="rounded-2xl border border-white/10 bg-white/[.035] p-5">
                  <div className="text-sm font-semibold text-white/90">{name}</div>
                  <div className="mt-2 text-xs leading-6 text-white/48">{body}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 md:p-10">
              <StageLabel>Machine access</StageLabel>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-.045em] text-theme-ink md:text-5xl">Raw surfaces are part of the product.</h2>
              <p className="mt-6 max-w-2xl text-sm leading-7 text-theme-inkDim">Claims, conformance, evidence indexes, OpenAPI, MCP manifests and the live runtime probe are exposed as machine-oriented surfaces so automated systems do not need to scrape a marketing page to understand Veklom.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/machine" className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg">Machine surface →</Link>
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a href="/api/proof/live" className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-bg px-6 text-sm font-semibold text-theme-ink">Runtime JSON</a>
              </div>
            </div>

            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 md:p-10">
              <StageLabel>Truth rule</StageLabel>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-.045em] text-theme-ink md:text-5xl">If a guide cannot prove it, it should not say it.</h2>
              <p className="mt-6 text-sm leading-7 text-theme-inkDim">Deployment details, legal alignment, live service state and consequence evidence are all scoped independently. Documentation is not allowed to promote an intended architecture into a verified runtime claim.</p>
              <Link href="/conformance" className="mt-8 inline-flex text-sm font-semibold text-theme-ink">Read conformance →</Link>
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
