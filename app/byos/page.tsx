import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "BYOS Runtime | Veklom",
  description: "The tenant and workspace execution substrate beneath Veklom Capability OS.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="BYOS Runtime"
      title="Your infrastructure. Your workspace. Governed execution."
      body="BYOS is the tenant and workspace runtime beneath Capability OS: identity, sessions, budgets, API access, integrations and private execution services live here instead of being outsourced to an opaque control plane."
      role="Tenant / workspace execution substrate"
      state="RUNTIME"
      stateDetail="The canonical backend exposes authenticated workspace APIs plus /health and dependency-aware /ready surfaces on the local deployment profile. Runtime health still has to be observed; source presence alone is not called uptime."
      owns={[
        "User, workspace and session lifecycle for the Capability OS.",
        "Tenant-scoped runtime configuration, API access and integration state.",
        "Budget, cost and private infrastructure controls associated with a workspace.",
        "The backend OAuth/session authority used by the premium control plane.",
      ]}
      doesNotOwn={[
        "CAPPO remains the fail-closed consequence-authority boundary.",
        "LockerPhycer remains the security/key/identity and host-execution boundary.",
        "Gnomledger / PGL remains the durable evidence and provenance service.",
      ]}
      interfaces={[
        { label: "Canonical local port", value: "8088" },
        { label: "Health", value: "GET /health" },
        { label: "Readiness", value: "GET /ready (dependency-aware)" },
        { label: "Authentication", value: "/api/v1/auth/* — email/password + GitHub OAuth/session issuance" },
      ]}
      proofNote="A working BYOS route proves that the tenant runtime answered. It does not, by itself, prove that a consequence was authorized, executed, or evidenced. Those claims belong to the full Veklom path."
      primaryHref="/architecture"
      primaryLabel="See the runtime stack"
      secondaryHref="/proof"
      secondaryLabel="Observe live services"
    />
  );
}
