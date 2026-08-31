import { PolicyPage } from "@/components/brand/PolicyPage";

export const metadata = { title: "Support | Veklom" };

export default function Page() {
  return (
    <PolicyPage
      eyebrow="Support"
      title="Route the issue to the boundary that owns it."
      intro="Veklom spans runtime, identity, authority, connection, evidence and recovery. Support is clearer when the report names the failing boundary instead of collapsing the entire stack into one generic 'site issue'."
      sections={[
        {
          title: "Product & account",
          items: [
            "Login, workspace, GitHub App installation, Capability OS access and product questions: support@veklom.com",
            "Include the affected route, approximate time and browser/device context. Do not include passwords, bearer tokens, refresh tokens or private keys.",
          ],
        },
        {
          title: "Security",
          items: [
            "Credential exposure, webhook abuse, suspected authorization bypass, evidence tampering or security vulnerabilities: security@veklom.com",
            "Use /.well-known/security.txt for the canonical public security-contact surface.",
          ],
        },
        {
          title: "Runtime diagnostics",
          body: "For service/runtime issues, include the affected Veklom plane when known: BYOS, LockerPhycer, CAPPO, cAPI, PGL/Gnomledger, VLink, VNP or Guardian. Health/reachability information is visible on the public status/proof surfaces without exposing internal credentials.",
        },
        {
          title: "Evidence",
          body: "When reporting an execution or recovery discrepancy, provide non-secret execution IDs, receipt/event IDs, timestamps and the expected vs observed outcome. Avoid copying full request bodies or sensitive provider data unless explicitly requested through a secure support channel.",
        },
      ]}
      note="Support will never ask you to paste private keys, OAuth client secrets, bearer tokens or production credentials into a public issue, screenshot or chat."
    />
  );
}
