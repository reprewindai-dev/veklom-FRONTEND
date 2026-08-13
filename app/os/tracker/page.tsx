"use client";
import { useEffect } from "react";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { Pillar } from "@/components/cos/SectionPillars";
import { JsonPanel } from "@/components/cos/StageParts";
import { UnknownLink } from "@/components/cos/StageCollection";
export default function TrackerPage() {
  const stage = getStage("tracker"),
    data = useStageData("tracker");
  const sources = [
    {
      path: "/v1/audit/ledger",
      label: "Evidence",
      detail: "a ledger entry containing the execution or settlement reference",
    },
    {
      path: "/v1/runs",
      label: "Execution",
      detail:
        "a run record with the matching authorization and evidence identifiers",
    },
    {
      path: "/api/v1/platform/pulse",
      label: "Runtime",
      detail:
        "a pulse observation carrying the same runtime or deployment identifier",
    },
  ];
  const links = [
    [
      "Blueprint ↔ Plan",
      "a compiled plan payload with the originating blueprint identifier",
    ],
    [
      "Plan ↔ Authorization",
      "an authorization response referencing the compiled plan hash",
    ],
    [
      "Authorization ↔ Execution",
      "a run record carrying the authorization decision or execution binding",
    ],
    [
      "Execution ↔ Evidence",
      "an audit ledger entry carrying the execution identifier",
    ],
    [
      "Evidence ↔ Settlement",
      "a settlement receipt linked to the evidence or execution identifier",
    ],
  ];
  const pulseRecord = data.records.find((r) => r.path === "/api/v1/platform/pulse");
  const pulseProof = pulseRecord?.proof ?? "Needs proof";

  const runRecord = data.records.find((r) => r.path === "/v1/runs");
  const runProof = runRecord?.proof ?? "Needs proof";

  const ledgerRecord = data.records.find((r) => r.path === "/v1/audit/ledger");
  const ledgerProof = ledgerRecord?.proof ?? "Needs proof";

  useEffect(() => {
    for (const e of stage.endpoints) if (e.method === "GET") void data.call(e);
  }, [data.call, stage.endpoints]);
  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar
          title="Work"
          proof={data.stageProof}
          detail="A composed tracker refuses to call a link aligned without exact returned evidence."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {links.map(([label, detail]) => (
              <UnknownLink key={label} label={label} detail={detail} />
            ))}
          </div>
        </Pillar>
      </div>
      <Pillar title="Telemetry" proof={pulseProof}>
        <JsonPanel
          value={data.payloads["GET /api/v1/platform/pulse"]}
          empty="No pulse returned — GET /api/v1/platform/pulse"
        />
      </Pillar>
      <Pillar title="Authority" proof={runProof}>
        <UnknownLink
          label="Authorization ↔ Execution"
          detail="a run record carrying the authorization decision or execution binding"
        />
      </Pillar>
      <Pillar title="Evidence" proof={ledgerProof}>
        <JsonPanel
          value={data.payloads["GET /v1/audit/ledger"]}
          empty="No ledger returned — GET /v1/audit/ledger"
        />
      </Pillar>
      <Pillar title="Drift" proof={data.stageProof}>
        <div className="space-y-3">
          {sources.map((s) => (
            <UnknownLink key={s.path} label={s.label} detail={s.detail} />
          ))}
        </div>
      </Pillar>
    </SectionShell>
  );
}
