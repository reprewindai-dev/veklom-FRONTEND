import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "LockerPhycer | Veklom",
  description: "The security, key, identity and governed host-execution boundary in Veklom.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="LockerPhycer"
      title="Keep host execution authority out of ordinary application code."
      body="LockerPhycer is Veklom's governed security, key and identity surface and the boundary around sensitive host execution. It exists so a normal app container cannot quietly become the machine's root authority."
      role="Security / key / identity and host-execution boundary"
      state="MIXED"
      stateDetail="The repository contains the canonical 8092 service, dependency-health surfaces and governed execution-cell code. Runtime identity must still be proven from the deployed commit, listener and service response; source code is not promoted into a live claim automatically."
      owns={[
        "Security and authentication utilities used at the host-sensitive boundary.",
        "Key and identity integration surfaces for governed execution.",
        "Execution-cell isolation and host-broker contracts where those paths are explicitly verified.",
        "Dependency health and protocol identity surfaces for the canonical LockerPhycer service.",
      ]}
      doesNotOwn={[
        "cAPI owns canonical cross-service connection behavior.",
        "CAPPO owns consequence authorization and fail-closed governance.",
        "Gnomledger owns durable evidence/provenance and BYOS owns tenant/workspace runtime state.",
      ]}
      interfaces={[
        { label: "Canonical local port", value: "8092" },
        { label: "Health", value: "GET /health" },
        { label: "Local API docs", value: "http://127.0.0.1:8092/docs when the canonical service is running" },
        { label: "Integrations", value: "cAPI · CAPPO · Gnomledger/PGL · BYOS" },
      ]}
      proofNote="LockerPhycer should be judged by the exact deployed boundary: commit identity, listener, signed authority, replay behavior and the real consequence path. A configured URL or a passing unit test is not enough to claim the host boundary is live."
      primaryHref="/architecture"
      primaryLabel="See where it sits"
      secondaryHref="/proof"
      secondaryLabel="Check runtime observation"
    />
  );
}
