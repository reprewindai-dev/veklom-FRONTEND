import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "CAPPO | Veklom",
  description: "The fail-closed consequence-authority boundary in Veklom Capability OS.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="CAPPO"
      title="Nothing crosses into consequence without authority."
      body="CAPPO is the machine-authority kernel: it evaluates whether a requested action fits the identity, capability, policy, budget, time and execution context that were actually granted before a real effect is allowed to proceed."
      role="Fail-closed consequence authorization"
      state="PROOF"
      stateDetail="CAPPO has source, adversarial harnesses and runtime proof paths for authority monotonicity, offline closure, consequence dominance and evidence synchronization. Stronger claims remain scoped to the exact verified deployment profile and consequence paths."
      owns={[
        "The ALLOW / DENY decision for consequence-bearing execution paths.",
        "Capability lease and attenuation enforcement at the authority boundary.",
        "Fail-closed checks around identity, policy, budget, replay and expiry.",
        "The canonical governed execution path used by the live Activation journey.",
      ]}
      doesNotOwn={[
        "BYOS owns tenant/workspace runtime and user session state.",
        "LockerPhycer owns the host-sensitive security/execution boundary.",
        "PGL/Gnomledger owns durable evidence; cAPI/VLink own connection surfaces rather than authority minting.",
      ]}
      interfaces={[
        { label: "Governed execution", value: "POST /v1/exec" },
        { label: "Capability APIs", value: "/api/v1/cappo/*" },
        { label: "Evidence", value: "Execution-linked PGL / EEE paths" },
        { label: "Doctrine", value: "No consequence beyond authority" },
      ]}
      proofNote="CAPPO is not a marketing policy dashboard. Its useful claim is narrower and harder: consequence paths that have been brought under the boundary must fail before effect when authority is missing, stale, widened, replayed or exhausted."
      primaryHref="/activate"
      primaryLabel="Run the live proof journey"
      secondaryHref="/conformance"
      secondaryLabel="See conformance boundary"
    />
  );
}
