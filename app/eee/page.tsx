import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "EEE | Execution Evidence Envelope | Veklom",
  description: "Portable signed evidence for an already-governed execution.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="Execution Evidence Envelope"
      title="A portable record of what the governed execution actually became."
      body="EEE is the execution-evidence artifact, not an authorization token. CAPPO builds a signed envelope only after the authority path has done its job, binding the execution, authority context, policy decision, commitments, observed effects and verification material into one portable record."
      role="Portable signed execution-evidence format"
      state="PROOF"
      stateDetail="EEE-Core v0.1.0 is implemented in CAPPO with RFC 8785 canonicalization, SHA-256/SHA-384 envelope roots, Ed25519 issuer signatures and an offline verifier that returns VALID, VALID_WITH_UNRESOLVED_REFS, INVALID or UNSUPPORTED_VERSION."
      owns={[
        "A deterministic envelope over an already-gated execution and its evidence fields.",
        "Issuer signature verification against caller-supplied trusted public keys.",
        "Canonical integrity checks plus semantic validation of execution time, authority windows and required fields.",
        "Portable representation of provider attempts only when the governed executor actually reported attributable attempts.",
      ]}
      doesNotOwn={[
        "EEE cannot authorize or route an execution; the implementation deliberately exposes no execution entry point.",
        "An envelope does not invent unknown effects, provider attempts or revocation state just to look complete.",
        "PGL/Gnomledger is the durable provenance ledger; EEE is the portable execution record that can be stored or verified elsewhere.",
      ]}
      interfaces={[
        { label: "Version", value: "EEE-Core v0.1.0" },
        { label: "Canonicalization", value: "RFC 8785" },
        { label: "Integrity", value: "SHA-256 / SHA-384 + Ed25519 issuer signature" },
        { label: "Verifier", value: "Offline verification from envelope + trusted public key material" },
      ]}
      proofNote="EEE is still part of Veklom and it is implemented. Its job is narrower than the old marketing page implied: carry signed evidence about an already-governed execution without pretending the evidence artifact itself granted the authority."
      primaryHref="/pgl"
      primaryLabel="See durable provenance"
      secondaryHref="/proof"
      secondaryLabel="Inspect execution proof"
    />
  );
}
