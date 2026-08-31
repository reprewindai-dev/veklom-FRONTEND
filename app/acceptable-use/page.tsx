import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Acceptable Use | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Legal & trust"
      title="Governed infrastructure still requires legitimate use."
      intro="Veklom is built to constrain machine action, not to create a safer-looking path for unauthorized behavior. Operators remain responsible for having legitimate authority over the systems and consequences they connect."
      sections={[
        {
          title: "Prohibited activity",
          items: [
            "Credential theft, phishing, secret harvesting or unauthorized account access.",
            "Malware deployment, destructive payloads or attempts to compromise systems outside your authorized scope.",
            "Using Veklom to bypass provider, organization, legal or contractual authorization boundaries.",
            "Deliberate evasion of Veklom policy, evidence, budget, identity or consequence controls.",
          ],
        },
        {
          title: "Connected systems",
          body: "You must have permission to connect, inspect and operate every repository, API, model, service, account or infrastructure target used through Veklom. A successful technical connection does not establish legal or organizational authority.",
        },
        {
          title: "Evidence integrity",
          body: "Do not intentionally falsify, delete, suppress or misrepresent execution evidence, recovery evidence, policy decisions or verification outputs where those records are required for the governed action or the applicable deployment policy.",
        },
        {
          title: "Testing",
          body: "Adversarial testing should use environments and targets you control or are expressly authorized to test. Production-shaped simulations must remain labeled as simulations until provider-side consequence and readback evidence exists.",
        },
      ]}
      note="Veklom's authority model narrows what software may do; it does not grant permission from the owner of an external system. Technical capability and legitimate authority are separate requirements."
    />
  );
}
