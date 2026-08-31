import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export const metadata = {
  title: "Data Rights | Veklom",
  description: "Exercise privacy and data-protection rights through Veklom's global rights workflow.",
};

const rights = [
  ["Access / know", "Request the personal data Veklom holds about you and information about how it is used, subject to applicable verification and exemptions."],
  ["Correction", "Ask us to correct inaccurate or incomplete personal information associated with your account or workspace."],
  ["Deletion / erasure", "Ask us to delete eligible personal information. Some records may need to be retained for security, legal obligations, fraud prevention, contractual claims or integrity of governed evidence."],
  ["Portability / export", "Where applicable, request a structured export of personal data you provided or account data that is eligible for portability."],
  ["Restriction / objection", "Ask us to restrict or stop certain processing when the applicable law and legal basis provide that right."],
  ["Withdraw consent", "Withdraw an optional consent at any time. Withdrawal does not make earlier lawful processing unlawful and may affect features that depended on that optional processing."],
  ["Sale / sharing / targeted advertising opt-out", "Where applicable, exercise state-law opt-out rights. The current public privacy runtime does not enable sale/share tracking or cross-context behavioral advertising."],
  ["Limit sensitive information", "Where a law provides this right, ask us to limit uses of sensitive personal information outside permitted service/security purposes."],
  ["Automated decision information", "Where applicable, request information about qualifying automated decision-making or profiling that materially affects you."],
  ["Complaint / grievance", "Raise a privacy complaint with Veklom and, where applicable, with the competent privacy or data-protection authority."],
] as const;

export default function DataRightsPage() {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-45" />
        <section className="relative mx-auto w-full max-w-[1180px] px-5 pb-14 pt-20 sm:px-8 md:pb-20 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Data rights"
            title="One rights surface. Different laws underneath."
            body="Your available rights depend on the jurisdiction, the reason the data is processed, the type of data and any applicable exemptions. Veklom uses one intake surface so the request can be mapped to the correct legal profile instead of forcing users to know which statute to cite."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1180px] px-5 pb-24 sm:px-8 md:pb-32 lg:px-10">
          <div className="grid gap-3">
            {rights.map(([title, body], index) => (
              <article key={title} className="grid gap-5 rounded-[26px] border border-theme-border bg-theme-surface p-6 sm:grid-cols-[64px_1fr] sm:p-7">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-theme-border bg-theme-bg text-[10px] font-semibold text-theme-inkDim">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-.03em] text-theme-ink">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-theme-inkDim">{body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
            <div className="rounded-[30px] border border-theme-border bg-theme-ink p-8 text-white">
              <StageLabel>Submit a request</StageLabel>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-.045em]">Authenticated account requests should come from the account whenever possible.</h2>
              <p className="mt-5 text-sm leading-7 text-white/62">That gives Veklom a safer identity-verification path before we disclose, export, correct or delete account data. If you cannot access your account, contact support and we will use an alternate verification process.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login?returnTo=/os" className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#06080d]">Open Capability OS →</Link>
                <a href="mailto:support@veklom.com?subject=Privacy%20Rights%20Request" className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/[.04] px-5 text-sm font-semibold text-white">Email privacy request</a>
              </div>
            </div>

            <aside className="rounded-[30px] border border-theme-border bg-theme-surface p-8">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Verification & retention</div>
              <p className="mt-5 text-sm leading-7 text-theme-inkDim">We may ask for enough information to verify that a requester is the data subject, account owner or authorized representative. We should not disclose account data merely because someone knows an email address.</p>
              <p className="mt-5 text-sm leading-7 text-theme-inkDim">Deletion is not absolute. Security logs, fraud-prevention records, legal obligations, contractual claims and append-only execution evidence can have separate retention requirements. When an exception applies, the response should explain the reason rather than pretending the request never existed.</p>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link href="/privacy" className="rounded-full border border-theme-border bg-theme-bg px-3 py-2 text-xs font-medium text-theme-ink">Privacy</Link>
                <Link href="/privacy-choices" className="rounded-full border border-theme-border bg-theme-bg px-3 py-2 text-xs font-medium text-theme-ink">Privacy choices</Link>
                <Link href="/trust" className="rounded-full border border-theme-border bg-theme-bg px-3 py-2 text-xs font-medium text-theme-ink">Trust Center</Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
