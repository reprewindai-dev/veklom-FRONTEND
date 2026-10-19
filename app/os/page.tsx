"use client";

import { ConversationWorkspace } from "@/components/cos/workspace/ConversationWorkspace";
import { useStageData } from "@/lib/cos/useStageData";

export default function CapabilityOSWorkspace() {
  const data = useStageData("workspace");
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8 xl:px-10">
      <ConversationWorkspace data={data} />
    </div>
  );
}
