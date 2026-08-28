import React from "react";
import Link from "next/link";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { ProofChip, CapabilityLifecycle, PrimaryButton, SecondaryButton } from "@/components/ui/SharedUI";

export default function LandingPage() {
  return (
    <HumanAppShell>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 w-full">
        
        {/* Proof Strip */}
        <div className="flex items-center flex-wrap gap-3 mb-16 pb-6 border-b border-theme-border w-full">
          <ProofChip label="P5/C0 CLOSED" state="verified" />
          <ProofChip label="veklom-p5-closure-v1" state="unknown" />
          <ProofChip label="75/75 ADVERSARIAL" state="warn" />
          <ProofChip label="TLC SAFETY" state="info" />
          <ProofChip label="CORRESPONDENCE" state="info" />
          <ProofChip label="LIVENESS NOT CLAIMED" state="unknown" />
          <ProofChip label="G1 DEFERRED" state="unknown" />
        </div>

        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-sans font-semibold tracking-tight leading-tight mb-8 text-theme-ink">
            Capability OS for <br />Governed Machine Action
          </h1>
          
          <p className="text-lg md:text-xl text-theme-inkDim leading-relaxed mb-8">
            Machines are starting to act: spending money, calling APIs,
            changing data, triggering workflows, and making decisions across real systems.
            Veklom gives those machines capabilities &mdash; not blank-check authority.
          </p>

          <div className="space-y-4 font-mono text-sm border-l-2 border-theme-accent pl-6 mb-12">
            <p className="text-theme-ink font-semibold">Mount a capability.</p>
            <p className="text-theme-ink font-semibold">Bind it to identity, policy, budget, and time.</p>
            <p className="text-theme-ink font-semibold">Execute through a governed boundary.</p>
            <p className="text-theme-ink font-semibold">Preserve evidence after the machine disappears.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 border border-theme-border bg-theme-surface p-6 rounded shadow-sm">
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-theme-accent uppercase tracking-widest border-b border-theme-border pb-2">Authority</h3>
              <p className="text-sm text-theme-inkDim">No consequence beyond authority.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-theme-accent uppercase tracking-widest border-b border-theme-border pb-2">Evidence</h3>
              <p className="text-sm text-theme-inkDim">No truth claim beyond evidence.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-theme-accent uppercase tracking-widest border-b border-theme-border pb-2">Agency</h3>
              <p className="text-sm text-theme-inkDim">No residual agency after termination.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <PrimaryButton href="/demo/governed-machine">Run the Governed Machine Demo</PrimaryButton>
            <SecondaryButton href="/proof">View Canonical Evidence</SecondaryButton>
            <SecondaryButton href="/login">Log in to Capability OS</SecondaryButton>
          </div>
        </div>
      </div>

      <CapabilityLifecycle />
    </HumanAppShell>
  );
}

