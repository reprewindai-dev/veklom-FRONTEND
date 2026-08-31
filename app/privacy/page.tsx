import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Privacy | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Legal & trust"
      title="Privacy should follow the architecture."
      intro="Veklom is designed to minimize unnecessary data movement and to keep governed execution as close as practical to the infrastructure selected by the operator. This notice describes the categories of data the product may process; it does not turn an architectural preference into a certification claim."
      sections={[
        {
          title: "Data categories",
          items: [
            "Account and workspace identifiers needed to authenticate operators and bind activity to the correct tenant.",
            "Session, security and access metadata required to prevent replay, investigate abuse and operate authenticated product surfaces.",
            "Operational telemetry, policy decisions and execution evidence needed to make governed actions inspectable after the runtime disappears.",
            "Integration metadata required for services you explicitly connect, such as GitHub installation or OAuth identifiers.",
          ],
        },
        {
          title: "Source and payload content",
          body: "Veklom does not require storing complete source repositories or arbitrary request bodies merely to provide governance. Individual capabilities may process content when the operator invokes them, but evidence and transport layers should record commitments, metadata or bounded facts where full content is not required.",
        },
        {
          title: "Infrastructure",
          body: "The deployment model may use operator-controlled local or private infrastructure together with explicitly configured service providers. Public ingress, source control, identity or payment integrations can introduce third parties; the current disclosed list is maintained on the Subprocessors page.",
        },
        {
          title: "Retention and evidence",
          body: "Ephemeral execution identity is intentionally short-lived, while evidence may need to survive longer for audit, reconciliation and security. Retention should follow the configured workspace, legal and evidence policies rather than an assumed universal period.",
        },
        {
          title: "Contact",
          items: [
            "Privacy or account questions: support@veklom.com",
            "Security or credential-exposure reports: security@veklom.com",
          ],
        },
      ]}
      note="This page does not claim GDPR, HIPAA, SOC 2, ISO 27001 or another certification merely because the product includes privacy or evidence controls. Deployment-specific obligations and contractual commitments must be established separately."
    />
  );
}
