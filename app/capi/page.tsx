import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "Connections | Veklom",
  description: "Veklom connects to the systems you already use and sits next to what you already run: no rip-and-replace, with accountability carried on every call.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="Connections"
      title="Connection should carry accountability, not bypass it."
      body="Connections is how Veklom connects to the systems you already use. It sits next to what you already run, with no rip-and-replace: it finds capabilities and carries calls between services, while authorization and durable evidence stay with the parts of Veklom that own them."
      role="Governed connections between your services"
      state="MIXED"
      stateDetail="The connection service has a working governed pipeline with request, discovery, policy, audit and evidence-forwarding surfaces; some demo behavior in its repository is not treated as production proof. The technical detail is published at veklom.dev."
      owns={[
        "Discovering capabilities across services and orchestrating the connection.",
        "Connection-level policy, request signing and replay-aware handling where implemented.",
        "Local audit records for the calls it observes, forwarded to Evidence when configured.",
        "A stable integration layer, so your applications do not have to carry Veklom authorization logic themselves.",
      ]}
      doesNotOwn={[
        "Authority remains the boundary that decides whether an action may take effect.",
        "A successful connection or local receipt does not by itself prove the external provider performed the claimed action.",
        "Evidence remains the durable record, and VLink remains the low-friction way to connect a single workload.",
      ]}
      interfaces={[
        { label: "Governed request", value: "POST /api/request" },
        { label: "Discovery", value: "GET /api/discover/{identity}" },
        { label: "Audit / evidence", value: "GET /api/audit · forwarded to Evidence when configured" },
        { label: "Technical proof", value: "https://veklom.dev" },
      ]}
      proofNote="Connections can truthfully show what it observed, signed and forwarded. The site must not upgrade demo traffic, a successful connection or a local log entry into proof of a real-world outcome without confirmation from the provider."
      primaryHref="/architecture"
      primaryLabel="See the connection plane"
      secondaryHref="https://veklom.dev"
      secondaryLabel="Technical proof at veklom.dev"
    />
  );
}
