"use client";

import { PhaseTrace } from"@/components/cos/PhaseTrace";
import { HonestEmpty, Pillar } from"@/components/cos/SectionPillars";
import { SectionShell } from"@/components/cos/SectionShell";
import { getStage } from"@/lib/cos/stages";
import { useStageData } from"@/lib/cos/useStageData";
import { ExecuteHarness } from"@/components/cos/ExecuteHarness";

export default function ExecutePage() {
 const stage = getStage("execute");
 const data = useStageData("execute");

 return (
 <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
 <div className="space-y-4">
 <Pillar title="Work" proof={data.stageProof}><PhaseTrace phases={[
 { id:"authorize", name:"Authorize", status:"pending" },
 { id:"execute", name:"Execute", status: data.loading ?"current" :"pending" },
 { id:"settle", name:"Settle", status:"pending" },
 ]} /></Pillar>
 
 {/* The actual Execute Harness component */}
 <ExecuteHarness />

 </div>
 </SectionShell>
 );
}
