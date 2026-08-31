export type PrivacyRegime =
  | "EEA_GDPR"
  | "UK_GDPR"
  | "CANADA"
  | "US_CALIFORNIA"
  | "US_OTHER"
  | "BRAZIL_LGPD"
  | "SINGAPORE_PDPA"
  | "JAPAN_APPI"
  | "AUSTRALIA_PRIVACY"
  | "INDIA_DPDP"
  | "CHINA_PIPL"
  | "GLOBAL_STRICT";

export type DeploymentMode = "VPC" | "ON_PREMISES" | "AIR_GAPPED";

export interface PrivacyJurisdictionProfile {
  country: string;
  region?: string | null;
  regime: PrivacyRegime;
  requiresPriorOptionalConsent: boolean;
  showConsentPrompt: boolean;
  honorGlobalPrivacyControl: boolean;
  optionalAnalyticsDefault: false;
  optionalMarketingDefault: false;
  externalProcessingDefault: boolean;
  crossBorderReview: boolean;
  privacyByDefault: true;
  rights: string[];
  note: string;
}

const EEA = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
  "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL", "PT", "RO",
  "SK", "SI", "ES", "SE",
]);

const RIGHTS_GDPR = [
  "informed",
  "access",
  "rectification",
  "erasure",
  "restriction",
  "portability",
  "object",
  "withdraw_consent",
  "automated_decision_information",
  "complaint",
];

const RIGHTS_BASELINE = ["informed", "access", "correction", "deletion", "withdraw_consent", "complaint"];

export function normalizeCountry(value?: string | null): string {
  const country = (value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(country) ? country : "XX";
}

export function normalizeRegion(value?: string | null): string | null {
  const region = (value || "").trim().toUpperCase();
  return region || null;
}

export function resolvePrivacyProfile(countryInput?: string | null, regionInput?: string | null): PrivacyJurisdictionProfile {
  const country = normalizeCountry(countryInput);
  const region = normalizeRegion(regionInput);

  if (EEA.has(country)) {
    return {
      country, region, regime: "EEA_GDPR",
      requiresPriorOptionalConsent: true,
      showConsentPrompt: true,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: RIGHTS_GDPR,
      note: "Optional analytics/marketing remain off until a valid choice is recorded. Cross-border processing requires an approved transfer basis and deployment review.",
    };
  }

  if (country === "GB") {
    return {
      country, region, regime: "UK_GDPR",
      requiresPriorOptionalConsent: true,
      showConsentPrompt: true,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: RIGHTS_GDPR,
      note: "Non-essential device storage/analytics stay off until consent where required by UK data-protection and electronic-communications rules.",
    };
  }

  if (country === "CA") {
    return {
      country, region, regime: "CANADA",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "accountability", "meaningful_consent"],
      note: "Privacy defaults stay at the strict setting. Optional processing requires a separate meaningful choice; Québec-style privacy-by-default is used as the Canadian baseline rather than weakening defaults by province.",
    };
  }

  if (country === "US" && region === "CA") {
    return {
      country, region, regime: "US_CALIFORNIA",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: true,
      crossBorderReview: false,
      privacyByDefault: true,
      rights: ["know", "access", "delete", "correct", "opt_out_sale_share", "limit_sensitive", "non_discrimination"],
      note: "Veklom does not use this profile to infer that data is sold or shared. If a covered sale/share or targeted-advertising flow is introduced, GPC and the Privacy Choices surface must remain enforceable.",
    };
  }

  if (country === "US") {
    return {
      country, region, regime: "US_OTHER",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: true,
      crossBorderReview: false,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "state_specific_opt_outs"],
      note: "No EU-style consent popup is forced merely because the visitor is in the United States. Optional analytics remain off by default and state-specific rights can be applied through the same policy engine.",
    };
  }

  if (country === "BR") {
    return {
      country, region, regime: "BRAZIL_LGPD",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "confirmation", "portability", "processing_information"],
      note: "Optional processing stays disabled until a valid basis and purpose are established. Data-subject requests are routed through the common rights workflow.",
    };
  }

  if (country === "SG") {
    return {
      country, region, regime: "SINGAPORE_PDPA",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "purpose_notification"],
      note: "Collection/use/disclosure must remain tied to notified reasonable purposes; unnecessary optional processing is not made a condition of product access.",
    };
  }

  if (country === "JP") {
    return {
      country, region, regime: "JAPAN_APPI",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "cross_border_information"],
      note: "External disclosure and cross-border processing remain deployment-reviewed; optional analytics are not silently enabled.",
    };
  }

  if (country === "AU") {
    return {
      country, region, regime: "AUSTRALIA_PRIVACY",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "privacy_policy", "cross_border_disclosure"],
      note: "The strict baseline minimizes collection and keeps overseas disclosure subject to deployment review rather than assuming a global transfer permission.",
    };
  }

  if (country === "IN") {
    return {
      country, region, regime: "INDIA_DPDP",
      requiresPriorOptionalConsent: false,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "grievance"],
      note: "Purpose, notice and consent/other lawful processing requirements are handled through the policy registry; optional processing defaults off.",
    };
  }

  if (country === "CN") {
    return {
      country, region, regime: "CHINA_PIPL",
      requiresPriorOptionalConsent: true,
      showConsentPrompt: false,
      honorGlobalPrivacyControl: true,
      optionalAnalyticsDefault: false,
      optionalMarketingDefault: false,
      externalProcessingDefault: false,
      crossBorderReview: true,
      privacyByDefault: true,
      rights: [...RIGHTS_BASELINE, "separate_consent_review", "localization_transfer_review"],
      note: "Optional analytics/marketing and external transfers remain disabled by default. Production activation requires region-specific legal and deployment review rather than a generic cookie banner.",
    };
  }

  return {
    country, region, regime: "GLOBAL_STRICT",
    requiresPriorOptionalConsent: false,
    showConsentPrompt: false,
    honorGlobalPrivacyControl: true,
    optionalAnalyticsDefault: false,
    optionalMarketingDefault: false,
    externalProcessingDefault: false,
    crossBorderReview: true,
    privacyByDefault: true,
    rights: RIGHTS_BASELINE,
    note: "Unknown jurisdiction: use the strict global baseline, collect only what is necessary, keep optional processing disabled and require an explicit deployment review before new external data flows are enabled.",
  };
}

export function deploymentPrivacyPosture(mode: DeploymentMode) {
  switch (mode) {
    case "AIR_GAPPED":
      return {
        outboundByDefault: false,
        telemetryByDefault: false,
        publicConsentUiExpected: false,
        description: "Fully offline deployment. No analytics, call-home or external transfer should occur from the governed runtime unless the deployment is deliberately changed out of air-gapped mode.",
      };
    case "ON_PREMISES":
      return {
        outboundByDefault: false,
        telemetryByDefault: false,
        publicConsentUiExpected: false,
        description: "Runs on operator-controlled physical infrastructure. External processing is capability-specific and must be deliberately enabled rather than inherited from the control plane.",
      };
    case "VPC":
    default:
      return {
        outboundByDefault: false,
        telemetryByDefault: false,
        publicConsentUiExpected: true,
        description: "Runs inside the institution-selected cloud perimeter. External providers remain explicit capability choices and cross-border requirements are evaluated before enabling them.",
      };
  }
}
