"use client";

import { HonestEmpty, Pillar } from"@/components/cos/SectionPillars";
import { SectionShell } from"@/components/cos/SectionShell";
import { getStage } from"@/lib/cos/stages";
import { useStageData } from"@/lib/cos/useStageData";


export default function InfrastructurePage() {
 const stage = getStage("infrastructure");
 const data = useStageData("infrastructure", { autoGet: true });

 return (
 <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
 <div className="xl:col-span-2 space-y-4">
 <Pillar title="Host" proof={data.stageProof}>
 <HonestEmpty title="Host metrics unverified" route="GET /api/v1/infrastructure/host" detail="No active physical host proof." />
 </Pillar>
 <Pillar title="Runtime" proof={data.stageProof}>
 <HonestEmpty title="Runtime metrics unverified" route="GET /api/v1/infrastructure/runtime" detail="No runtime execution evidence." />
 </Pillar>
 </div>
 <div className="space-y-4">
 <Pillar title="Topology" proof={data.stageProof}>
 <HonestEmpty title="Topology unverified" route="GET /api/v1/infrastructure/topology" detail="Network topology layout missing." />
 </Pillar>
 <Pillar title="Connectivity" proof={data.stageProof}>
 <HonestEmpty title="Connectivity unverified" route="GET /api/v1/infrastructure/connectivity" detail="No active connection metrics." />
 </Pillar>
 </div>
 </SectionShell>
 );
}

