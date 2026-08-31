import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "cAPI | Veklom",
  description: "The governed cross-service connection layer in Veklom.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="cAPI / Covenant"
      title="Connection should carry accountability, not bypass it."
      body="cAPI is Veklom's governed connection layer between capability surfaces. It discovers and carries calls across service boundaries while keeping consequence authority and durable evidence anchored in the systems that actually own them."
      role="Cross-service governed connection fabric"
      state="MIXED"
      stateDetail="The canonical cAPI repository exposes a typed governed pipeline and local runtime on port 3003, including request, state, discovery, policy composition, audit and evidence-forwarding surfaces. Some seeded/demo runtime behavior in that repo should not be confused with external production proof."
      owns={[
        "Cross-service capability discovery and connection orchestration.",
        "Connection-level policy, request signing and replay-aware handling where implemented in the cAPI runtime.",
        "Local audit/evidence records for cAPI-observed calls and forwarding status into PGL when configured.",
        "A stable interlink layer so application integrations do not need to own Veklom authority logic themselves.",
      ]}
      doesNotOwn={[
        "CAPPO remains the constitutional consequence-authority boundary.",
        "A cAPI connection or local receipt does not automatically prove the external provider performed the claimed consequence.",
        "PGL/Gnomledger remains the durable provenance store and VLink remains the low-friction portable connection primitive.",
      ]}
      interfaces={[
        { label: "Canonical local port", value: "3003" },
        { label: "Governed request", value: "POST /api/request" },
        { label: "Discovery", value: "GET /api/discover/{identity}" },
        { label: "Audit / evidence", value: "GET /api/audit · PGL forwarding when configured" },
      ]}
      proofNote="cAPI can truthfully show what it observed, signed and forwarded. The site must not upgrade seeded traffic, a successful connection or a local ledger entry into proof of an external real-world consequence without provider-side readback."
      primaryHref="/architecture"
      primaryLabel="See the connection plane"
      secondaryHref="/proof"
      secondaryLabel="Observe current runtime"
    />
  );
}
