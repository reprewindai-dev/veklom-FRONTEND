"use client";

// Funding, in dollars. Three rails, kept visibly separate:
//   1. Fund the wallet (machine funding + settlement): Coinbase Onramp by card or
//      bank (CDP FundModal), or a deposit from any wallet/exchange on Base.
//   2. Wallet -> Veklom credits: a token transfer on Base, verified server-side
//      from the transaction receipt (LockerPhycer /api/v1/wallet/topups/onchain).
//   3. Company billing (Stripe): how a company pays Veklom. Not wallet funding.

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Copy, CreditCard, Droplets, Send } from "lucide-react";
import { encodeFunctionData, erc20Abi } from "viem";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { FundModal, type FetchBuyOptions, type FetchBuyQuote } from "@coinbase/cdp-react";
import { useSendEvmTransaction } from "@coinbase/cdp-hooks";
import { Button, ErrorBox, SuccessBox } from "@/components/ui";
import { ApiError, getToken } from "@/lib/api";
import { walletApi, type BoundWallet, type WalletServerConfig } from "@/lib/wallet/api";
import {
  FUNDING_AMOUNTS_USD,
  shortAddress,
  stripeTopupKind,
  usdcUnits,
  type FundingAmountUsd,
} from "@/lib/wallet/network";
import { useWalletRuntime } from "./WalletRuntime";

const US_STATES = "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" ");

function errorText(cause: unknown): string {
  if (cause instanceof ApiError) return cause.message;
  if (cause instanceof Error) return cause.message.split("\n")[0];
  return "Request failed";
}

async function onrampFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(path, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error((body as { error?: string }).error || "Coinbase Onramp request failed");
  return body;
}

const fetchBuyOptions: FetchBuyOptions = async (params) => {
  const query = new URLSearchParams({ country: params.country });
  if (params.subdivision) query.set("subdivision", params.subdivision);
  return onrampFetch(`/api/onramp/buy-options?${query}`, { method: "GET" });
};

const fetchBuyQuote: FetchBuyQuote = async (request) =>
  onrampFetch("/api/onramp/buy-quote", { method: "POST", body: JSON.stringify(request) });

function OnrampFund({ wallet, amount }: { wallet: BoundWallet; amount: FundingAmountUsd }) {
  const { config } = useWalletRuntime();
  const [country, setCountry] = useState(config.country ?? "US");
  const [subdivision, setSubdivision] = useState("CA");
  const [assets, setAssets] = useState<string[]>([]);
  const [asset, setAsset] = useState("usdc");
  const [done, setDone] = useState(false);

  // Offer every asset Onramp can deliver on Base for this location (not a fixed list).
  useEffect(() => {
    let active = true;
    fetchBuyOptions({ country, subdivision: country === "US" ? subdivision : undefined } as Parameters<FetchBuyOptions>[0])
      .then((options) => {
        if (!active) return;
        const onBase = options.purchaseCurrencies
          .filter((c) => c.networks.some((n) => n.name === "base"))
          .map((c) => c.symbol.toLowerCase());
        setAssets(onBase);
        if (onBase.length && !onBase.includes(asset)) setAsset(onBase.includes("usdc") ? "usdc" : onBase[0]);
      })
      .catch(() => active && setAssets([]));
    return () => {
      active = false;
    };
  }, [country, subdivision]); // eslint-disable-line react-hooks/exhaustive-deps

  const presets = useMemo(() => [...FUNDING_AMOUNTS_USD] as [number, number, number], []);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs text-cos-muted">Country
          <input className="mt-1 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text" maxLength={2}
            value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} />
        </label>
        {country === "US" ? (
          <label className="block text-xs text-cos-muted">State
            <select className="mt-1 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text" value={subdivision} onChange={(e) => setSubdivision(e.target.value)}>
              {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        ) : null}
        <label className="block text-xs text-cos-muted">Receive
          <select className="mt-1 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text" value={asset} onChange={(e) => setAsset(e.target.value)}>
            {(assets.length ? assets : ["usdc"]).map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}
          </select>
        </label>
      </div>
      <FundModal
        key={`${country}-${subdivision}-${asset}-${amount}`}
        country={country}
        subdivision={country === "US" ? subdivision : undefined}
        cryptoCurrency={asset}
        fiatCurrency="usd"
        network="base"
        presetAmountInputs={presets}
        destinationAddress={wallet.address}
        fetchBuyOptions={fetchBuyOptions}
        fetchBuyQuote={fetchBuyQuote}
        onSuccess={() => setDone(true)}
      />
      {done ? <SuccessBox message="Purchase submitted. Funds arrive in your wallet on Base once Coinbase completes the transfer." /> : null}
    </div>
  );
}

