import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Subprocessors | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Enterprise trust"
      title="Disclose the services that actually participate."
      intro="Veklom's architecture is intentionally local/private-first, but some product functions can involve third-party infrastructure. This list is conservative: source-code support for a vendor does not automatically make that vendor an active subprocessor."
      sections={[
        {
          title: "GitHub",
          body: "Used for source control and, when enabled by the operator, GitHub App/OAuth installation and identity flows. The specific repository/account data available to Veklom depends on the permissions and repositories selected during installation.",
        },
        {
          title: "Cloudflare",
          body: "Used for public DNS/edge routing and Cloudflare Tunnel in the current public-site deployment profile. Cloudflare participation is an ingress/network role; it should not be described as receiving application data that the configured route does not send through it.",
        },
        {
          title: "Optional integrations",
          body: "The codebase contains optional provider integrations for models, payments, storage and other services. An optional connector becomes relevant to the subprocessor analysis only when it is actually enabled for a deployment and processes customer personal data in a subprocessor role.",
        },
        {
          title: "Change discipline",
          body: "New production third parties that process customer personal data should be added to this disclosure before or when they enter the applicable production data flow, subject to the notice requirements of the governing agreement.",
        },
      ]}
      note="This list is not a catalog of every package, API or provider Veklom can technically connect to. It is intended to describe third parties that actually participate in the relevant service/data-processing path."
    />
  );
}
