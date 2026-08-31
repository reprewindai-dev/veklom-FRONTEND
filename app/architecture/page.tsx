import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata = {
  title: "Architecture | Veklom",
  description: "The runtime planes that make up Veklom Capability OS.",
};

const planes = [
  {
    id: "01",
    name: "BYOS Runtime",
    role: "Tenant / workspace execution substrate",
    body: "The operating substrate for users, workspaces, API access, integrations, budgets and governed runtime services. This is where the Capability OS becomes an actual usable environment rather than an architecture diagram.",
    emphasis: true,
  },
  {
    id: "02",
    name: "LockerPhycer",
    role: "Security, identity and execution-host boundary",
    body: "Keeps sensitive host execution authority out of ordinary application containers. Its governed cell-host path verifies signed authority, immutable runtime identity, replay fencing and isolation requirements before host-level execution.",
    emphasis: true,
  },
  {
    id: "03",
    name: "CAPPO",
    role: "Consequence authorization",
    body: "The fail-closed decision boundary. CAPPO determines whether a requested machine consequence fits the authority that was actually granted.",
  },
  {
    id: "04",
    name: "cAPI",
    role: "Cross-service interlink",
    body: "The connection fabric between Veklom services and external capability surfaces. It carries integration without becoming the source of execution authority.",
  },
  {
    id: "05",
    name: "Gnomledger / PGL",
    role: "Evidence and provenance",
    body: "Durable evidence state. Execution outcomes, provenance and reconciliation belong here instead of disappearing with the machine that performed the work.",
  },
  {
    id: "06",
    name: "VLink",
    role: "Portable governed connection primitive",
    body: "Connects systems through scoped access, verifiable activity and bounded transport behavior without treating a connection identifier as authority.",
  },
  {
    id: "07",
    name: "Guardian",
    role: "Bounded recovery plane",
    body: "Observes declared runtime state and performs pre-bounded recovery actions when approved Veklom services fail. Recovery remains an action with authority and evidence, not an unrestricted host backdoor.",
  },
];

const flow = [
  ["Need", "A machine or operator declares the intended work."],
  ["Identity", "A temporary execution identity is established."],
  ["Authority", "Policy, scope, budget and time become an explicit capability boundary."],
  ["Execution", "BYOS and LockerPhycer provide the runtime and host boundary."],
  ["Consequence", "CAPPO controls whether the requested effect may cross into the real system."],
  ["Evidence", "Gnomledger / PGL preserve what actually happened."],
];

export default function ArchitecturePage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-55" />

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="System architecture"
            title="Veklom is a stack of boundaries, not a single server."
            body="The Capability OS is built from distinct runtime planes with different authority. BYOS and LockerPhycer are central because one provides the usable execution substrate and the other protects the host-level execution boundary."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-2">
            {planes.map((plane) => (
              <article
                key={plane.id}
                className={`relative overflow-hidden rounded-[28px] border p-7 sm:p-8 md:p-9 ${plane.emphasis ? "border-theme-ink/15 bg-theme-ink text-theme-bg shadow-[0_30px_90px_rgba(0,0,0,.12)]" : "border-theme-border bg-theme-surface"}`}
              >
                {plane.emphasis && <div className="absolute right-[-4rem] top-[-5rem] h-52 w-52 rounded-full bg-[radial-gradient(circle,rgb(var(--theme-accent)/.2),transparent_70%)] blur-2xl" aria-hidden="true" />}
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className={`text-[10px] font-semibold uppercase tracking-[.22em] ${plane.emphasis ? "text-white/42" : "text-theme-inkDim"}`}>{plane.id} · {plane.role}</div>
                    <h2 className={`mt-6 text-3xl font-semibold tracking-[-.045em] md:text-4xl ${plane.emphasis ? "text-white" : "text-theme-ink"}`}>{plane.name}</h2>
                    <p className={`mt-5 max-w-2xl text-sm leading-7 ${plane.emphasis ? "text-white/62" : "text-theme-inkDim"}`}>{plane.body}</p>
                  </div>
                  <span className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm ${plane.emphasis ? "border-white/12 text-white/55" : "border-theme-border text-theme-inkDim"}`}>↗</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-theme-border bg-theme-surface/62">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.7fr_1.3fr] lg:px-10">
            <div>
              <StageLabel>Execution path</StageLabel>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">Authority moves through the stack. It does not leak around it.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-theme-inkDim">Each plane exists because a different kind of trust or consequence needs a different boundary. Combining all of them into one privileged backend would erase the architecture Veklom is meant to enforce.</p>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-theme-border bg-[#05070b] p-5 text-white sm:p-7 md:p-10">
              <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_70%_10%,rgba(103,232,249,.14),transparent_30%)]" aria-hidden="true" />
              <div className="relative grid gap-3">
                {flow.map(([title, body], index) => (
                  <div key={title} className="group grid grid-cols-[42px_1fr_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-4 transition hover:border-cyan-200/20 hover:bg-white/[.055]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-[10px] font-semibold text-white/42">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="text-sm font-semibold text-white/90">{title}</div>
                      <div className="mt-1 text-xs leading-5 text-white/48">{body}</div>
                    </div>
                    <span className="text-white/22 transition group-hover:translate-x-1 group-hover:text-cyan-200">→</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[28px] border border-theme-border bg-theme-surface p-7 md:p-9">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Core rule</div>
              <div className="mt-7 text-2xl font-semibold tracking-[-.04em] text-theme-ink">No plane above the authority kernel mints wider consequence authority.</div>
            </div>
            <div className="rounded-[28px] border border-theme-border bg-theme-surface p-7 md:p-9">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Runtime rule</div>
              <div className="mt-7 text-2xl font-semibold tracking-[-.04em] text-theme-ink">Execution identity can disappear without taking the evidence with it.</div>
            </div>
            <div className="rounded-[28px] border border-theme-border bg-theme-surface p-7 md:p-9">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Proof rule</div>
              <div className="mt-7 text-2xl font-semibold tracking-[-.04em] text-theme-ink">A configured route is not a verified consequence.</div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link href="/proof" className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg">Inspect live proof →</Link>
            <Link href="/machine" className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink">Open machine surface</Link>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
