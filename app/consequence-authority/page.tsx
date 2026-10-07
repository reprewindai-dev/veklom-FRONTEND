import type { Metadata } from "next";
import Link from "next/link";

import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata: Metadata = {
  title: "Consequence Authority for Governed Machine Action | Veklom",
  description:
    "Veklom consequence authority separates identity, access, execution and evidence from the current right of a specific machine execution to cause a bounded real-world or state-changing effect.",
  alternates: {
    canonical: "/consequence-authority",
  },
  openGraph: {
    type: "article",
    url: "/consequence-authority",
    title: "Consequence Authority for Governed Machine Action | Veklom",
    description:
      "A technical definition of consequence authority: who or what may cause which bounded effect, from which execution, under which current authority, with what evidence.",
  },
};

const distinctions = [
  ["Identity", "Answers who or what the requester is. Identity alone does not grant the right to cause a consequence."],
  ["Access", "Answers which system or resource can be reached. Reachability is not current consequence authority."],
  ["Capability", "Describes the bounded operation that may be requested, including scope, budget, target and time constraints."],
  ["Execution", "Identifies the concrete runtime manifestation attempting the action. A copied or recreated runtime does not automatically inherit current authority."],
  ["Consequence authority", "Determines whether this execution may cause this specific bounded effect now."],
  ["Evidence", "Preserves what was authorized, attempted, observed and established after execution."],
] as const;

const lifecycle = [
  ["01", "Request", "A human or machine proposes a bounded operation."],
  ["02", "Bind", "Identity, capability scope, target, budget, time and execution context are bound into current authority."],
  ["03", "Decide", "CAPPO evaluates whether the proposed consequence fits the authority that actually exists now."],
  ["04", "Enforce", "The effect path must fail closed when the current execution no longer satisfies that authority."],
  ["05", "Observe", "The resulting state or external effect is read back independently where the integration supports it."],
  ["06", "Preserve", "PGL / Gnomledger retains evidence so the record can outlive the execution that produced it."],
] as const;

const falsifiers = [
  "A copied token must not make a different execution current.",
  "A restored snapshot must not resurrect expired or revoked consequence authority.",
  "A recreated runtime must not inherit authority solely because it has the same code or state.",
  "A revoked execution must be unable to produce the governed consequence through the tested enforcement path.",
  "A successful request or healthy endpoint must not be promoted into proof that the external consequence occurred.",
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Consequence Authority for Governed Machine Action",
  description:
    "Veklom's technical definition of consequence authority and its separation from identity, access, execution and evidence.",
  mainEntityOfPage: "https://veklom.com/consequence-authority",
  author: {
    "@type": "Organization",
    name: "Veklom",
    url: "https://veklom.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Veklom",
    url: "https://veklom.com",
  },
};

export default function ConsequenceAuthorityPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-55" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Consequence authority"
            title="The right to compute is not the right to cause the next consequence."
            body="Veklom uses consequence authority to name a precise machine-control boundary: whether this concrete execution, under its current identity, capability, policy, budget, time and runtime binding, may cause this specific bounded effect now."
          />
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/proof" className="inline-flex min-h-12 items-center justify-center rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg">Inspect proof →</Link>
            <Link href="/architecture" className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink">See the architecture</Link>
            <Link href="/cappo" className="inline-flex min-h-12 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-6 text-sm font-semibold text-theme-ink">Open CAPPO</Link>
          </div>
        </section>

        <section className="relative border-y border-theme-border bg-theme-surface/62">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.72fr_1.28fr] lg:px-10">
            <div>
              <StageLabel>Definition</StageLabel>
              <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-6xl">
                Consequence authority is current, bounded and execution-specific.
              </h2>
              <p className="mt-7 max-w-xl text-base leading-8 text-theme-inkDim">
                Possessing code, state, a process image, an API credential or historical permission does not by itself establish current authority to mutate a governed target. The authority has to survive the full set of current constraints at the moment the effect is attempted.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-[28px] border border-theme-border bg-theme-border sm:grid-cols-2">
              {distinctions.map(([title, body]) => (
                <article key={title} className="bg-theme-bg p-7 md:p-8">
                  <h3 className="text-xl font-semibold tracking-[-.03em] text-theme-ink">{title}</h3>
                  <p className="mt-4 text-sm leading-7 text-theme-inkDim">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <StageLabel>One governed consequence</StageLabel>
          <div className="mt-8 grid gap-3">
            {lifecycle.map(([index, title, body]) => (
              <article key={index} className="grid gap-4 rounded-2xl border border-theme-border bg-theme-surface p-5 sm:grid-cols-[46px_160px_1fr] sm:items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-theme-border font-mono text-[10px] font-semibold text-theme-inkDim">{index}</span>
                <h3 className="text-base font-semibold text-theme-ink">{title}</h3>
                <p className="text-sm leading-7 text-theme-inkDim">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative border-y border-theme-border bg-[#05070b] text-white">
          <div className="mx-auto grid w-full max-w-[1480px] gap-12 px-5 py-20 sm:px-8 md:py-28 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/45">Falsification standard</div>
              <h2 className="mt-6 max-w-xl text-4xl font-semibold leading-[.98] tracking-[-.055em] md:text-6xl">
                Authority is only meaningful if stale possession cannot reproduce the consequence.
              </h2>
              <p className="mt-7 max-w-lg text-sm leading-7 text-white/58">
                Veklom treats these as machine invariants to test, not slogans to assume.
              </p>
            </div>
            <div className="grid gap-3">
              {falsifiers.map((item, index) => (
                <div key={item} className="grid grid-cols-[38px_1fr] gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-5">
                  <span className="font-mono text-[10px] text-white/40">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-sm leading-7 text-white/74">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            <Link href="/cappo" className="rounded-[28px] border border-theme-border bg-theme-surface p-7 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">Decision boundary</div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em] text-theme-ink">CAPPO</h2>
              <p className="mt-4 text-sm leading-7 text-theme-inkDim">Evaluates the governed consequence against current bounded authority.</p>
            </Link>
            <Link href="/pgl" className="rounded-[28px] border border-theme-border bg-theme-surface p-7 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">Evidence boundary</div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em] text-theme-ink">PGL / Gnomledger</h2>
              <p className="mt-4 text-sm leading-7 text-theme-inkDim">Preserves evidence and provenance without becoming an authority issuer.</p>
            </Link>
            <Link href="/vlink" className="rounded-[28px] border border-theme-border bg-theme-surface p-7 transition hover:-translate-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">Connection boundary</div>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em] text-theme-ink">VLink</h2>
              <p className="mt-4 text-sm leading-7 text-theme-inkDim">Carries governed connectivity without turning a connection into ambient authority.</p>
            </Link>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
