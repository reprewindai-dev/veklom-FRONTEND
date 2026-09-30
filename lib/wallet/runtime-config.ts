// Public, non-secret wallet configuration served at runtime by
// app/api/wallet/config/route.ts, so the owner can set keys on the container
// without rebuilding (NEXT_PUBLIC_* values are otherwise baked at build time).

import { resolveWalletNetwork, type WalletNetworkKey } from "@/lib/wallet/network";

export type WalletRuntimeConfig = {
  /** CDP Portal project id (embedded wallets, "Create wallet" by email). */
  cdpProjectId: string | null;
  /** Reown (WalletConnect) Cloud project id (all-wallets connect modal). */
  reownProjectId: string | null;
  network: WalletNetworkKey;
  /** Coinbase Onramp: needs CDP secret API key on the server and Base mainnet. */
  onrampEnabled: boolean;
  appName: string;
  /** Best-effort country from the edge (Cloudflare), used by Onramp quotes. */
  country: string | null;
};

type Env = Record<string, string | undefined>;

// Bracket access keeps these reads at runtime (Next inlines direct
// process.env.NEXT_PUBLIC_* references at build time).
function read(env: Env, ...names: string[]): string | null {
  for (const name of names) {
    const value = env[name];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function walletRuntimeConfigFromEnv(env: Env, country: string | null = null): WalletRuntimeConfig {
  const network = resolveWalletNetwork(read(env, "WALLET_NETWORK", "NEXT_PUBLIC_WALLET_NETWORK")).key;
  const hasOnrampKeys = Boolean(read(env, "CDP_API_KEY_ID") && read(env, "CDP_API_KEY_SECRET"));
  const onrampFlag = (read(env, "ONRAMP_ENABLED") ?? "true").toLowerCase() !== "false";
  return {
    cdpProjectId: read(env, "CDP_PROJECT_ID", "NEXT_PUBLIC_CDP_PROJECT_ID"),
    reownProjectId: read(env, "REOWN_PROJECT_ID", "NEXT_PUBLIC_REOWN_PROJECT_ID"),
    network,
    // Onramp buys real assets on Base mainnet; it is off on the testnet default.
    onrampEnabled: hasOnrampKeys && onrampFlag && network === "base",
    appName: read(env, "WALLET_APP_NAME") ?? "Veklom",
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
  };
}

export const WALLET_UNAVAILABLE = "wallet setup unavailable";
