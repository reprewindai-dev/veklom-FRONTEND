// Tier model — mapped from the Veklom build plan.
// Now expanded to include Machine API tiers (bronze/medium/good).

export type Tier = "free" | "starter" | "pro" | "sovereign" | "enterprise" | "bronze" | "medium" | "good";

export const TIER_RANK: Record<Tier, number> = {
  free: 0,
  starter: 1,
  bronze: 1,
  pro: 2,
  medium: 2,
  sovereign: 3,
  good: 3,
  enterprise: 4,
};

export const TIER_LABEL: Record<Tier, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  sovereign: "Sovereign",
  enterprise: "Enterprise",
  bronze: "Bronze API",
  medium: "Medium API",
  good: "Good API",
};

export const TIER_PRICE: Record<Tier, string> = {
  free: "$0",
  starter: "$7.5K",
  pro: "$18K",
  sovereign: "Custom",
  enterprise: "$45K",
  bronze: "$0.001 USDC",
  medium: "$0.05 USDC",
  good: "$0.25 USDC",
};

export function meetsTier(current: Tier | undefined, required: Tier): boolean {
  if (!current) return false;
  return TIER_RANK[current] >= TIER_RANK[required];
}

export function normalizeTier(raw: unknown): Tier {
  const s = String(raw ?? "free").toLowerCase();
  if (s.includes("enterprise")) return "enterprise";
  if (s.includes("sovereign")) return "sovereign";
  if (s.includes("pro")) return "pro";
  if (s.includes("starter") || s.includes("basic")) return "starter";
  if (s.includes("bronze")) return "bronze";
  if (s.includes("medium")) return "medium";
  if (s.includes("good")) return "good";
  return "free";
}

