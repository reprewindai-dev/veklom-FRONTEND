"use client";

import Shell from "@/components/Shell";
import TierGate from "@/components/TierGate";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { useState } from "react";

export default function StripeConnectPage() {
  const status = useApi<any>("/api/v1/stripe/connect/status");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function onboard() {
    setBusy(true);
    setError(undefined);
    try {
      const res = await api<any>("/api/v1/stripe/connect/onboard");
      const url = res?.url || res?.onboarding_url;
      if (!url) {
        setError("Stripe onboarding did not return an account-link URL.");
        return;
      }
      window.location.href = url;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const connected = !!(status.data?.connected || status.data?.charges_enabled);

  return (
    <Shell>
      <TierGate required="starter" feature="Stripe Connect">
        <PageHeader title="Stripe Connect" subtitle="Onboarding and current account status for vendor payouts." />
        <Card className="text-center py-10">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${connected ? "bg-accent-green/20 text-accent-green" : "bg-bg-700 text-ink-400"}`}>
            {connected ? "✓" : "?"}
          </div>
          <div className="text-xl font-semibold mb-1">{connected ? "Connected" : "Not connected"}</div>
          <div className="text-ink-400 text-sm mb-4">{status.data?.charges_enabled ? "Charges enabled" : "Pending onboarding"}</div>
          {!connected && <Button onClick={onboard} loading={busy}>Start onboarding</Button>}
          {error && <div className="mt-4 rounded-xl border border-accent-red/40 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">{error}</div>}
          <pre className="text-xs bg-bg-900 p-3 rounded-md overflow-x-auto mt-6 text-left">{JSON.stringify(status.data, null, 2)}</pre>
        </Card>
      </TierGate>
    </Shell>
  );
}
