"use client";

// Client-only wallet runtime (loaded with next/dynamic, ssr: false).
//
// Stack (see docs cited in lib/wallet/*):
//   * Create wallet, email: CDP Embedded Wallets (@coinbase/cdp-react AuthButton),
//     https://docs.cdp.coinbase.com/wallets/client-side-development/react-components
//   * Create wallet, passkey: Base Account via wagmi's baseAccount connector,
//     https://docs.cdp.coinbase.com/coinbase-wallet/framework-integrations/wagmi/setup
//   * Connect existing: Reown AppKit modal (all WalletConnect-listed wallets,
//     browser wallets, Coinbase Wallet / Base Account featured first),
//     https://docs.cdp.coinbase.com/coinbase-wallet/framework-integrations/reown
//   CDP embedded and wagmi run side by side ("dual connector approach"),
//   https://docs.cdp.coinbase.com/coinbase-wallet/framework-integrations/cdp
//
// Every piece is optional: a missing project id disables only the path that
// needs it, and the step shows "wallet setup unavailable" instead of crashing.

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, type Config } from "wagmi";
import { baseAccount, injected } from "wagmi/connectors";
import { base, baseSepolia } from "viem/chains";
import { CDPReactProvider, type Config as CdpConfig, type Theme } from "@coinbase/cdp-react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { createAppKit } from "@reown/appkit/react";
import { base as appKitBase, baseSepolia as appKitBaseSepolia, type AppKitNetwork } from "@reown/appkit/networks";
import { resolveWalletNetwork, type WalletNetwork } from "@/lib/wallet/network";
import type { WalletRuntimeConfig } from "@/lib/wallet/runtime-config";

// Coinbase Wallet / Base Account id in the WalletConnect registry, as used in the
// Reown integration guide above.
const BASE_ACCOUNT_WALLET_ID = "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa";

type WalletRuntimeValue = {
  config: WalletRuntimeConfig;
  network: WalletNetwork;
  cdpEnabled: boolean;
  appKitEnabled: boolean;
};

const WalletRuntimeContext = createContext<WalletRuntimeValue | null>(null);

export function useWalletRuntime(): WalletRuntimeValue {
  const value = useContext(WalletRuntimeContext);
  if (!value) throw new Error("useWalletRuntime must be used inside <WalletRuntime>");
  return value;
}

const cdpTheme: Partial<Theme> = {
  "colors-bg-default": "rgb(var(--theme-surface-rgb))",
  "colors-bg-alternate": "rgb(var(--theme-surface-2-rgb))",
  "colors-bg-primary": "rgb(var(--theme-accent))",
  "colors-fg-default": "var(--theme-text)",
  "colors-fg-muted": "var(--theme-text-muted)",
  "colors-line-default": "var(--theme-border)",
};

let appKitWagmiConfig: Config | null = null;
let fallbackWagmiConfig: Config | null = null;
let queryClient: QueryClient | null = null;

function wagmiConfigFor(config: WalletRuntimeConfig, network: WalletNetwork): { wagmi: Config; appKit: boolean } {
  const chain = network.testnet ? baseSepolia : base;
  if (config.reownProjectId) {
    if (!appKitWagmiConfig) {
      const networks = [network.testnet ? appKitBaseSepolia : appKitBase] as [AppKitNetwork, ...AppKitNetwork[]];
      const adapter = new WagmiAdapter({ projectId: config.reownProjectId, networks });
      const origin = typeof window !== "undefined" ? window.location.origin : "https://veklom.com";
      createAppKit({
        adapters: [adapter],
        projectId: config.reownProjectId,
        networks,
        metadata: {
          name: config.appName,
          description: "Veklom Wallet: funding for governed actions (authority is granted separately, per action)",
          url: origin,
          icons: [`${origin}/favicon.ico`],
        },
        features: { analytics: false, email: false, socials: false, onramp: false, swaps: false },
        featuredWalletIds: [BASE_ACCOUNT_WALLET_ID],
        allWallets: "SHOW",
        themeMode: "dark",
      });
      appKitWagmiConfig = adapter.wagmiConfig as unknown as Config;
    }
    return { wagmi: appKitWagmiConfig, appKit: true };
  }
  if (!fallbackWagmiConfig) {
    // No Reown project id: Base Account (passkey) and injected browser wallets only.
    fallbackWagmiConfig = createConfig({
      chains: [chain],
      connectors: [baseAccount({ appName: config.appName }), injected()],
      transports: { [chain.id]: http() } as Record<number, ReturnType<typeof http>>,
      ssr: false,
    }) as unknown as Config;
  }
  return { wagmi: fallbackWagmiConfig, appKit: false };
}

export function WalletRuntime({ config, children }: { config: WalletRuntimeConfig; children: ReactNode }) {
  const network = resolveWalletNetwork(config.network);
  const { wagmi, appKit } = useMemo(() => wagmiConfigFor(config, network), [config, network]);
  queryClient ??= new QueryClient();
  const value = useMemo<WalletRuntimeValue>(
    () => ({ config, network, cdpEnabled: Boolean(config.cdpProjectId), appKitEnabled: appKit }),
    [config, network, appKit],
  );

  const tree = (
    <WagmiProvider config={wagmi}>
      <QueryClientProvider client={queryClient}>
        <WalletRuntimeContext.Provider value={value}>{children}</WalletRuntimeContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );

  if (!config.cdpProjectId) return tree;
  const cdpConfig: CdpConfig = {
    projectId: config.cdpProjectId,
    ethereum: { createOnLogin: "eoa" },
    appName: config.appName,
  };
  return (
    <CDPReactProvider config={cdpConfig} theme={cdpTheme}>
      {tree}
    </CDPReactProvider>
  );
}
