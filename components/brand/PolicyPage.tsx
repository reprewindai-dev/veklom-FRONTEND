import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";

export interface PolicySection {
  title: string;
  body?: string;
  items?: string[];
}

export function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
  note,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
  note?: string;
}) {
  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-45" />
        <section className="relative mx-auto w-full max-w-[1180px] px-5 pb-14 pt-20 sm:px-8 md:pb-20 md:pt-28 lg:px-10">
          <PremiumPageIntro eyebrow={eyebrow} title={title} body={intro} />
        </section>

        <section className="relative mx-auto grid w-full max-w-[1180px] gap-4 px-5 pb-24 sm:px-8 md:pb-32 lg:px-10">
          {sections.map((section, index) => (
            <article key={section.title} className="rounded-[28px] border border-theme-border bg-theme-surface p-7 sm:p-8 md:p-9">
              <div className="grid gap-6 md:grid-cols-[170px_1fr] md:gap-10">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">{String(index + 1).padStart(2, "0")}</div>
                  <h2 className="mt-3 text-xl font-semibold tracking-[-.03em] text-theme-ink">{section.title}</h2>
                </div>
                <div>
                  {section.body ? <p className="text-sm leading-7 text-theme-inkDim">{section.body}</p> : null}
                  {section.items?.length ? (
                    <div className={`${section.body ? "mt-5" : ""} grid gap-2`}>
                      {section.items.map((item) => (
                        <div key={item} className="flex gap-3 rounded-2xl border border-theme-border bg-theme-bg/55 px-4 py-3.5 text-sm leading-6 text-theme-ink">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-theme-accent" />
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}

          {note ? (
            <div className="mt-4 rounded-[28px] border border-theme-border bg-theme-ink p-7 text-theme-bg sm:p-9">
              <StageLabel>Truth boundary</StageLabel>
              <p className="mt-6 max-w-4xl text-lg leading-8 text-white/72">{note}</p>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/security" className="inline-flex min-h-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-5 text-sm font-medium text-theme-ink">Security</Link>
            <Link href="/support" className="inline-flex min-h-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-5 text-sm font-medium text-theme-ink">Support</Link>
            <Link href="/docs" className="inline-flex min-h-11 items-center justify-center rounded-full bg-theme-ink px-5 text-sm font-semibold text-theme-bg">Documentation →</Link>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
