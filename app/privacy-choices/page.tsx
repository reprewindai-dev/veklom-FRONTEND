"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { AmbientField, PremiumPageIntro, StageLabel } from "@/components/brand/PremiumPrimitives";
import { readPrivacyChoices, storePrivacyChoices } from "@/components/privacy/PrivacyRuntime";

type Jurisdiction = {
  country: string;
  region?: string | null;
  regime: string;
  globalPrivacyControl: boolean;
  crossBorderReview: boolean;
  rights: string[];
  note: string;
};

export default function PrivacyChoicesPage() {
  const [analytics, setAnalytics] = useState(false);
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = readPrivacyChoices();
    setAnalytics(saved?.analytics === true);
    setSavedAt(saved?.decidedAt || null);

    fetch("/api/privacy/jurisdiction", { cache: "no-store" })
      .then(async (response) => (response.ok ? ((await response.json()) as Jurisdiction) : null))
      .then((profile) => profile && setJurisdiction(profile))
      .catch(() => undefined);
  }, []);

  function save(nextAnalytics: boolean) {
    const effective = jurisdiction?.globalPrivacyControl ? false : nextAnalytics;
    setAnalytics(effective);
    storePrivacyChoices({ analytics: effective, source: jurisdiction?.globalPrivacyControl ? "gpc" : "privacy_choices" });
    setSavedAt(new Date().toISOString());
  }

  return (
    <HumanAppShell>
      <main className="relative overflow-hidden">
        <AmbientField className="opacity-45" />
        <section className="relative mx-auto w-full max-w-[1180px] px-5 pb-14 pt-20 sm:px-8 md:pb-20 md:pt-28 lg:px-10">
          <PremiumPageIntro
            eyebrow="Privacy choices"
            title="Essential by default. Optional by choice."
            body="Change optional analytics at any time. Essential security/session functions cannot be disabled because they are required to provide the service you requested. Advertising and cross-context behavioral advertising are not enabled by this control."
          />
        </section>

        <section className="relative mx-auto w-full max-w-[1180px] px-5 pb-24 sm:px-8 md:pb-32 lg:px-10">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-[30px] border border-theme-border bg-theme-surface p-7 sm:p-9">
              <StageLabel>Device preferences</StageLabel>
              <div className="mt-8 grid gap-4">
                <div className="rounded-2xl border border-theme-border bg-theme-bg p-5">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-.025em] text-theme-ink">Essential security & sessions</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-theme-inkDim">Authentication, CSRF/OAuth integrity, session continuity and security controls needed to deliver the requested service.</p>
                    </div>
                    <span className="rounded-full border border-theme-border bg-theme-surface px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-theme-inkDim">Always on</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-theme-border bg-theme-bg p-5">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-.025em] text-theme-ink">Optional analytics</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-theme-inkDim">If enabled and configured, Veklom may load analytics for aggregate product measurement. Ad storage, ad personalization and cross-device Veklom user-ID syncing remain disabled by this preference.</p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={analytics}
                      disabled={jurisdiction?.globalPrivacyControl === true}
                      onClick={() => save(!analytics)}
                      className={`relative h-8 w-14 shrink-0 rounded-full border transition ${analytics ? "border-theme-ink bg-theme-ink" : "border-theme-border bg-theme-surface"} disabled:cursor-not-allowed disabled:opacity-45`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${analytics ? "left-8" : "left-1"}`} />
                    </button>
                  </div>
                  {jurisdiction?.globalPrivacyControl ? <p className="mt-4 text-xs leading-5 text-theme-inkDim">Your browser is sending Global Privacy Control. Optional analytics are therefore forced off on this device/session.</p> : null}
                </div>

                <div className="rounded-2xl border border-theme-border bg-theme-bg p-5">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h2 className="text-lg font-semibold tracking-[-.025em] text-theme-ink">Sale / sharing for targeted advertising</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-theme-inkDim">This preference is fixed off. The current public privacy runtime does not enable sale/share tracking or cross-context behavioral advertising.</p>
                    </div>
                    <span className="rounded-full border border-theme-border bg-theme-surface px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.18em] text-theme-inkDim">Off</span>
                  </div>
                </div>
              </div>
              {savedAt ? <p className="mt-5 text-xs text-theme-inkDim">Last device choice: {new Date(savedAt).toLocaleString()}</p> : null}
            </div>

            <aside className="rounded-[30px] border border-theme-border bg-[#05070b] p-7 text-white sm:p-9">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/38">Jurisdiction signal</div>
              <div className="mt-5 text-2xl font-semibold tracking-[-.04em]">{jurisdiction?.regime?.replaceAll("_", " ") || "Strict global baseline"}</div>
              <div className="mt-3 font-mono text-xs text-white/44">{jurisdiction?.country || "XX"}{jurisdiction?.region ? ` · ${jurisdiction.region}` : ""}</div>
              <p className="mt-7 text-sm leading-7 text-white/58">{jurisdiction?.note || "Location signal unavailable. Optional processing remains disabled by default."}</p>
              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/36">Important</div>
                <p className="mt-3 text-xs leading-6 text-white/52">Country detection is a coarse ingress signal, not proof of residence or legal domicile. Account/deployment records and contractual jurisdiction take priority when known.</p>
              </div>
            </aside>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/privacy" className="inline-flex min-h-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-5 text-sm font-medium text-theme-ink">Privacy notice</Link>
            <Link href="/data-rights" className="inline-flex min-h-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-5 text-sm font-medium text-theme-ink">Data rights</Link>
            <Link href="/trust" className="inline-flex min-h-11 items-center justify-center rounded-full bg-theme-ink px-5 text-sm font-semibold text-theme-bg">Trust Center →</Link>
          </div>
        </section>
      </main>
    </HumanAppShell>
  );
}
