import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "Identity | Veklom",
  description: "Identity, keys, sign-in and the protected boundary around sensitive host execution in Veklom.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="Identity"
      title="Keep host execution authority out of ordinary application code."
      body="Identity is the part of Veklom that handles security, keys and sign-in, and guards sensitive execution on the host. It exists so an ordinary application container cannot quietly become the machine's root authority."
      role="Security, keys, identity and the host-execution boundary"
      state="MIXED"
      stateDetail="The identity service, its health checks and its isolated-execution code exist in source, but a live claim still has to be proven from the running deployment rather than assumed from code. The technical detail is published at veklom.dev."
      owns={[
        "Security and sign-in at the host-sensitive boundary.",
        "Keys and identity for governed execution.",
        "Isolated execution and host-access contracts where those paths are explicitly verified.",
        "Health and identity checks for the identity service itself.",
      ]}
      doesNotOwn={[
        "Connections owns how services connect to each other.",
        "Authority owns the decision whether an action may take effect, and fails closed.",
        "Evidence owns the durable record, and Execution runs the approved action.",
      ]}
      interfaces={[
        { label: "Health", value: "GET /health" },
        { label: "Works with", value: "Authority · Connections · Evidence · Execution" },
        { label: "Technical proof", value: "https://veklom.dev" },
      ]}
      proofNote="Identity should be judged by the boundary that is actually deployed: which version is running, signed authorization, replay behavior and the real action path. A configured URL or a passing unit test is not enough to claim the host boundary is live."
      primaryHref="/architecture"
      primaryLabel="See where it sits"
      secondaryHref="https://veklom.dev"
      secondaryLabel="Technical proof at veklom.dev"
    />
  );
}
