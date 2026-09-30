import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Privacy | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Legal & trust · Last updated 30 September 2026"
      title="Privacy Policy"
      intro="This policy explains what information Veklom collects when you use veklom.com and the Veklom product, how we use it, who we share it with and how, how we protect it, how long we keep it and the choices you have. Last updated: 30 September 2026."
      sections={[
        {
          title: "Information we collect",
          items: [
            "Account information: your name, email address and username, and a one-way hash of your password. We never store your password in readable form.",
            "Authentication information: if you sign in with GitHub, GitHub shares your profile (login and display name) and your verified email address with us. We use them to create or match your Veklom account and do not keep your GitHub access token after sign-in. We also record session details such as sign-in time and session expiry and, for password sign-in, the IP address and browser user agent of the sign-in request.",
            "Workspace, usage and evidence data: the workspaces you create, the governed actions you run (both allowed and denied), policy decisions, receipts, audit logs and execution evidence, and your plan and credit usage.",
            "Billing information: payments for paid plans and credit top-ups are processed by Stripe. You enter your card and billing details with Stripe, and Veklom does not receive or store full card numbers. We keep your Stripe customer and subscription identifiers, plan, subscription status and payment events so we can apply your plan and credits.",
            "Technical logs: security and service logs such as request metadata, failed sign-in attempts and security events, which we use to operate and protect the service.",
            "Messages you send us: the content of emails you send to our support, billing or security addresses.",
          ],
        },
        {
          title: "How we use information",
          items: [
            "To create and secure your account, sign you in, verify your email address and reset your password.",
            "To provide the product: run and govern actions, produce receipts and evidence, and show you your history.",
            "To apply your plan, measure credit usage, and process subscriptions, renewals and top-ups through Stripe.",
            "To send service emails such as email verification, password reset, welcome, subscription and plan notices.",
            "To detect and prevent abuse, fraud and security incidents, and to investigate problems you report.",
            "To comply with legal obligations and enforce our Terms.",
          ],
        },
        {
          title: "Who we share it with and how",
          body: "We share information only with the service providers that help us run Veklom, and only what each one needs for its role. Information reaches them through their APIs and services over encrypted connections, and they process it under their own terms and privacy policies. The current list is on our Subprocessors page at veklom.com/subprocessors.",
          items: [
            "Stripe (payments): receives your email address, the card and billing details you enter on Stripe's checkout page, and the plan or top-up you buy, through Stripe Checkout and the Stripe API.",
            "Cloudflare (network, DNS and email): carries website traffic to veklom.com, delivers our service emails through Cloudflare Email Service (recipient address and message content), and routes inbound email sent to our addresses.",
            "GitHub (sign-in): only if you choose to sign in with GitHub. GitHub sends us your profile and verified email address through its OAuth API.",
            "Legal requirements: authorities or other parties when the law requires it, or when needed to protect the rights, property or safety of Veklom, our users or others.",
            "We do not sell your personal information, and we do not share it for cross-context behavioral advertising.",
          ],
        },
        {
          title: "Cookies and analytics",
          body: "We use essential cookies to keep you signed in and to protect sign-in flows; see veklom.com/cookies. The site includes support for Google Analytics, which loads only after you opt in and stays off when your browser sends a Global Privacy Control signal. You can change your choice at any time at veklom.com/privacy-choices.",
        },
        {
          title: "Security practices",
          items: [
            "Connections to veklom.com use HTTPS/TLS, and our service email is sent over an encrypted (TLS) SMTP connection.",
            "Passwords are stored only as bcrypt hashes. Password reset links expire and stop working once your password changes.",
            "The sign-in session cookie is set as HttpOnly and Secure with SameSite=Lax. Repeated failed sign-in attempts temporarily lock the account, and multi-factor authentication is available.",
            "Access to account and workspace data requires an authenticated session, administrative functions require an administrator role, and consequential actions are checked by Veklom's authorization layer before they run.",
            "Governed actions produce receipts and audit evidence so activity can be reviewed later.",
            "No method of transmission or storage is completely secure. If you believe your account or data is at risk, contact security@veklom.com.",
          ],
        },
        {
          title: "Retention",
          items: [
            "Execution evidence and logs are kept according to your plan: 7 days on Developer, 90 days on Pro and a longer period on Team. Enterprise retention is set by contract.",
            "Account information is kept while your account is open. You can ask us to delete it; we may keep some records where we need them for security, fraud prevention, legal obligations, billing or the integrity of governed evidence.",
            "Payment records held by Stripe are kept by Stripe under its own policies.",
          ],
        },
        {
          title: "Your rights and choices",
          body: "Depending on where you live, you may have the right to access, correct, delete or export your personal information, to object to or restrict some processing, and to withdraw consent. To make a request, use the Data Rights page at veklom.com/data-rights or email support@veklom.com. We verify requests before acting on them.",
        },
        {
          title: "Changes to this policy",
          body: "We may update this policy. When we do, we will change the \"Last updated\" date on this page.",
        },
        {
          title: "Contact",
          items: [
            "Privacy and account questions: support@veklom.com",
            "Billing questions: billing@veklom.com",
            "Security or credential-exposure reports: security@veklom.com",
          ],
        },
      ]}
      note="This page does not claim GDPR, HIPAA, SOC 2, ISO 27001 or another certification merely because the product includes privacy or evidence controls. Deployment-specific obligations and contractual commitments must be established separately."
    />
  );
}
