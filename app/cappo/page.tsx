import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "Authority | Veklom",
  description: "Veklom checks every consequential machine action against what was actually authorized, and blocks it before it takes effect if it does not fit.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="Authority"
      title="Nothing crosses into consequence without authority."
      body="Authority is the part of Veklom that decides whether a machine may act. Before a real effect is allowed to happen, it checks the requested action against the identity, permissions, policy, budget, time window and context that were actually granted."
      role="Fail-closed authorization for consequential actions"
      state="PROOF"
      stateDetail="Authorization is backed by source code, adversarial test harnesses and runtime proof paths, and every stronger claim stays scoped to the exact deployment that was verified. The technical proof is published at veklom.dev."
      owns={[
        "The ALLOW / DENY decision for actions that have real consequences.",
        "Enforcing time-limited, narrowed permissions at the point of action.",
        "Fail-closed checks around identity, policy, budget, replay and expiry.",
        "The governed execution path used by the live Activation journey.",
      ]}
      doesNotOwn={[
        "BYOS owns tenant/workspace runtime and user session state.",
        "Identity owns the security, key and host-execution boundary.",
        "Evidence owns the durable record; Connections and VLink connect your systems but never grant authority.",
      ]}
      interfaces={[
        { label: "Governed execution", value: "POST /v1/exec" },
        { label: "Evidence", value: "Every execution is linked to its tamper-evident evidence record" },
        { label: "Doctrine", value: "No consequence beyond authority" },
        { label: "Technical proof", value: "https://veklom.dev" },
      ]}
      proofNote="Authority is not a marketing policy dashboard. Its useful claim is narrower and harder: actions brought under Veklom must fail before they take effect when authorization is missing, stale, widened, replayed or used up."
      primaryHref="/activate"
      primaryLabel="Run the live proof journey"
      secondaryHref="https://veklom.dev"
      secondaryLabel="Technical proof at veklom.dev"
    />
  );
}