function useTopupVerifier() {
  const [status, setStatus] = useState<"idle" | "verifying" | "credited" | "error">("idle");
  const [detail, setDetail] = useState<string | null>(null);

  const verify = useCallback(async (txHash: string) => {
    setStatus("verifying");
    setDetail("Waiting for confirmations on Base…");
    for (let attempt = 0; attempt < 30; attempt += 1) {
      try {
        const result = await walletApi.onchainTopup(txHash);
        setStatus("credited");
        setDetail(result.replay ? "This transaction was already credited." : `${result.credits.toLocaleString()} credits added ($${result.usd}).`);
        return;
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 409 && /confirm|not found/i.test(cause.message)) {
          await new Promise((resolve) => setTimeout(resolve, 4000));
          continue;
        }
        setStatus("error");
        setDetail(errorText(cause));
        return;
      }
    }
    setStatus("error");
    setDetail("Still waiting for Base. Paste the transaction hash below to retry.");
  }, []);

  return { status, detail, verify };
}

function EmbeddedSend({ wallet, to, data, onSent }: { wallet: BoundWallet; to: `0x${string}`; data: `0x${string}`; onSent: (hash: string) => void }) {
  const { network } = useWalletRuntime();
  const { sendEvmTransaction } = useSendEvmTransaction();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Button loading={busy} onClick={async () => {
        setBusy(true);
        setError(null);
        try {
          const { transactionHash } = await sendEvmTransaction({
            evmAccount: wallet.address,
            network: network.key,
            transaction: { to, data, value: BigInt(0), chainId: network.chainId, type: "eip1559" },
          });
          onSent(transactionHash);
        } catch (cause) {
          setError(errorText(cause));
        } finally {
          setBusy(false);
        }
      }}><Send size={15} /> Send from my Veklom wallet</Button>
      {error ? <ErrorBox message={error} /> : null}
    </div>
  );
}

function ExternalSend({ wallet, token, amountUnits, treasury, onSent }: {
  wallet: BoundWallet; token: `0x${string}`; amountUnits: bigint; treasury: `0x${string}`; onSent: (hash: string) => void;
}) {
  const { network } = useWalletRuntime();
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  const [error, setError] = useState<string | null>(null);
  const sameWallet = isConnected && address?.toLowerCase() === wallet.address.toLowerCase();
  if (!sameWallet) {
    return <p className="text-xs text-cos-muted">Connect {shortAddress(wallet.address)} above to send from it, or send from that wallet directly and paste the transaction hash below.</p>;
  }
  return (
    <div className="space-y-2">
      <Button loading={isPending} onClick={async () => {
        setError(null);
        try {
          if (chainId !== network.chainId) await switchChainAsync({ chainId: network.chainId });
          const hash = await writeContractAsync({
            address: token, abi: erc20Abi, functionName: "transfer", args: [treasury, amountUnits], chainId: network.chainId,
          });
          onSent(hash);
        } catch (cause) {
          setError(errorText(cause));
        }
      }}><Send size={15} /> Send from {shortAddress(wallet.address)}</Button>
      {error ? <ErrorBox message={error} /> : null}
    </div>
  );
}

function OnchainTopup({ wallet, server, amount }: { wallet: BoundWallet; server: WalletServerConfig; amount: FundingAmountUsd }) {
  const { cdpEnabled, network } = useWalletRuntime();
  const { status, detail, verify } = useTopupVerifier();
  const [manualHash, setManualHash] = useState("");
  const usdc = server.credit_tokens.find((t) => t.symbol === "USDC") ?? server.credit_tokens[0];
  if (!server.onchain_topup_enabled || !server.treasury_address || !usdc) {
    return <p className="text-xs text-cos-muted">Onchain top-ups are not enabled on this deployment yet.</p>;
  }
  const units = usdcUnits(amount) * BigInt(10 ** usdc.decimals) / BigInt(1_000_000);
  const data = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [server.treasury_address, units] });
  return (
    <div className="space-y-3">
      <p className="text-xs leading-6 text-cos-muted">
        Send ${amount} in {usdc.symbol} on {network.name} to Veklom ({shortAddress(server.treasury_address)}). Credits are added after {server.min_confirmations} confirmations; the transaction is checked on Base, not in the browser.
      </p>
      {wallet.wallet_provider === "cdp_embedded" && cdpEnabled ? (
        <EmbeddedSend wallet={wallet} to={usdc.address} data={data} onSent={(hash) => void verify(hash)} />
      ) : (
        <ExternalSend wallet={wallet} token={usdc.address} amountUnits={units} treasury={server.treasury_address} onSent={(hash) => void verify(hash)} />
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="block min-w-[260px] flex-1 text-xs text-cos-muted">Already sent? Transaction hash
          <input className="mt-1 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-xs text-cos-text" placeholder="0x…" value={manualHash} onChange={(e) => setManualHash(e.target.value.trim())} />
        </label>
        <Button variant="outline" disabled={!/^0x[0-9a-fA-F]{64}$/.test(manualHash)} onClick={() => void verify(manualHash)}>Verify</Button>
      </div>
      {status === "verifying" && detail ? <p className="text-xs text-cos-muted">{detail}</p> : null}
      {status === "credited" && detail ? <SuccessBox message={detail} /> : null}
      {status === "error" && detail ? <ErrorBox message={detail} /> : null}
    </div>
  );
}

function StripeTopup({ amount }: { amount: FundingAmountUsd }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <Button variant="outline" loading={busy} onClick={async () => {
        setBusy(true);
        setError(null);
        try {
          const session = await walletApi.stripeTopupCheckout(stripeTopupKind(amount));
          if (session.url) window.location.assign(session.url);
        } catch (cause) {
          setError(cause instanceof ApiError && cause.status === 503 ? "Card billing is not configured on this deployment yet." : errorText(cause));
        } finally {
          setBusy(false);
        }
      }}><CreditCard size={15} /> Buy ${amount} of credits with Stripe</Button>
      {error ? <ErrorBox message={error} /> : null}
    </div>
  );
}

