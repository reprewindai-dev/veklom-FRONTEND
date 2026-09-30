// Client for the LockerPhycer wallet routes (/api/v1/wallet/*) and the Stripe
// top-up checkout. All calls are same-origin through the Next proxy.

import { api } from "@/lib/api";

export type WalletSource = "created" | "connected";
export type WalletProvider = "cdp_embedded" | "base_account" | "walletconnect" | "injected" | "coinbase_wallet" | "other";

export type BoundWallet = {
  address: `0x${string}`;
  chain_id: number;
  source: WalletSource;
  wallet_provider: WalletProvider | null;
  signature_kind: "eoa" | "contract";
  verified_at: string;
};

export type WalletState = {
  workspace_id: string;
  network: "base-sepolia" | "base";
  chain_id: number;
  name: string;
  explorer: string;
  testnet: boolean;
  wallet: BoundWallet | null;
};

export type WalletServerConfig = {
  network: "base-sepolia" | "base";
  chain_id: number;
  name: string;
  explorer: string;
  testnet: boolean;
  treasury_address: `0x${string}` | null;
  onchain_topup_enabled: boolean;
  credit_tokens: Array<{ symbol: string; address: `0x${string}`; decimals: number; usd_per_token: number }>;
  credits_per_usd: number;
  min_confirmations: number;
  stripe_topups: string[];
};

export type OnboardingState = {
  workspace_id: string;
  identity: boolean;
  email_verified: boolean;
  wallet: boolean;
  wallet_address: string | null;
  funded: boolean;
  capability: boolean;
  runtime: boolean;
  first_execution: boolean;
};

export type OnchainTopupResult = {
  credited: boolean;
  replay: boolean;
  credits: number;
  usd: string;
  tx_hash: string;
  chain_id: number;
};

const quiet = { handlePaymentRequired: false } as const;

export const walletApi = {
  state: () => api.get<WalletState>("/api/v1/wallet", quiet),
  config: () => api.get<WalletServerConfig>("/api/v1/wallet/config", quiet),
  onboarding: () => api.get<OnboardingState>("/api/v1/wallet/onboarding", quiet),
  nonce: () => api.post<{ nonce: string; chain_id: number; domains: string[] }>("/api/v1/wallet/nonce", {}, quiet),
  register: (body: { message: string; signature: string; source: WalletSource; wallet_provider: WalletProvider }) =>
    api.post<WalletState>("/api/v1/wallet/register", body, quiet),
  onchainTopup: (txHash: string) =>
    api.post<OnchainTopupResult>("/api/v1/wallet/topups/onchain", { tx_hash: txHash }, quiet),
  // Stripe is how a company pays Veklom (credits on the workspace), not wallet funding.
  stripeTopupCheckout: (kind: "topup_50" | "topup_100" | "topup_500") =>
    api.post<{ id: string; url: string }>("/api/v1/billing/checkout", { kind }, quiet),
};
