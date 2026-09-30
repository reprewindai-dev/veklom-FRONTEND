import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Terms | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Legal & trust · Last updated 30 September 2026"
      title="Terms of Service"
      intro="These terms govern your use of veklom.com and the Veklom product, including plans, billing, cancellation and refunds. By creating an account or using Veklom you agree to them. Access is not authority: authentication, installation access or possession of a connection identifier does not grant permission to perform every consequence-bearing action available through a connected system. Last updated: 30 September 2026."
      sections={[
        {
          title: "Accounts",
          body: "You must provide accurate account information and keep it up to date. You are responsible for the accounts, credentials, devices and infrastructure you connect to Veklom, for keeping authentication material secure, and for activity under your account. Access may be suspended when abuse, compromise or policy violations are reasonably suspected.",
        },
        {
          title: "Plans and Welcome access",
          items: [
            "Welcome access: every new account receives a one-time 14-day Welcome period with full access. Safe-use limits apply and no card is required.",
            "Developer (free): after Welcome access ends, your account moves to Developer, which includes 250 governance credits per month.",
            "Pro: $99 per month, including 5,000 governance credits per month.",
            "Team: $399 per month, including 20,000 governance credits per month.",
            "Enterprise: pricing, credits and terms set by a separate written agreement.",
          ],
        },
        {
          title: "Credits and top-ups",
          items: [
            "Governed actions consume governance credits from your workspace balance. Credits are a usage allowance within Veklom; they are not money, have no cash value and cannot be transferred or exchanged.",
            "Monthly included credits reset at the start of each billing period. Unused included credits do not roll over.",
            "You can buy additional top-up credits at any time. Top-up credits do not expire and are used after your monthly included credits.",
          ],
        },
        {
          title: "Billing and auto-renewal",
          items: [
            "Payments are processed by Stripe. You enter your card details with Stripe, and Veklom does not store full card numbers.",
            "Paid subscriptions are billed monthly in advance, in US dollars, and renew automatically at the end of each monthly period until you cancel.",
            "By subscribing, you authorize us, through Stripe, to charge your payment method for each renewal and for any top-ups you buy.",
            "Prices do not include taxes unless stated. Where tax applies it is added at checkout.",
            "If a payment fails, we may retry it, and if it remains unpaid your account may return to the Developer plan.",
          ],
        },
        {
          title: "Cancellation",
          body: "You can cancel a paid subscription at any time from your account's billing settings or by emailing billing@veklom.com. Cancellation takes effect at the end of the current billing period. You keep paid-plan access until then, and your account then returns to the free Developer plan. Top-up credits you have already bought stay in your account.",
        },
        {
          title: "Refunds",
          body: "Fees are non-refundable. We do not provide refunds or credits for partial billing periods, unused time or consumed credits, except where required by law. If you believe you were charged in error, contact billing@veklom.com.",
        },
        {
          title: "Changes to pricing",
          body: "We may change plan prices, included credits or credit costs. We will give you at least 30 days' notice by email or in the product before a price change applies to your subscription, and the change takes effect from your next billing period after the notice. If you do not agree, you can cancel before the change applies.",
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
          body: "Features may be beta, locally deployed or under active development. Availability, support, service levels and deployment guarantees apply only when they are explicitly stated in the applicable order, plan or written agreement.",
        },
        {
          title: "Disclaimers",
          body: "Veklom is provided \"as is\" and \"as available\". To the extent permitted by law, we disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose and non-infringement, and we do not warrant that the service will be uninterrupted or error-free.",
        },
        {
          title: "Limitation of liability",
          body: "To the extent permitted by law, Veklom will not be liable for any indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue or data. Our total liability for any claim relating to the service is limited to the amount you paid Veklom in the 12 months before the claim arose. Nothing in these terms limits liability that cannot be limited by law.",
        },
        {
          title: "Changes to these terms",
          body: "We may update these terms. When we do, we will change the \"Last updated\" date on this page, and material changes will be notified to account holders before they take effect.",
        },
        {
          title: "Contact",
          items: [
            "Billing, subscription and refund questions: billing@veklom.com",
            "Account and general questions: support@veklom.com",
            "Security reports: security@veklom.com",
          ],
        },
      ]}
      note="These terms do not convert a source-code feature, configured integration or passing test into a production availability, compliance or security warranty. Product claims remain bounded by the verified deployment and the applicable commercial agreement."
    />
  );
}
