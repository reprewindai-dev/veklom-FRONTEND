import { WALLET_UNAVAILABLE } from "@/lib/wallet/runtime-config";

/** Graceful degradation: the wallet step never crashes the page. */
export function WalletUnavailable({ reason }: { reason?: string }) {
  return (
    <div role="status" data-testid="wallet-unavailable" className="rounded-xl border border-cos-warn/40 bg-cos-warn/[0.08] px-4 py-3 text-sm text-cos-warn">
      {WALLET_UNAVAILABLE[0].toUpperCase() + WALLET_UNAVAILABLE.slice(1)}{reason ? `: ${reason}` : ""}. You can keep exploring; nothing else is blocked.
    </div>
  );
}
