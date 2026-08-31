import { SystemLanding } from "@/components/brand/SystemLanding";

export const metadata = {
  title: "PGL / Gnomledger | Veklom",
  description: "Durable evidence, provenance and lineage for governed machine execution.",
};

export default function Page() {
  return (
    <SystemLanding
      eyebrow="PGL / Gnomledger"
      title="The machine can disappear. The evidence cannot."
      body="Project Genome Ledger is Veklom's durable provenance layer. It preserves append-only execution events, lineage and independently checkable hash-chain state so the truth of a governed action does not vanish with the process that performed it."
      role="Durable evidence / provenance and lineage"
      state="RUNTIME"
      stateDetail="Gnomledger is a standalone FastAPI service with append-only ledger APIs, per-identity chain verification, lineage surfaces and a canonical local health endpoint. Runtime proof still depends on the specific deployed instance being observed."
      owns={[
        "Append-only ledger event persistence with hash-chain integrity checks.",
        "Execution and identity provenance that survives process restarts.",
        "Lineage / ancestry relationships for machine identities and execution artifacts.",
        "Independent ledger verification surfaces used by other Veklom services.",
      ]}
      doesNotOwn={[
        "PGL records evidence; it does not mint consequence authority.",
        "A ledger event cannot make a false provider outcome true. The upstream evidence must still be attributable and correctly bound.",
        "CAPPO owns authorization; EEE defines a portable execution-evidence artifact; Guardian owns bounded recovery behavior.",
      ]}
      interfaces={[
        { label: "Canonical local API", value: "http://127.0.0.1:8001" },
        { label: "Health", value: "GET /health" },
        { label: "Append event", value: "POST /api/v1/ledger/events" },
        { label: "Verify chain", value: "GET /api/v1/ledger/agents/{id}/verify" },
      ]}
      proofNote="PGL proves the integrity and continuity of what was recorded. Strong external-consequence claims still require the evidence event to be bound to the real provider/result rather than merely appended successfully."
      primaryHref="/proof"
      primaryLabel="Inspect evidence fabric"
      secondaryHref="/eee"
      secondaryLabel="See portable EEE"
    />
  );
}
