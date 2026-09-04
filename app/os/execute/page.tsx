"use client";

import { PhaseTrace } from "@/components/cos/PhaseTrace";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

export default function ExecutePage() {
  const stage = getStage("execute");
  const data = useStageData("execute");

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}><PhaseTrace phases={[
          { id: "authorize", name: "Authorize", status: "pending" },
          { id: "execute", name: "Execute", status: data.loading ? "current" : "pending" },
          { id: "settle", name: "Settle", status: "pending" },
        ]} /></Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}><HonestEmpty title="Execution telemetry not observed" route="POST /v1/exec" detail="No execution request is issued without an explicit operator action." /></Pillar>
        <Pillar title="Authority" proof={data.stageProof}><HonestEmpty title="Execution authority not observed" route="POST /v1/exec" detail="The execution route requires a governed request payload." /></Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}><HonestEmpty title="Execution evidence not observed" route="POST /v1/exec" detail="No run identifier or evidence receipt has been returned." /></Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Execution drift not measured" route="POST /v1/exec" detail="No runtime comparison is available." /></Pillar>
      </div>
    </SectionShell>
  );
}
