"use client";

import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import SpineApp from "@/app/spine/page";

export default function ComputelessPage() {
  const stage = getStage("computeless");
  const data = useStageData("computeless", { autoGet: true });

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2 space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <div className="rounded-xl border border-cos-border overflow-hidden bg-cos-surface2/55">
             <SpineApp />
          </div>
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Telemetry" proof={data.stageProof}>
           <HonestEmpty title="Compute-less telemetry is route-backed" route="GET /api/v1/computeless/telemetry" detail="Latency and status remain in the route ledger below." />
        </Pillar>
        <Pillar title="Authority" proof={data.stageProof}>
           <HonestEmpty title="Authority context unverified" route="GET /api/v1/computeless/telemetry" detail="No authority scope has been established." />
        </Pillar>
        <Pillar title="Evidence" proof={data.stageProof}>
           <HonestEmpty title="No evidence payload observed" route="GET /api/v1/computeless/evidence" detail="The compute-less execution left no proof yet." />
        </Pillar>
        <Pillar title="Drift" proof={data.stageProof}>
           <HonestEmpty title="Execution drift not measured" route="GET /api/v1/computeless/evidence" detail="No comparison result was returned." />
        </Pillar>
      </div>
    </SectionShell>
  );
}
