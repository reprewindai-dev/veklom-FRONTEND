"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Script from "next/script";

type Jurisdiction = {
  source: string;
  country: string;
  region?: string | null;
  regime: string;
  requiresPriorOptionalConsent: boolean;
  showConsentPrompt: boolean;
  globalPrivacyControl: boolean;
  optionalAnalyticsDefault: false;
  optionalMarketingDefault: false;
  crossBorderReview: boolean;
  privacyByDefault: true;
  rights: string[];
  note: string;
};

type PrivacyChoices = {
  version: string;
  analytics: boolean;
  marketing: false;
  saleShare: false;
  decidedAt: string;
  source: "banner" | "privacy_choices" | "gpc" | "default";
};

const VERSION = "2026-08-31.1";
export const PRIVACY_STORAGE_KEY = "veklom_privacy_choices";
export const PRIVACY_EVENT = "veklom:privacy-changed";

function readChoices(): PrivacyChoices | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PrivacyChoices;
    if (parsed.version !== VERSION) return null;
    return {
      version: VERSION,
      analytics: parsed.analytics === true,
      marketing: false,
      saleShare: false,
      decidedAt: parsed.decidedAt || new Date().toISOString(),
      source: parsed.source || "default",
    };
  } catch {
    return null;
  }
}

export function storePrivacyChoices(next: Pick<PrivacyChoices, "analytics" | "source">) {
  if (typeof window === "undefined") return;
  const record: PrivacyChoices = {
    version: VERSION,
    analytics: next.analytics === true,
    marketing: false,
    saleShare: false,
    decidedAt: new Date().toISOString(),
    source: next.source,
  };
  window.localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(PRIVACY_EVENT, { detail: record }));
}

function disableGoogleAnalytics(gaId: string) {
  if (!gaId || typeof window === "undefined") return;
  (window as Window & Record<string, unknown>)[`ga-disable-${gaId}`] = true;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.("consent", "update", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function enableGoogleAnalytics(gaId: string) {
  if (!gaId || typeof window === "undefined") return;
  (window as Window & Record<string, unknown>)[`ga-disable-${gaId}`] = false;
}

export default function PrivacyRuntime({ gaId }: { gaId: string }) {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction | null>(null);
  const [choices, setChoices] = useState<PrivacyChoices | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readChoices();
    setChoices(saved);

    let cancelled = false;
    fetch("/api/privacy/jurisdiction", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return (await response.json()) as Jurisdiction;
      })
      .then((profile) => {
        if (cancelled) return;
        setJurisdiction(profile);

        // A qualifying browser privacy signal always wins over a previously
        // stored optional-analytics grant on this device/session.
        if (profile.globalPrivacyControl) {
          const denied: PrivacyChoices = {
            version: VERSION,
            analytics: false,
            marketing: false,
            saleShare: false,
            decidedAt: new Date().toISOString(),
            source: "gpc",
          };
          window.localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(denied));
          setChoices(denied);
          disableGoogleAnalytics(gaId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setJurisdiction({
            source: "strict_global_fallback",
            country: "XX",
            regime: "GLOBAL_STRICT",
            requiresPriorOptionalConsent: false,
            showConsentPrompt: false,
            globalPrivacyControl: false,
            optionalAnalyticsDefault: false,
            optionalMarketingDefault: false,
            crossBorderReview: true,
            privacyByDefault: true,
            rights: ["informed", "access", "correction", "deletion", "withdraw_consent", "complaint"],
            note: "Jurisdiction unavailable; optional processing remains off.",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<PrivacyChoices>).detail;
      setChoices(detail || readChoices());
    };
    window.addEventListener(PRIVACY_EVENT, handleChange);

    return () => {
      cancelled = true;
      window.removeEventListener(PRIVACY_EVENT, handleChange);
    };
  }, [gaId]);

  const analyticsAllowed = useMemo(() => {
    if (!ready || !jurisdiction) return false;
    if (jurisdiction.globalPrivacyControl) return false;
    return choices?.analytics === true;
  }, [choices?.analytics, jurisdiction, ready]);

  useEffect(() => {
    if (analyticsAllowed) enableGoogleAnalytics(gaId);
    else disableGoogleAnalytics(gaId);
  }, [analyticsAllowed, gaId]);

  const needsPrompt = Boolean(
    ready &&
      jurisdiction?.showConsentPrompt &&
      !jurisdiction.globalPrivacyControl &&
      !choices,
  );

  return (
    <>
      {analyticsAllowed && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="veklom-consented-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = window.gtag || gtag;
              gtag('consent', 'default', {
                analytics_storage: 'granted',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
              });
              gtag('js', new Date());
              gtag('config', ${JSON.stringify(gaId)}, {
                anonymize_ip: true,
                allow_google_signals: false,
                allow_ad_personalization_signals: false,
                send_page_view: true
              });
            `}
          </Script>
        </>
      ) : null}

      {needsPrompt ? (
        <div className="fixed inset-x-0 bottom-0 z-[9999] border-t border-theme-border bg-theme-bg/96 px-4 py-4 shadow-[0_-24px_70px_rgba(0,0,0,.14)] backdrop-blur-2xl sm:px-6">
          <div className="mx-auto flex max-w-[1480px] flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <div className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">Privacy choice · {jurisdiction?.regime.replaceAll("_", " ")}</div>
              <p className="mt-2 text-sm leading-6 text-theme-ink">
                Veklom uses essential storage for security and sessions. Optional analytics stay off unless you allow them. Advertising, cross-context behavioral advertising and sale/share tracking are not enabled by this control.
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-theme-inkDim">
                <Link href="/privacy" className="underline decoration-theme-border underline-offset-4 hover:text-theme-ink">Privacy</Link>
                <Link href="/cookies" className="underline decoration-theme-border underline-offset-4 hover:text-theme-ink">Cookies</Link>
                <Link href="/privacy-choices" className="underline decoration-theme-border underline-offset-4 hover:text-theme-ink">Customize</Link>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => storePrivacyChoices({ analytics: false, source: "banner" })}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-theme-border bg-theme-surface px-5 text-sm font-semibold text-theme-ink"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={() => storePrivacyChoices({ analytics: true, source: "banner" })}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-theme-ink px-5 text-sm font-semibold text-theme-bg"
              >
                Allow analytics
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
