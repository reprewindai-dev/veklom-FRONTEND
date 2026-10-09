"use client";

// Onboarding "Wallet" step: Account -> Welcome -> Wallet -> Fund -> Capability ->
// Connect -> Execute -> Evidence. Never blocks exploring or the Welcome period;
// a wallet is required only before paid or externally settled actions.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Wallet } from "lucide-react";
import { ApiError } from "@/lib/api";
import { walletApi, type WalletState } from "@/lib/wallet/api";
import { shortAddress } from "@/lib/wallet/network";
import type { WalletRuntimeConfig } from "@/lib/wallet/runtime-config";
import { WalletUnavailable } from "./WalletUnavailable";

export const WALLET_COPY = {
  title: "Your Veklom Wallet",
  body: "pays for governed actions. It funds them; it never authorizes them. Authority is a separate single-use grant per action.",
  explore: "You can keep exploring without funding it. Funding is required before paid or externally settled actions.",
} as const;

const WalletInteractive = dynamic(() => import("./WalletInteractive"), {
  ssr: false,
  loading: () => <p className="text-xs text-cos-muted">Loading wallet options…</p>,
});

export function WalletStep({ onWalletChange }: { onWalletChange?: (state: WalletState | null) => void }) {
  const [runtime, setRuntime] = useState<WalletRuntimeConfig | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [state, setState] = useState<WalletState | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/wallet/config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((value: WalletRuntimeConfig) => active && setRuntime(value))
      .catch(() => active && setRuntimeError("configuration could not be loaded"));
    walletApi.state()
      .then((value) => {
        if (!active) return;
        setState(value);
        onWalletChange?.(value);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setStateError(cause instanceof ApiError && cause.status === 404
          ? "wallet service is not reachable on this deployment"
          : cause instanceof Error ? cause.message : "wallet service error");
      });
    return () => {
      active = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBound = useCallback((next: WalletState) => {
    setState(next);
    onWalletChange?.(next);
  }, [onWalletChange]);

  const wallet = state?.wallet ?? null;
  return (
    <div className="space-y-5" data-testid="wallet-step">
      <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-5">
        <div className="mb-2 flex items-center gap-2 text-sm text-cos-text">
          <Wallet size={16} className="text-cos-accent" />
          <span><strong className="font-medium">{WALLET_COPY.title}</strong> — {WALLET_COPY.body}</span>
        </div>
        <p className="text-xs leading-6 text-cos-muted">{WALLET_COPY.explore}</p>
        {state ? (
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">
            Network: {state.name}{state.testnet ? " (testnet)" : ""}
          </p>
        ) : null}
      </div>

      {wallet ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-cos-accent/30 bg-cos-accent/5 p-4 text-sm text-cos-text">
          <CheckCircle2 size={16} className="text-cos-accent" />
          Wallet bound: <span className="font-mono">{shortAddress(wallet.address)}</span>
          <span className="text-xs text-cos-muted">({wallet.source === "created" ? "created" : "connected"}, verified {new Date(wallet.verified_at).toLocaleDateString()})</span>
        </div>
      ) : null}

      {runtimeError || stateError ? (
        <WalletUnavailable reason={runtimeError ?? stateError ?? undefined} />
      ) : runtime && state ? (
        <WalletInteractive config={runtime} wallet={wallet} onBound={handleBound} />
      ) : (
        <p className="text-xs text-cos-muted">Checking your workspace wallet…</p>
      )}
    </div>
  );
}
