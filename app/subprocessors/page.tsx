import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Subprocessors | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Enterprise trust · Last updated 30 September 2026"
      title="Subprocessors"
      intro="These are the third-party service providers that take part in running Veklom and process personal information on our behalf. For each one we list its purpose and the categories of data it handles. Source-code support for a vendor does not by itself make that vendor an active subprocessor."
      sections={[
        {
          title: "Stripe",
          items: [
            "Purpose: payment processing for paid subscriptions and credit top-ups, including hosted checkout and subscription management.",
            "Data categories: account email address; card and billing details entered directly with Stripe; plan or top-up purchased; Veklom workspace identifier; subscription and payment status.",
          ],
        },
        {
          title: "Cloudflare",
          items: [
            "Purpose: network edge, DNS and secure public access to veklom.com (Cloudflare Tunnel); delivery of Veklom service emails (Cloudflare Email Service); routing of inbound email to Veklom addresses (Cloudflare Email Routing).",
            "Data categories: website traffic and request metadata such as IP address and user agent; recipient email address, first name and content of service emails such as verification and password-reset messages; sender, recipient and content of inbound email.",
          ],
        },
        {
          title: "GitHub",
          items: [
            "Purpose: sign-in with GitHub (OAuth and Device Flow), used only when you choose it.",
            "Data categories: GitHub login, display name and verified email address shared by GitHub during sign-in.",
          ],
        },
        {
          title: "Optional integrations",
          body: "The codebase contains optional provider integrations for models, payments, storage, analytics and other services. An optional connector becomes relevant to the subprocessor analysis only when it is actually enabled for a deployment and processes customer personal data in a subprocessor role.",
        },
        {
          title: "Change discipline",
          body: "New production third parties that process customer personal data should be added to this disclosure before or when they enter the applicable production data flow, subject to the notice requirements of the governing agreement.",
        },
        {
          title: "Contact",
          items: [
            "Questions about subprocessors or data handling: support@veklom.com",
          ],
        },
      ]}
      note="This list is not a catalog of every package, API or provider Veklom can technically connect to. It is intended to describe third parties that actually participate in the relevant service/data-processing path. See the Privacy Policy at veklom.com/privacy for how information is used and shared."
    />
  );
}
