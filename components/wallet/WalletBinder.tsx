"use client";

// Create or connect a wallet, then prove ownership with one EIP-4361 signature
// and bind it to the workspace (LockerPhycer /api/v1/wallet/register).

import { useCallback, useEffect, useState } from "react";
import { Fingerprint, KeyRound, Mail, Plug, ShieldCheck } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useSignMessage } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { AuthButton } from "@coinbase/cdp-react";
import { useEvmAddress, useIsSignedIn, useSignEvmMessage } from "@coinbase/cdp-hooks";
import { Button, ErrorBox } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { walletApi, type WalletProvider, type WalletSource, type WalletState } from "@/lib/wallet/api";
import { shortAddress } from "@/lib/wallet/network";
import { buildWalletBindingMessage } from "@/lib/wallet/siwe";
import { WALLET_UNAVAILABLE } from "@/lib/wallet/runtime-config";
import { useWalletRuntime } from "./WalletRuntime";

type Candidate = {
  address: `0x${string}`;
  provider: WalletProvider;
  source: WalletSource;
  sign: (message: string) => Promise<string>;
};

function providerForConnector(id: string | undefined): WalletProvider {
  const value = (id || "").toLowerCase();
  if (value.includes("baseaccount")) return "base_account";
  if (value.includes("coinbase")) return "coinbase_wallet";
  if (value.includes("walletconnect")) return "walletconnect";
  if (value.includes("injected") || value.includes("metamask") || value.includes("io.")) return "injected";
  return "other";
}

function message(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message.split("\n")[0];
  return "Wallet request failed";
}

function useBind(onBound: (state: WalletState) => void) {
  const { network } = useWalletRuntime();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bind = useCallback(async (candidate: Candidate) => {
    setBusy(true);
    setError(null);
    try {
      const { nonce } = await walletApi.nonce();
      const text = buildWalletBindingMessage({
        address: candidate.address,
        chainId: network.chainId,
        nonce,
        domain: window.location.host,
        uri: window.location.origin,
      });
      const signature = await candidate.sign(text);
      const state = await walletApi.register({
        message: text,
        signature,
        source: candidate.source,
        wallet_provider: candidate.provider,
      });
      onBound(state);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }, [network.chainId, onBound]);

  return { bind, busy, error };
}

function BindPrompt({ candidate, onBound }: { candidate: Candidate; onBound: (s: WalletState) => void }) {
  const { bind, busy, error } = useBind(onBound);
  return (
    <div className="space-y-3 rounded-xl border border-cos-accent/30 bg-cos-accent/5 p-4">
      <div className="text-sm text-cos-text">
        {candidate.source === "created" ? "Wallet created" : "Wallet connected"}: <span className="font-mono">{shortAddress(candidate.address)}</span>
      </div>
      <p className="text-xs leading-6 text-cos-muted">
        One signature proves you control this address and binds it to your workspace. It is not a transaction and costs nothing.
      </p>
      {error ? <ErrorBox message={error} /> : null}
      <Button onClick={() => void bind(candidate)} loading={busy}>
        <ShieldCheck size={15} /> Verify and bind wallet
      </Button>
    </div>
  );
}

/** Email sign-in creates a CDP embedded wallet (no seed phrase, no extension). */
function EmbeddedCreate({ onBound }: { onBound: (s: WalletState) => void }) {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const { signEvmMessage } = useSignEvmMessage();
  if (isSignedIn && evmAddress) {
    const candidate: Candidate = {
      address: evmAddress as `0x${string}`,
      provider: "cdp_embedded",
      source: "created",
      sign: async (text) => (await signEvmMessage({ evmAccount: evmAddress, message: text })).signature,
    };
    return <BindPrompt candidate={candidate} onBound={onBound} />;
  }
  return (
    <div className="space-y-2">
      <AuthButton />
      <p className="text-xs text-cos-muted">Sign in with your email to create a wallet. A one-time code is sent to you.</p>
    </div>
  );
}

function ConnectedCandidate({ source, onBound }: { source: WalletSource; onBound: (s: WalletState) => void }) {
  const { address, connector, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  if (!isConnected || !address) return null;
  const candidate: Candidate = {
    address,
    provider: providerForConnector(connector?.id),
    source,
    sign: (text) => signMessageAsync({ message: text }),
  };
  return <BindPrompt candidate={candidate} onBound={onBound} />;
}

function PasskeyCreate({ onBound }: { onBound: (s: WalletState) => void }) {
  const { connectors, connectAsync, isPending } = useConnect();
  const { isConnected, connector: active } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const baseAccount = connectors.find((c) => c.id === "baseAccount" || c.name.toLowerCase().includes("base account"));
  if (isConnected && providerForConnector(active?.id) === "base_account") {
    return <ConnectedCandidate source="created" onBound={onBound} />;
  }
  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        disabled={!baseAccount}
        loading={isPending}
        onClick={() => {
          if (!baseAccount) return;
          setError(null);
          connectAsync({ connector: baseAccount }).catch((cause) => setError(message(cause)));
        }}
      >
        <Fingerprint size={15} /> Create with a passkey (Base Account)
      </Button>
      {!baseAccount ? <p className="text-xs text-cos-muted">Passkey wallets are available through the wallet modal.</p> : null}
      {error ? <ErrorBox message={error} /> : null}
    </div>
  );
}

function AppKitConnect() {
  const { open } = useAppKit();
  return (
    <Button onClick={() => void open({ view: "Connect" })}>
      <Plug size={15} /> Choose a wallet
    </Button>
  );
}

function ConnectorList() {
  const { connectors, connectAsync, isPending } = useConnect();
  const [error, setError] = useState<string | null>(null);
  const usable = connectors.filter((c, i, all) => all.findIndex((x) => x.name === c.name) === i);
  if (!usable.length) return <ErrorBox message={WALLET_UNAVAILABLE} />;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {usable.map((connector) => (
          <Button key={connector.uid} variant="outline" loading={isPending} onClick={() => {
            setError(null);
            connectAsync({ connector }).catch((cause) => setError(message(cause)));
          }}>
            <KeyRound size={15} /> {connector.name}
          </Button>
        ))}
      </div>
      {error ? <ErrorBox message={error} /> : null}
    </div>
  );
}

