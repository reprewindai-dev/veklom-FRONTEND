"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useState, useEffect } from "react";
import { agentDuelWalletConfig } from "./walletConfig";

export function WalletProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <>{children}</>;
  
  return (
    <WagmiProvider config={agentDuelWalletConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
