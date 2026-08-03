"use client";

import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";

export const agentDuelQueryClient = new QueryClient();

const walletConnectors =
  typeof window === "undefined"
    ? []
    : [
        coinbaseWallet({
          appName: "Veklom Agent Duel",
        }),
        injected({
          target: "metaMask",
        }),
        injected(),
      ];

export const agentDuelWalletConfig = createConfig({
  chains: [base, mainnet],
  connectors: walletConnectors,
  transports: {
    [base.id]: http("https://mainnet.base.org"),
    [mainnet.id]: http(),
  },
});
