import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "VCGB | Veklom Capability Governance Benchmark",
  description: "The adversarial benchmark and conformance surface for governed capability systems.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="VCGB"
      title="A benchmark should attack the boundary, not decorate it."
      body="VCGB is Veklom's adversarial capability-governance benchmark concept: a proof instrument for testing whether a system makes the correct decision and contains the real-world effect under hostile inputs. It is not presented as a core production runtime plane."
      role="Adversarial benchmark / conformance instrument"
      state="SPEC"
      stateDetail="The frontend and documentation surface exist, but the current canonical runtime repositories do not expose a VCGB service with the same source/runtime depth as CAPPO, VNP, EEE, PGL or LockerPhycer. Until that changes, VCGB belongs in the proof lab, not the live runtime diagram."
      owns={[
        "The benchmark vocabulary for evaluating ALLOW / DENY and effect-boundary correctness.",
        "Adversarial scenarios that can be applied to a capability-governance implementation.",
        "A place to publish repeatable conformance criteria without turning the benchmark into execution authority.",
      ]}
      doesNotOwn={[
        "VCGB is not a production execution service and does not sit in the consequence path.",
        "A benchmark page is not proof that every scenario has been executed against the current deployment.",
        "CAPPO, LockerPhycer, VLink, VNP and EEE each keep their own runtime/proof responsibilities.",
      ]}
      interfaces={[
        { label: "Current classification", value: "Benchmark / specification surface" },
        { label: "Execution authority", value: "None" },
        { label: "Runtime status", value: "Do not represent as a live service until a canonical runtime exists" },
        { label: "Best home", value: "Conformance + adversarial proof tooling" },
      ]}
      proofNote="We are keeping VCGB because the benchmark idea is useful. We are removing the false equivalence: it should not appear beside live runtime services with an ONLINE badge until there is a canonical implementation and executed conformance evidence to justify that placement."
      primaryHref="/conformance"
      primaryLabel="See conformance doctrine"
      secondaryHref="/proof"
      secondaryLabel="Inspect current proof"
    />
  );
}
