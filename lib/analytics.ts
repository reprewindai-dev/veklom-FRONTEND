"use client";

export type AnalyticsParam = string | number | boolean | null | undefined;
export type AnalyticsParams = Record<string, AnalyticsParam>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function cleanParams(params: AnalyticsParams): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    clean[key] = value;
  }
  return clean;
}

/**
 * Consent-safe GA4 event helper.
 *
 * PrivacyRuntime creates window.gtag only after analytics consent is active.
 * If analytics is unavailable or denied this intentionally becomes a no-op.
 *
 * Never send secrets, credentials, capability tokens, lease IDs, execution IDs,
 * email addresses, raw evidence payloads, or other user-provided sensitive data.
 */
export function trackAnalyticsEvent(name: string, params: AnalyticsParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, cleanParams(params));
}
