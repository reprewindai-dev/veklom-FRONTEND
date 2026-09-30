import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  FUNDING_AMOUNTS_USD,
  resolveWalletNetwork,
  shortAddress,
  stripeTopupKind,
  usdcUnits,
} from "@/lib/wallet/network";
import { walletRuntimeConfigFromEnv, WALLET_UNAVAILABLE } from "@/lib/wallet/runtime-config";
import { isOperatorLockerPath } from "@/lib/wallet/proxy-paths";
import { checklistItems } from "@/components/cos/OnboardingChecklist";
import { WalletUnavailable } from "@/components/wallet/WalletUnavailable";

function render(element: ReactElement): string {
  const container = document.createElement("div");
  const root = createRoot(container);
  flushSync(() => root.render(element));
  const html = container.textContent ?? "";
  flushSync(() => root.unmount());
  return html;
}

describe("wallet network", () => {
  it("defaults to Base Sepolia and flips to Base mainnet only when asked", () => {
    expect(resolveWalletNetwork(undefined)).toMatchObject({ chainId: 84532, testnet: true });
    expect(resolveWalletNetwork("anything")).toMatchObject({ chainId: 84532 });
    expect(resolveWalletNetwork("base")).toMatchObject({ chainId: 8453, testnet: false });
  });

  it("thinks in dollars: $50/$100/$500 map to USDC units and Stripe top-up kinds", () => {
    expect(FUNDING_AMOUNTS_USD).toEqual([50, 100, 500]);
    expect(usdcUnits(50)).toBe(BigInt(50_000_000));
    expect(stripeTopupKind(500)).toBe("topup_500");
    expect(() => usdcUnits(0)).toThrow();
    expect(shortAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678");
  });
});

describe("wallet runtime config", () => {
  it("degrades without keys", () => {
    const config = walletRuntimeConfigFromEnv({});
    expect(config).toMatchObject({ cdpProjectId: null, reownProjectId: null, network: "base-sepolia", onrampEnabled: false });
  });

  it("reads runtime names first and keeps Onramp off on testnet", () => {
    const env = { CDP_PROJECT_ID: "p-1", NEXT_PUBLIC_REOWN_PROJECT_ID: "r-1", CDP_API_KEY_ID: "id", CDP_API_KEY_SECRET: "s" };
    expect(walletRuntimeConfigFromEnv(env)).toMatchObject({ cdpProjectId: "p-1", reownProjectId: "r-1", onrampEnabled: false });
    expect(walletRuntimeConfigFromEnv({ ...env, WALLET_NETWORK: "base" }).onrampEnabled).toBe(true);
    expect(walletRuntimeConfigFromEnv({ ...env, WALLET_NETWORK: "base", ONRAMP_ENABLED: "false" }).onrampEnabled).toBe(false);
    expect(walletRuntimeConfigFromEnv({}, "DE").country).toBe("DE");
    expect(walletRuntimeConfigFromEnv({}, "XX-bad").country).toBeNull();
  });
});

describe("wallet proxy routes", () => {
  it("routes only the operator-scoped LockerPhycer paths", () => {
    expect(isOperatorLockerPath("/api/v1/wallet")).toBe(true);
    expect(isOperatorLockerPath("/api/v1/wallet/register")).toBe(true);
    expect(isOperatorLockerPath("/api/v1/entitlements/usage")).toBe(true);
    expect(isOperatorLockerPath("/api/v1/billing/checkout")).toBe(true);
    expect(isOperatorLockerPath("/api/v1/billing/wallet/ws-1/fund")).toBe(false);
    expect(isOperatorLockerPath("/api/v1/walletx")).toBe(false);
  });
});

describe("onboarding checklist and degradation", () => {
  it("lists the five locked milestones in order and never assumes progress", () => {
    const items = checklistItems(null);
    expect(items.map((i) => i.label)).toEqual(["Identity", "Wallet", "Capability", "Connect runtime", "First governed execution"]);
    expect(items.every((i) => !i.done)).toBe(true);
    expect(checklistItems(null, true)[0].done).toBe(true);
    expect(checklistItems({ wallet: true, runtime: true }).filter((i) => i.done).map((i) => i.id)).toEqual(["wallet", "runtime"]);
  });

  it("shows 'wallet setup unavailable' instead of crashing", () => {
    expect(WALLET_UNAVAILABLE).toBe("wallet setup unavailable");
    expect(render(<WalletUnavailable reason="configuration could not be loaded" />)).toContain("Wallet setup unavailable");
  });
});
