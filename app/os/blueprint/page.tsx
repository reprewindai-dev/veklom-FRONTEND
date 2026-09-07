"use client";

import { PhaseTrace } from "@/components/cos/PhaseTrace";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { PaymentChallenge } from "@/components/cos/StageParts";
import { classifyPayload } from "@/lib/cos/proof";

export default function BlueprintPage() {
  const stage = getStage("blueprint");
  const data = useStageData("blueprint", { autoGet: true });
  const plan = Object.values(data.payloads).find((value) => (
    value && typeof value === "object" && !Array.isArray(value) && !("x402_version" in value)
      && classifyPayload(value).observation.kind === "source-of-truth"
  ));
  const challenge = Object.values(data.payloads).find((value) => (
    value && typeof value === "object" && "x402_version" in value
  ));
  const phaseStatus = data.loading ? "current" : plan ? "complete" : "pending";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <PhaseTrace phases={[
            { id: "intent", name: "Intent", status: phaseStatus },
            { id: "compile", name: "Compile", status: phaseStatus },
            { id: "review", name: "Review", status: plan ? "current" : "pending" },
          ]} />
        </Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}>
          {challenge ? <PaymentChallenge value={challenge} /> : <HonestEmpty title="Compile telemetry follows the route" route="POST /api/v1/gpc/compile" detail="No timing or plan claim is rendered until the endpoint is called." />}
        </Pillar>
        <Pillar title="Authority" proof={data.stageProof}><HonestEmpty title="Blueprint authority not returned" route="GET /api/v1/gpc/stats" detail="The registry has not returned an authority binding." /></Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}><HonestEmpty title="No compiled plan evidence" route="POST /api/v1/gpc/compile" detail="A plan must be returned before it can be inspected." /></Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Blueprint drift not measured" route="GET /api/v1/gpc/stats" detail="No drift signal was returned by the blueprint routes." /></Pillar>
      </div>
    </SectionShell>
  );
}
