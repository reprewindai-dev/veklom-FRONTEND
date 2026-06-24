"use client";

import Shell from "@/components/Shell";
import { useApi } from "@/hooks/useApi";
import { Card, PageHeader, Button, Skeleton, ErrorBox } from "@/components/ui";
import { unwrapList } from "@/types/api";
import { useAuth } from "@/lib/auth-context";
import { TIER_LABEL, normalizeTier } from "@/lib/tiers";
import { useState } from "react";

export default function SubscriptionsPage() {
  const plans = useApi<any>("/api/v1/subscriptions/plans");
  const { tier } = useAuth();
  const [busy, setBusy] = useState<string | undefined>();
  const [err, setErr] = useState<string | undefined>();
  const [showWallet, setShowWallet] = useState<boolean>(false);

  // Handle loading and error states properly
  if (plans.error) {
    return (
      <Shell>
        <PageHeader title="Machine API Pricing" subtitle="x402 Protocol on Base Mainnet" />
        <div className="mb-4">
          <ErrorBox message={`Failed to load API plans: ${plans.error.message}`} />
        </div>
      </Shell>
    );
  }

  async function checkout(planId: string) {
    setBusy(planId); setErr(undefined);
    try {
      // Instead of Stripe checkout, simulate opening an x402 Machine Payment connection
      setShowWallet(true);
    } catch (e) { 
      setErr((e as Error).message); 
    } finally { 
      setBusy(undefined); 
    }
  }

  return (
    <Shell>
      <PageHeader
        title="Machine API Pricing"
        subtitle={`Connect your agent wallet to provision x402 endpoint access on Base Mainnet.`}
        actions={<div className="flex items-center gap-2 text-xs text-brand-500 font-mono bg-brand-500/10 px-3 py-1.5 rounded-full"><span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span> Base Mainnet</div>}
      />
      {err && <div className="mb-4"><ErrorBox message={err} /></div>}
      
      {showWallet && (
        <Card className="mb-8 border-brand-500 bg-brand-500/5">
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 flex items-center justify-center animate-bounce">
              <span className="text-brand-500 font-mono text-xl">x</span>
            </div>
            <h3 className="text-xl font-medium">Waiting for Facilitator Connection...</h3>
            <p className="text-ink-300 text-sm max-w-md text-center">
              Please connect your x402 wallet or automated agent facilitator to the Base Mainnet. Payments will be routed in USDC.
            </p>
            <Button variant="outline" onClick={() => setShowWallet(false)}>Cancel Connection</Button>
          </div>
        </Card>
      )}

      {plans.isLoading ? <Skeleton className="h-64 w-full" /> :
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unwrapList<any>(plans.data).map((p) => {
            const t = normalizeTier(p.tier || p.id || p.name);
            const isCurrent = t === tier;
            
            let priceLabelText = p.price_label || (p.price ? `$${p.price} USDC` : "—");
            let buttonText = "Authorize x402 Facilitator";

            return (
              <Card key={p.id || p.name} className={isCurrent ? "border-brand-500 ring-1 ring-brand-500/50" : ""}>
                <div className="text-[11px] uppercase tracking-widest text-brand-400 font-mono">{TIER_LABEL[t] || p.name}</div>
                <div className="text-2xl font-semibold mt-2 font-mono">{priceLabelText}</div>
                <div className="text-xs text-ink-400 mt-1">{p.period || "per execution"}</div>
                <ul className="mt-6 space-y-2 text-sm text-ink-200">
                  {(p.features || p.bullets || []).map((f: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-brand-500 mr-2 mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button className="w-full font-mono text-xs" onClick={() => checkout(p.id || p.plan_id)} disabled={busy === (p.id || p.plan_id)}>
                    {busy === (p.id || p.plan_id) ? "Connecting…" : buttonText}
                  </Button>
                </div>
              </Card>
            );
          })}
          {unwrapList(plans.data).length === 0 && <Card className="col-span-full text-center py-10 text-ink-400">No plans available.</Card>}
        </div>
      }
    </Shell>
  );
}
