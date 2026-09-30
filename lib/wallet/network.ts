// Veklom Wallet network selection. Base Sepolia (testnet) unless the owner sets
// WALLET_NETWORK=base (mainnet) on the frontend server and on LockerPhycer.
//
// Chain ids / explorers: https://docs.base.org/get-started/connect-to-base
// USDC addresses: https://developers.circle.com/stablecoins/usdc-contract-addresses
// (linked from https://docs.base.org/build-on-base/accept-payments/make-a-simple-payment)

export type WalletNetworkKey = "base-sepolia" | "base";

export type WalletNetwork = {
  key: WalletNetworkKey;
  chainId: number;
  name: string;
  explorer: string;
  testnet: boolean;
  usdc: `0x${string}`;
};

export const WALLET_NETWORKS: Record<WalletNetworkKey, WalletNetwork> = {
  "base-sepolia": {
    key: "base-sepolia",
    chainId: 84532,
    name: "Base Sepolia",
    explorer: "https://sepolia.basescan.org",
    testnet: true,
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  base: {
    key: "base",
    chainId: 8453,
    name: "Base",
    explorer: "https://basescan.org",
    testnet: false,
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};

export function resolveWalletNetwork(value: string | null | undefined): WalletNetwork {
  const key = (value || "").trim().toLowerCase();
  return key === "base" || key === "base-mainnet" || key === "mainnet"
    ? WALLET_NETWORKS.base
    : WALLET_NETWORKS["base-sepolia"];
}

export function shortAddress(address: string | null | undefined): string {
  if (!address) return "";
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

/** Dollar amounts a normal user picks from; they map 1:1 to the Stripe top-up kinds. */
export const FUNDING_AMOUNTS_USD = [50, 100, 500] as const;
export type FundingAmountUsd = (typeof FUNDING_AMOUNTS_USD)[number];

export function stripeTopupKind(amount: FundingAmountUsd): "topup_50" | "topup_100" | "topup_500" {
  return `topup_${amount}` as const;
}

/** USDC has 6 decimals on Base. */
export function usdcUnits(amountUsd: number): bigint {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) throw new Error("amount must be positive");
  return BigInt(Math.round(amountUsd * 100)) * BigInt(10_000);
}
