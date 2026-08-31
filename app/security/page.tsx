import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata = {
  title: "Security | Veklom",
  description: "Security boundaries and responsible disclosure for Veklom.",
};

const boundaries = [
  ["Authority", "Application UI and connection metadata do not mint consequence authority. CAPPO remains the execution authorization boundary."],
  ["Host execution", "LockerPhycer is designed to keep sensitive host execution controls out of ordinary application containers."],
  ["Recovery", "Guardian recovery actions are bounded by declared recovery authority rather than unrestricted host automation."],
  ["Evidence", "A health response or configured integration is not promoted into cryptographic or consequence proof."],
];

export default function SecurityPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-45" />
        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Security"
            title="Bound the authority. Reduce the blast radius."
            body="Veklom security is built around separating identity, connection, execution, evidence and recovery responsibilities instead of placing every privileged operation behind one application process."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <div className="grid gap-4 md:grid-cols-2">
            {boundaries.map(([title, body], index) => (
              <article key={title} className="min-h-[260px] rounded-[28px] border border-theme-border bg-theme-surface p-7 md:p-9">
                <div className="text-[10px] font-semibold tracking-[.22em] text-theme-inkDim">{String(index + 1).padStart(2, "0")}</div>
                <h2 className="mt-14 text-3xl font-semibold tracking-[-.045em] text-theme-ink">{title}</h2>
                <p className="mt-4 text-sm leading-7 text-theme-inkDim">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-theme-border bg-[#05070b] text-white">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/42">Responsible disclosure</div>
              <h2 className="mt-6 max-w-lg text-4xl font-semibold leading-[.98] tracking-[-.055em] md:text-6xl">Never disclose a secret to prove a security issue.</h2>
            </div>
            <div className="grid content-center gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm leading-7 text-white/62">Do not submit private keys, access tokens, refresh tokens, installation tokens, database credentials, Cloudflare tunnel credentials, recovery signing keys or production environment dumps in public issues, screenshots, chats or pull requests.</div>
              <div className="rounded-2xl border border-white/10 bg-white/[.035] p-5 text-sm leading-7 text-white/62">Provide the smallest reproducible description needed to demonstrate the boundary failure. Evidence should establish the defect without expanding the compromise.</div>
              <Link href="/.well-known/security.txt" className="inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black">Open security.txt →</Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 md:p-10">
            <StageLabel>Claim discipline</StageLabel>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h2 className="max-w-4xl text-3xl font-semibold leading-[1.02] tracking-[-.045em] text-theme-ink md:text-5xl">Security claims stay scoped to the environment and falsifiers that actually passed.</h2>
                <p className="mt-6 max-w-2xl text-sm leading-7 text-theme-inkDim">No public page should infer certification, hardware isolation, host-compromise resistance or deployment guarantees from source code alone.</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:flex-col">
                <Link href="/conformance" className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg">Conformance →</Link>
                <Link href="/proof" className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-bg px-6 text-sm font-semibold text-theme-ink">Live proof</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
