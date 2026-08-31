import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Terms | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Legal & trust"
      title="Access is not authority."
      intro="These product terms describe the operational boundary of using Veklom. Authentication, installation access or possession of a connection identifier does not grant permission to perform every consequence-bearing action available through a connected system."
      sections={[
        {
          title: "Account access",
          body: "You are responsible for the accounts, credentials, devices and infrastructure you connect to Veklom and for keeping authentication material secure. Access may be suspended when abuse, compromise or policy violations are reasonably suspected.",
        },
        {
          title: "Governed actions",
          body: "GitHub OAuth, Device Flow, app installation, API authentication, VLink pairing or repository visibility does not itself authorize writes, deployments, payments, data mutation or other consequences. Those actions remain subject to the configured Veklom authority and policy boundaries.",
        },
        {
          title: "Evidence and logs",
          body: "The product may generate operational and cryptographic evidence about governed actions, including denied actions. Evidence is intended to preserve attributable execution facts; it is not a guarantee that every external provider or third party will accept the evidence for every legal or commercial purpose.",
        },
        {
          title: "Acceptable use",
          body: "Use must comply with the Acceptable Use Policy and applicable law. You may not use Veklom to steal credentials, deploy malware, bypass third-party authorization, or create unauthorized consequences in systems you do not control or have permission to operate.",
        },
        {
          title: "Service boundary",
          body: "Features may be beta, locally deployed or under active development. Availability, support, pricing, service levels and deployment guarantees apply only when they are explicitly stated in the applicable order, plan or written agreement.",
        },
      ]}
      note="These terms do not convert a source-code feature, configured integration or passing test into a production availability, compliance or security warranty. Product claims remain bounded by the verified deployment and the applicable commercial agreement."
    />
  );
}
