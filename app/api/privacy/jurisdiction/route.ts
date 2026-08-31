import { NextRequest, NextResponse } from "next/server";
import { resolvePrivacyProfile } from "@/lib/privacy/jurisdiction";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const country = req.headers.get("cf-ipcountry");
  const region = req.headers.get("cf-region-code");
  const profile = resolvePrivacyProfile(country, region);

  return NextResponse.json({
    source: country ? "edge_country" : "strict_global_fallback",
    country: profile.country,
    region: profile.region,
    regime: profile.regime,
    requiresPriorOptionalConsent: profile.requiresPriorOptionalConsent,
    showConsentPrompt: profile.showConsentPrompt,
    globalPrivacyControl: req.headers.get("sec-gpc") === "1",
    optionalAnalyticsDefault: false,
    optionalMarketingDefault: false,
    crossBorderReview: profile.crossBorderReview,
    privacyByDefault: true,
    rights: profile.rights,
    note: profile.note,
  }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
