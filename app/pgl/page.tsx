import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "Evidence | Veklom",
  description: "Tamper-evident evidence of governed machine actions that you can verify independently, and that outlasts the machine that acted.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="Evidence"
      title="The machine can disappear. The evidence cannot."
      body="Evidence is Veklom's durable record of what happened. It keeps an append-only, tamper-evident history of every governed action that you can verify independently, so the truth of an action does not vanish with the process that performed it."
      role="Durable, tamper-evident evidence and history"
      state="RUNTIME"
      stateDetail="Evidence runs as its own service with append-only records and independent verification; what is proven always depends on the specific deployment being observed. The technical proof is published at veklom.dev."
      owns={[
        "Append-only records with tamper-evident integrity checks.",
        "A history of actions and identities that survives restarts.",
        "Lineage: which machine identity produced which action and result.",
        "Independent verification used by the rest of Veklom.",
      ]}
      doesNotOwn={[
        "Evidence records what happened; it does not grant authority.",
        "A record cannot make a false provider outcome true. The upstream evidence must still be attributable and correctly bound.",
        "Authority owns authorization; EEE defines a portable execution-evidence artifact; Guardian owns bounded recovery behavior.",
      ]}
      interfaces={[
        { label: "Health", value: "GET /health" },
        { label: "Append event", value: "POST /api/v1/ledger/events" },
        { label: "Verify record", value: "GET /api/v1/ledger/agents/{id}/verify" },
        { label: "Technical proof", value: "https://veklom.dev" },
      ]}
      proofNote="Evidence proves the integrity and continuity of what was recorded. Strong claims about real-world outcomes still require the record to be bound to the actual provider result, not merely stored successfully."
      primaryHref="/proof"
      primaryLabel="Inspect evidence fabric"
      secondaryHref="/eee"
      secondaryLabel="See portable EEE"
    />
  );
}