export function WalletFunding({ wallet }: { wallet: BoundWallet }) {
  const { config, cdpEnabled, network } = useWalletRuntime();
  const [amount, setAmount] = useState<FundingAmountUsd>(100);
  const [server, setServer] = useState<WalletServerConfig | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    walletApi.config().then(setServer).catch(() => setServer(null));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Add funds</div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Amount">
          {FUNDING_AMOUNTS_USD.map((value) => (
            <button key={value} type="button" role="radio" aria-checked={amount === value} onClick={() => setAmount(value)}
              className={`rounded-lg border px-4 py-2 text-sm ${amount === value ? "border-cos-accent bg-cos-accent/10 text-cos-text" : "border-cos-border text-cos-muted hover:border-cos-accent"}`}>
              Add ${value}
            </button>
          ))}
        </div>
      </div>

      <section className="space-y-3 rounded-xl border border-cos-border bg-cos-bg/40 p-4">
        <div className="flex items-center gap-2 text-sm text-cos-text"><CreditCard size={15} className="text-cos-accent" /> Card or bank, into your wallet</div>
        {config.onrampEnabled && cdpEnabled ? (
          <OnrampFund wallet={wallet} amount={amount} />
        ) : network.testnet ? (
          <p className="text-xs leading-6 text-cos-muted">
            Coinbase Onramp buys real assets on Base mainnet, so it is off on {network.name}. For testing, get test USDC from the{" "}
            <a className="text-cos-accent hover:underline" href="https://docs.cdp.coinbase.com/faucets/introduction/quickstart" target="_blank" rel="noreferrer">CDP faucet</a>.
          </p>
        ) : (
          <p className="text-xs text-cos-muted">Card funding: {`wallet setup unavailable`} (Coinbase Onramp is not configured).</p>
        )}
      </section>

      <section className="space-y-3 rounded-xl border border-cos-border bg-cos-bg/40 p-4">
        <div className="flex items-center gap-2 text-sm text-cos-text"><Droplets size={15} className="text-cos-accent" /> From another wallet or an exchange</div>
        <p className="text-xs leading-6 text-cos-muted">Send USDC, ETH or any token on {network.name} to your wallet address. Only send on {network.name}.</p>
        <div className="flex items-center gap-2">
          <code className="break-all rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-xs text-cos-text">{wallet.address}</code>
          <button type="button" aria-label="Copy wallet address" className="rounded-lg border border-cos-border p-2 text-cos-muted hover:border-cos-accent"
            onClick={() => { void navigator.clipboard?.writeText(wallet.address); setCopied(true); }}>
            <Copy size={14} />
          </button>
          {copied ? <span className="text-xs text-cos-accent">Copied</span> : null}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-cos-border bg-cos-bg/40 p-4">
        <div className="flex items-center gap-2 text-sm text-cos-text"><ArrowRight size={15} className="text-cos-accent" /> Wallet to Veklom credits (onchain)</div>
        {server ? <OnchainTopup wallet={wallet} server={server} amount={amount} /> : <p className="text-xs text-cos-muted">Loading onchain settlement details…</p>}
      </section>

      <section className="space-y-3 rounded-xl border border-dashed border-cos-border p-4">
        <div className="flex items-center gap-2 text-sm text-cos-text"><Building2 size={15} className="text-cos-steel" /> Company billing (Stripe)</div>
        <p className="text-xs leading-6 text-cos-muted">How your company pays Veklom. Credits land on the workspace; this does not fund the wallet.</p>
        <StripeTopup amount={amount} />
      </section>
    </div>
  );
}