export function WalletBinder({ onBound }: { onBound: (state: WalletState) => void }) {
  const { cdpEnabled, appKitEnabled } = useWalletRuntime();
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [mode, setMode] = useState<"create" | "connect" | null>(null);

  // A wallet connected in an earlier session is offered for binding directly.
  useEffect(() => {
    if (isConnected && mode === null) setMode("connect");
  }, [isConnected, mode]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Button variant={mode === "create" ? "primary" : "outline"} onClick={() => setMode("create")}>Create wallet</Button>
        <Button variant={mode === "connect" ? "primary" : "outline"} onClick={() => setMode("connect")}>Connect existing wallet</Button>
      </div>

      {mode === "create" ? (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel"><Mail size={13} /> Email</div>
            {cdpEnabled ? <EmbeddedCreate onBound={onBound} /> : <p className="text-xs text-cos-muted">Email wallets: {WALLET_UNAVAILABLE} (CDP project id not configured).</p>}
          </div>
          <div className="rounded-xl border border-cos-border bg-cos-bg/40 p-4">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel"><Fingerprint size={13} /> Passkey</div>
            <PasskeyCreate onBound={onBound} />
          </div>
        </div>
      ) : null}

      {mode === "connect" ? (
        <div className="space-y-3 rounded-xl border border-cos-border bg-cos-bg/40 p-4">
          <p className="text-xs leading-6 text-cos-muted">
            Any wallet that works on Base: Coinbase Wallet and Base Account, browser wallets, and mobile wallets over WalletConnect.
          </p>
          {isConnected ? (
            <>
              <ConnectedCandidate source="connected" onBound={onBound} />
              <button type="button" className="text-xs text-cos-muted underline" onClick={() => disconnect()}>Use a different wallet</button>
            </>
          ) : appKitEnabled ? <AppKitConnect /> : <ConnectorList />}
        </div>
      ) : null}
    </div>
  );
}
