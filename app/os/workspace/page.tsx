"use client";

import { ConsequenceRing } from "@/components/cos/ConsequenceRing";
import { SectionShell } from "@/components/cos/SectionShell";
import { ConversationWorkspace } from "@/components/cos/workspace/ConversationWorkspace";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

/**
 * Workspace: the lifecycle as one conversation. Compile (ABIDE) → approve once → grant (CAPPO) →
 * execute once → independent readback. It is a presentation of the same lifecycle the operator
 * pages expose, through the same routes and the same session, not a second product.
 */
export default function WorkspacePage() {
  const stage = getStage("workspace");
  const data = useStageData("workspace");
  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <ConsequenceRing subject="What this workspace can currently prove" />
      </div>
      <ConversationWorkspace data={data} />
    </SectionShell>
  );
}
