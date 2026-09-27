/**
 * Veklom Commercial Model v1.0 (Hardened Launch Card)
 * Canonical Types & Constants
 */

export type PlanTier = "free" | "pro" | "team" | "enterprise";

export interface PlanConfig {
  id: PlanTier;
  name: string;
  priceMonthlyUsd: number;
  monthlyCredits: number;
  workspacesLimit: number;
  usersLimit: number;
  evidenceRetentionDays: number;
  concurrencyLimit: number;
  discoveryUnlimited: boolean;
  vlinkEnabled: boolean;
  openApiEnabled: boolean;
  webMcpEnabled: boolean;
  inboundX402Enabled: boolean;
  outboundX402Mode: "none" | "sandbox_only" | "allow_listed" | "custom";
  spendPolicyTier: "none" | "basic" | "advanced" | "enterprise";
  byocSupported: boolean;
  fairUseRateLimits: {
    discoveryRequestsPerMin: number;
    governedActionsPerMin: number;
    burstLimit: string;
    concurrentMounts: number;
    mountTtlMinutes: number;
  };
}

export const VEKLOM_PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyUsd: 0,
    monthlyCredits: 400,
    workspacesLimit: 1,
    usersLimit: 1,
    evidenceRetentionDays: 7,
    concurrencyLimit: 2,
    discoveryUnlimited: true,
    vlinkEnabled: true,
    openApiEnabled: true,
    webMcpEnabled: true,
    inboundX402Enabled: true,
    outboundX402Mode: "none",
    spendPolicyTier: "none",
    byocSupported: false,
    fairUseRateLimits: {
      discoveryRequestsPerMin: 60,
      governedActionsPerMin: 5,
      burstLimit: "2x / 10s",
      concurrentMounts: 2,
      mountTtlMinutes: 5,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthlyUsd: 29.99,
    monthlyCredits: 3750,
    workspacesLimit: 3,
    usersLimit: 5,
    evidenceRetentionDays: 30,
    concurrencyLimit: 10,
    discoveryUnlimited: true,
    vlinkEnabled: true,
    openApiEnabled: true,
    webMcpEnabled: true,
    inboundX402Enabled: true,
    outboundX402Mode: "sandbox_only",
    spendPolicyTier: "basic",
    byocSupported: false,
    fairUseRateLimits: {
      discoveryRequestsPerMin: 300,
      governedActionsPerMin: 20,
      burstLimit: "3x / 10s",
      concurrentMounts: 10,
      mountTtlMinutes: 15,
    },
  },
  team: {
    id: "team",
    name: "Team",
    priceMonthlyUsd: 89.99,
    monthlyCredits: 10000,
    workspacesLimit: 10,
    usersLimit: 25,
    evidenceRetentionDays: 90,
    concurrencyLimit: 50,
    discoveryUnlimited: true,
    vlinkEnabled: true,
    openApiEnabled: true,
    webMcpEnabled: true,
    inboundX402Enabled: true,
    outboundX402Mode: "allow_listed",
    spendPolicyTier: "advanced",
    byocSupported: false,
    fairUseRateLimits: {
      discoveryRequestsPerMin: 1200,
      governedActionsPerMin: 100,
      burstLimit: "3x / 30s",
      concurrentMounts: 50,
      mountTtlMinutes: 60,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthlyUsd: 0, // Contractual
    monthlyCredits: -1, // Negotiated
    workspacesLimit: -1,
    usersLimit: -1,
    evidenceRetentionDays: -1,
    concurrencyLimit: -1,
    discoveryUnlimited: true,
    vlinkEnabled: true,
    openApiEnabled: true,
    webMcpEnabled: true,
    inboundX402Enabled: true,
    outboundX402Mode: "custom",
    spendPolicyTier: "enterprise",
    byocSupported: true,
    fairUseRateLimits: {
      discoveryRequestsPerMin: 5000,
      governedActionsPerMin: 500,
      burstLimit: "custom",
      concurrentMounts: 200,
      mountTtlMinutes: 120,
    },
  },
};

export const CREDIT_EXCHANGE_RATE = 0.01; // 1 credit = $0.01 USD / USDC
export const CREDITS_PER_USD = 100;

export type ActionCategory =
  | "verification_read"
  | "standard_governed_action"
  | "governed_execution"
  | "payment_authorization"
  | "external_spend_orchestration"
  | "critical_consequence";

export const ACTION_CREDIT_SCHEDULE: Record<ActionCategory, number> = {
  verification_read: 5,
  standard_governed_action: 15,
  governed_execution: 25,
  payment_authorization: 100,
  external_spend_orchestration: 250,
  critical_consequence: 500,
};

export type WalletType =
  | "cdp_embedded_smart"
  | "cdp_agentic"
  | "connected_external";

export interface UnifiedBillingIdentity {
  workspaceId: string;
  vlinkId: string;
  walletAddress: string;
  walletType: WalletType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  isMachine: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceEntitlement {
  workspaceId: string;
  plan: PlanTier;
  status: "active" | "past_due" | "canceled" | "unpaid";
  currentBillingPeriodStart: string;
  currentBillingPeriodEnd: string;
  monthlyCreditsGranted: number;
  monthlyCreditsUsed: number;
  topupCreditsBalance: number; // Non-expiring, carried forward indefinitely
  totalCreditsRemaining: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  walletAddress?: string;
  vlinkId?: string;
  updatedAt: string;
}

export interface CreditLedgerEntry {
  entryId: string;
  workspaceId: string;
  timestamp: string;
  type: "grant" | "debit" | "topup" | "refund";
  actionCategory?: ActionCategory;
  credits: number;
  monthlyDebit: number;
  topupDebit: number;
  balanceAfter: number;
  settlementRail: "off_chain_ledger" | "x402_base_usdc" | "stripe_fiat";
  settlementReference?: string;
  evidenceHash: string;
  description: string;
}

export interface X402SettlementRequest {
  workspaceId: string;
  network: "base" | "base-sepolia";
  asset: "USDC";
  amountUsdc: number;
  payerWallet: string;
  treasuryWallet: string;
  txHash: string;
  purpose: "credit_topup" | "machine_subscription";
  targetPlan?: PlanTier;
}

export interface OutboundX402SpendRequest {
  workspaceId: string;
  agentId: string;
  provider: string; // e.g. "browserbase", "anchor", "e2b"
  amountUsd: number;
  asset: "USDC";
  network: "base";
  actionDescription: string;
  idempotencyKey: string;
}

export interface OutboundX402SpendResult {
  authorized: boolean;
  cappoDecision: "ALLOW" | "DENY" | "NEEDS_APPROVAL";
  rejectionReason?: string;
  settlementTxHash?: string;
  amountSettledUsd: number;
  receiptId?: string;
  evidenceHash: string;
  timestamp: string;
}
