"use client";

import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

export default function RuntimeDiagnosticsPage() {
  const stage = getStage("computeless");
  const data = useStageData("computeless");

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar title="Work" proof={data.stageProof}>
          <HonestEmpty
            title="Runtime diagnostics route absent"
            route="GET /api/v1/computeless/telemetry"
            detail="No compute diagnostics handler was found at the audited service source."
          />
        </Pillar>
      </div>
      <Pillar title="Telemetry" proof={data.stageProof}>
        <HonestEmpty
          title="No telemetry endpoint"
          route="GET /api/v1/computeless/evidence"
          detail="No compute telemetry or evidence payload is available."
        />
      </Pillar>
      <Pillar title="Authority" proof={data.stageProof}>
        <HonestEmpty
          title="No runtime execution endpoint"
          route="POST /api/v1/computeless/execute"
          detail="No compute execution handler was found at the audited service source."
        />
      </Pillar>
      <Pillar title="Evidence" proof={data.stageProof}>
        <HonestEmpty
          title="Runtime evidence not returned"
          route="GET /api/v1/computeless/evidence"
          detail="No evidence claim is rendered without a returned endpoint payload."
        />
      </Pillar>
      <Pillar title="Drift" proof={data.stageProof}>
        <HonestEmpty
          title="Runtime drift not measured"
          route="GET /api/v1/computeless/telemetry"
          detail="No runtime diagnostic signal was returned."
        />
      </Pillar>
    </SectionShell>
  );
}
