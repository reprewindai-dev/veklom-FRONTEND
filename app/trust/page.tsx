import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata = {
  title: "Trust Center | Veklom",
  description: "Privacy, security, jurisdiction, data rights, deployment and legal trust surfaces for Veklom.",
};

const sections = [
  {
    title: "Privacy & consent",
    body: "Strictly necessary processing is the default. Optional analytics remain off until a valid choice exists where required, and the choice can be changed later.",
    links: [["/privacy", "Privacy notice"], ["/privacy-choices", "Privacy choices"], ["/cookies", "Cookies & sessions"]],
  },
  {
    title: "Data rights",
    body: "Access, correction, deletion, restriction, portability, objection, consent withdrawal and jurisdiction-specific opt-out rights are handled through one rights surface with identity verification before disclosure or deletion.",
    links: [["/data-rights", "Exercise data rights"], ["/support", "Support"]],
  },
  {
    title: "Security",
    body: "Security claims are bounded to what the current source and deployment prove. Credential reporting, security.txt and the architectural separation of authority are public.",
    links: [["/security", "Security"], ["/.well-known/security.txt", "security.txt"], ["/proof", "Live proof"]],
  },
  {
    title: "Enterprise data processing",
    body: "Controller/processor roles, subprocessors, transfers and technical measures depend on the selected deployment and executed agreement rather than being inferred from marketing copy.",
    links: [["/dpa", "DPA information"], ["/subprocessors", "Subprocessors"], ["/architecture", "Architecture"]],
  },
  {
    title: "Legal use",
    body: "Operators remain responsible for having lawful authority over connected repositories, APIs, infrastructure and data. Veklom's technical access never substitutes for the rights of the system or data owner.",
    links: [["/terms", "Terms"], ["/acceptable-use", "Acceptable Use"]],
  },
  {
    title: "Operational truth",
    body: "Health, conformance and product status are kept separate. A reachable endpoint is not advertised as proof of a governed external consequence.",
    links: [["/status", "System status"], ["/conformance", "Conformance"], ["/proof", "Proof"]],
  },
];

const modes = [
  {
    name: "VPC",
    posture: "Institution-selected cloud perimeter",
    body: "Runtime and data stay inside the selected VPC by default. External providers are explicit capability choices and cross-border review applies before new outbound data flows are enabled.",
  },
  {
    name: "On-premises",
    posture: "Operator-controlled physical infrastructure",
    body: "No external analytics or call-home is required for the governed runtime. External processing remains capability-specific and deliberately enabled rather than inherited from the public control plane.",
  },
  {
    name: "Air-gapped",
    posture: "Offline / disconnected profile",
    body: "The governed runtime is designed to operate without outbound network access. Public cookie/analytics behavior does not apply inside the air-gapped runtime because no public analytics or external telemetry should be present there.",
  },
];

export default function TrustPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-45" />
        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Veklom Trust Center"
            title="Compliance is a system behavior, not a badge."
            body="This is the public index for privacy, consent, security, jurisdiction, data rights, enterprise processing and operational truth. Veklom applies a strict global baseline and then adds jurisdiction/deployment-specific obligations instead of pretending one policy fits every person and every deployment."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1480px] px-5 pb-20 sm:px-8 md:pb-28 lg:px-10">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <article key={section.title} className="rounded-[28px] border border-theme-border bg-theme-surface p-7 sm:p-8">
                <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Trust surface</div>
                <h2 className="mt-5 text-2xl font-semibold tracking-[-.04em] text-theme-ink">{section.title}</h2>
                <p className="mt-4 text-sm leading-7 text-theme-inkDim">{section.body}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  {section.links.map(([href, label]) => (
                    <Link key={href} href={href} className="rounded-full border border-theme-border bg-theme-bg px-3 py-2 text-xs font-medium text-theme-ink transition hover:border-theme-ink/20">{label}</Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-theme-border bg-theme-surface/62">
          <div className="mx-auto w-full max-w-[1480px] px-5 py-20 sm:px-8 md:py-28 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[.65fr_1.35fr]">
              <div>
                <StageLabel>Deployment-aware privacy</StageLabel>
                <h2 className="mt-6 text-4xl font-semibold leading-[.98] tracking-[-.055em] text-theme-ink md:text-5xl">The law sees the data flow. So should the product.</h2>
                <p className="mt-6 max-w-md text-sm leading-7 text-theme-inkDim">The same website consent banner should not be copied blindly into an offline deployment. Veklom's compliance profile must account for where data is processed, where it can leave, and what the selected runtime mode actually permits.</p>
              </div>
              <div className="grid gap-3">
                {modes.map((mode) => (
                  <div key={mode.name} className="rounded-[24px] border border-theme-border bg-theme-bg p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-2xl font-semibold tracking-[-.04em] text-theme-ink">{mode.name}</h3>
                      <span className="text-[9px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">{mode.posture}</span>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-theme-inkDim">{mode.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1480px] px-5 py-24 sm:px-8 md:py-32 lg:px-10">
          <div className="rounded-[34px] border border-theme-border bg-theme-ink p-8 text-white sm:p-10 md:p-12">
            <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/38">Compliance boundary</div>
            <p className="mt-6 max-w-4xl text-2xl font-semibold leading-9 tracking-[-.035em] sm:text-3xl">No public page can truthfully certify Veklom as compliant with every law in every country. Legal entity details, customer roles, data categories, transfers, representatives, contracts and deployment facts matter. The product can—and should—enforce the technical controls and evidence needed to support those obligations.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/privacy-choices" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-[#06080d]">Privacy choices →</Link>
              <Link href="/data-rights" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[.04] px-6 text-sm font-semibold text-white">Data rights</Link>
            </div>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
