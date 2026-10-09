"use client";

import { SectionShell } from "@/components/cos/SectionShell";
import { TerminalSession } from "@/components/cos/TerminalSession";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

/** Full-screen operator runtime console. Also available anywhere in the OS with Ctrl+`. */
export default function TerminalPage() {
  const stage = getStage("terminal");
  const data = useStageData("terminal");
  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <TerminalSession autoFocus className="h-[60vh]" />
      </div>
    </SectionShell>
  );
}
