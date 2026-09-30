"use client";

// Capability OS onboarding checklist:
//   Identity / Wallet / Capability / Connect runtime / First governed execution
// State comes from LockerPhycer (/api/v1/wallet/onboarding: wallet binding plus
// activation events). Unknown state renders as not-done, never as done.

import { useEffect, useState } from "react";
import { Check, Circle } from "lucide-react";
import { walletApi, type OnboardingState } from "@/lib/wallet/api";

export type ChecklistItem = { id: string; label: string; done: boolean; hint?: string; optional?: boolean };

export function checklistItems(state: Partial<OnboardingState> | null, identityKnown = false): ChecklistItem[] {
  return [
    { id: "identity", label: "Identity", done: Boolean(state?.identity) || identityKnown },
    {
      id: "wallet",
      label: "Wallet",
      done: Boolean(state?.wallet),
      hint: "Needed before paid or externally settled actions",
      optional: true,
    },
    { id: "capability", label: "Capability", done: Boolean(state?.capability) },
    { id: "runtime", label: "Connect runtime", done: Boolean(state?.runtime) },
    { id: "first_execution", label: "First governed execution", done: Boolean(state?.first_execution) },
  ];
}

export function OnboardingChecklist({
  identityKnown = false,
  refreshKey = 0,
  className = "",
}: {
  identityKnown?: boolean;
  refreshKey?: number;
  className?: string;
}) {
  const [state, setState] = useState<OnboardingState | null>(null);

  useEffect(() => {
    let active = true;
    walletApi.onboarding().then((value) => active && setState(value)).catch(() => active && setState(null));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  const items = checklistItems(state, identityKnown);
  const done = items.filter((item) => item.done).length;
  return (
    <div className={`rounded-2xl border border-cos-border bg-cos-surface2/70 p-4 ${className}`} data-testid="onboarding-checklist">
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-cos-accent">
        <span>Checklist</span>
        <span className="text-cos-steel">{done}/{items.length}</span>
      </div>
      <ol className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-xs">
            {item.done ? <Check size={14} className="mt-0.5 shrink-0 text-cos-accent" /> : <Circle size={14} className="mt-0.5 shrink-0 text-cos-steel" />}
            <span className={item.done ? "text-cos-text" : "text-cos-muted"}>
              {item.label}
              {!item.done && item.hint ? <span className="block text-[10px] text-cos-steel">{item.hint}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
