import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "Guardian | Veklom",
  description: "The bounded recovery plane for the Veklom single-host Windows/Docker profile.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="Veklom Guardian"
      title="Recovery is still a consequence. Give it a leash."
      body="Guardian is the thin recovery plane around the local Veklom stack. It observes declared service state, diagnoses the failure domain, performs only pre-authorized recovery actions and preserves recovery evidence instead of becoming an unrestricted host administrator."
      role="Policy-bounded software / service recovery"
      state="MIXED"
      stateDetail="Canonical Guardian source now includes signed manifest authority, application-level health checks, dependency gating, immutable LKG rollback and restart-budget state that survives Guardian restart. Native Windows SCM supervisor code is merged, but the live elevated install/kill/resurrection falsifier remains unsealed on the current laptop."
      owns={[
        "Health and desired-state reconciliation for explicitly enrolled Veklom services.",
        "Bounded restart / rollback actions defined by the signed recovery manifest.",
        "Dependency-aware recovery so one failure does not trigger a full-stack restart storm.",
        "Persistent recovery-exhaustion state and structured/cryptographic recovery evidence where verified.",
      ]}
      doesNotOwn={[
        "Guardian cannot widen its manifest authority into arbitrary Docker or shell administration.",
        "It does not provide physical host, power, disk, router, ISP or multi-host high availability.",
        "Database/data rollback and destructive state repair remain outside automatic recovery.",
      ]}
      interfaces={[
        { label: "Canonical source", value: "Veklom-Sovereign-Runtime-Infrastructure / guardian" },
        { label: "Recovery policy", value: "Signed manifest.yaml + pinned trust root" },
        { label: "LKG", value: "Immutable sha256 image identity" },
        { label: "Remaining live gate", value: "Windows SCM install + destructive wrapper restart proof" },
      ]}
      proofNote="Guardian is not advertised as zero downtime. Its claim is the exact set of failure modes it has actually recovered under bounded authority on the tested Windows/Docker profile; the Windows SCM resurrection row stays unsealed until the elevated live falsifier runs."
      primaryHref="/proof"
      primaryLabel="Observe the stack"
      secondaryHref="/architecture"
      secondaryLabel="See recovery in context"
    />
  );
}
