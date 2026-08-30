import React from "react";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { ProofChip, CapabilityLifecycle, PrimaryButton, SecondaryButton } from "@/components/ui/SharedUI";

export default function LandingPage() {
  return (
    <HumanAppShell>
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 w-full">
        {/* Current proof posture: durable public claims, not transient test counts. */}
        <div className="flex items-center flex-wrap gap-3 mb-16 pb-6 border-b border-theme-border w-full">
          <ProofChip label="FOUNDATIONAL BASELINE SEALED" state="verified" />
          <ProofChip label="6 CONSTITUTIONAL INVARIANTS" state="verified" />
          <ProofChip label="INBOUND TRUTH SEALED" state="verified" />
          <ProofChip label="FAIL-CLOSED AUTHORITY" state="verified" />
          <ProofChip label="TAMPER-EVIDENT EVIDENCE" state="verified" />
          <ProofChip label="ACTIVATION IN PROGRESS" state="info" />
        </div>

        <div className="max-w-4xl">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-theme-accent mb-5">
            Machine Authority Infrastructure
          </p>

          <h1 className="text-5xl md:text-6xl font-sans font-semibold tracking-tight leading-tight mb-8 text-theme-ink">
            Govern what machines <br />are allowed to cause.
          </h1>

          <p className="text-lg md:text-xl text-theme-inkDim leading-relaxed mb-8 max-w-3xl">
            Models create capability. Veklom governs consequence. Give automation bounded authority to act across real systems &mdash; constrained by identity, policy, scope, budget, and time &mdash; with evidence of what actually happened.
          </p>

          <div className="space-y-4 font-mono text-sm border-l-2 border-theme-accent pl-6 mb-12">
            <p className="text-theme-ink font-semibold">Capability without authority produces no consequence.</p>
            <p className="text-theme-ink font-semibold">Authority may be preserved or narrowed &mdash; never silently widened.</p>
            <p className="text-theme-ink font-semibold">Unknown outcomes remain unknown until reconciliation.</p>
            <p className="text-theme-ink font-semibold">Evidence binds the action to the authority that permitted it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 border border-theme-border bg-theme-surface p-6 rounded shadow-sm">
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-theme-accent uppercase tracking-widest border-b border-theme-border pb-2">Authority</h3>
              <p className="text-sm text-theme-inkDim">No consequence beyond bounded authority.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-theme-accent uppercase tracking-widest border-b border-theme-border pb-2">Consequence</h3>
              <p className="text-sm text-theme-inkDim">Execution crosses a fail-closed governed boundary.</p>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-theme-accent uppercase tracking-widest border-b border-theme-border pb-2">Evidence</h3>
              <p className="text-sm text-theme-inkDim">No truth claim beyond verifiable evidence.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
            <div className="border border-theme-border bg-theme-surface p-5 rounded">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-theme-accent mb-2">Sealed foundation</div>
              <p className="text-sm text-theme-inkDim leading-relaxed">
                Bounded consequence authority, fail-closed rejection, disruption-safe finality, offline authority behavior, independent ingress, and evidence-backed replay/idempotency behavior form the sealed foundational baseline.
              </p>
            </div>
            <div className="border border-theme-border bg-theme-surface p-5 rounded">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-theme-accent mb-2">Next product milestone</div>
              <p className="text-sm text-theme-inkDim leading-relaxed">
                Activation v1 is the current product gate: connect automation, grant bounded authority, create an allowed consequence, observe an intentional denial, and inspect the resulting evidence.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <PrimaryButton href="/proof">Inspect the Proof</PrimaryButton>
            <SecondaryButton href="/architecture">See the Architecture</SecondaryButton>
            <SecondaryButton href="/login">Open Capability OS</SecondaryButton>
          </div>

          <p className="text-xs font-mono text-theme-inkDim max-w-3xl leading-relaxed">
            Proof status is intentionally scoped. Sealed foundational conformance does not imply universal infrastructure liveness, hardware isolation, or verification of every future connector and deployment profile.
          </p>
        </div>
      </div>

      <CapabilityLifecycle />
    </HumanAppShell>
  );
}
