"use client";

// Browser-only part of the wallet step (wallet SDKs touch window at import time).

import { Component, type ReactNode } from "react";
import type { BoundWallet, WalletState } from "@/lib/wallet/api";
import type { WalletRuntimeConfig } from "@/lib/wallet/runtime-config";
import { WalletBinder } from "./WalletBinder";
import { WalletFunding } from "./WalletFunding";
import { WalletRuntime } from "./WalletRuntime";
import { WalletUnavailable } from "./WalletUnavailable";

/** A wallet SDK failure degrades to a notice; it never takes the page down. */
class WalletBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("wallet setup failed:", error instanceof Error ? error.message : error);
  }

  render() {
    return this.state.failed ? <WalletUnavailable reason="the wallet provider failed to load" /> : this.props.children;
  }
}

export default function WalletInteractive({
  config,
  wallet,
  onBound,
}: {
  config: WalletRuntimeConfig;
  wallet: BoundWallet | null;
  onBound: (state: WalletState) => void;
}) {
  return (
    <WalletBoundary>
      <WalletRuntime config={config}>
        {wallet ? <WalletFunding wallet={wallet} /> : <WalletBinder onBound={onBound} />}
      </WalletRuntime>
    </WalletBoundary>
  );
}
