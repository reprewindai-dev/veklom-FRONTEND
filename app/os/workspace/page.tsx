"use client";

import { ConversationWorkspace } from "@/components/cos/workspace/ConversationWorkspace";
import { useStageData } from "@/lib/cos/useStageData";

/**
 * Task Workspace: The unified Concept 2 Cockpit.
 * The operator describes an outcome; Veklom prepares capabilities, compiles the DAG,
 * enforces policy, mints single-use CAPPO authority, executes, and preserves dual-state evidence.
 */
export default function WorkspacePage() {
  const data = useStageData("workspace");
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 xl:px-10">
      <ConversationWorkspace data={data} />
    </div>
  );
}
