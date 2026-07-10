"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { agentDuelQueryClient, agentDuelWalletConfig } from "./walletConfig";

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={agentDuelWalletConfig}>
      <QueryClientProvider client={agentDuelQueryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
