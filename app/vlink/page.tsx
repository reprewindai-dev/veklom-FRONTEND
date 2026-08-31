import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "VLink | Veklom",
  description: "The low-friction portable connection primitive into Veklom.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="VLink"
      title="Connect what already exists. Keep authority separate."
      body="VLink is the portable connection primitive into Veklom: create a self-describing link, pair a workload, receive short-lived scoped access, execute through the link and leave verifiable activity without forcing an application rewrite."
      role="Portable connection / pairing and scoped access"
      state="PROOF"
      stateDetail="Canonical VLink includes restart-safe single-node state, short-lived enrollment and workload access, cross-VLink replay denial, Ed25519-signed activity receipts and bounded retry-safe two-target failover. Each claim remains scoped to the exact behavior its tests cover."
      owns={[
        "Portable VLink identity and secret-free connection manifests.",
        "Short-lived enrollment, browser/device pairing and one-VLink workload access tokens.",
        "Restart-safe local connection/access/revocation/activity state when a persistent state path is configured.",
        "Signed activity receipts and explicitly bounded failover for caller-declared retry-safe requests.",
      ]}
      doesNotOwn={[
        "A VLink ID is correlation, not authority; deeper Capability OS policy remains outside the connection identifier.",
        "VLink does not claim arbitrary consequence retry safety, exactly-once semantics or zero-downtime failover.",
        "Signed receipt objects are not yet claimed as durable local evidence retention or externally witnessed non-repudiation.",
      ]}
      interfaces={[
        { label: "Manifest", value: "/.well-known/vlink.json · /api/v1/vlinks/{id}/manifest" },
        { label: "Self-binding base URL", value: "/vlinks/{vlink-id}/v1" },
        { label: "Receipt verification", value: "POST /receipts/verify" },
        { label: "Bounded failover", value: "/failover/vlinks/{id}/v1/chat/completions + X-VLink-Retry-Safe: true" },
      ]}
      proofNote="VLink's public promise should stay simple: link an existing system into Veklom with scoped temporary access and verifiable connection activity. It is not allowed to turn transport convenience into wider execution authority."
      primaryHref="/docs"
      primaryLabel="Open developer docs"
      secondaryHref="/architecture"
      secondaryLabel="See its boundary"
    />
  );
}
