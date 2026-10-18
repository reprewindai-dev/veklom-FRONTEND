"use client";

import { useMemo } from "react";
import GovernCanvas from "@/components/cos/GovernCanvas";
import { pipelineGraph } from "@/lib/cos/tasks/pipeline-nodes";
import type { TaskState } from "@/lib/cos/tasks/task-types";

/**
 * The task drawn as five React Flow positions. Status comes from pipelineGraph(state), which reads
 * only what the task has observed; no node lights on a timer. The wire into a position animates
 * only while that position's request is in flight.
 */
export function PipelineCanvas({ state }: { state: TaskState }) {
  const { nodes, edges } = useMemo(() => pipelineGraph(state), [state]);
  const running = ["compiling", "requesting_authority", "executing", "reading_back"].includes(state.phase);
  return (
    <div className="space-y-2">
      <GovernCanvas nodes={nodes} edges={edges} isExecuting={running} />
      <p className="font-mono text-[10px] leading-4 text-cos-steel">
        Prepared = contract compiled · Permission = grant decision · Executing = consequence decision · Result check = independent re-read · Evidence = ledger anchoring. Each lights only from a response.
      </p>
    </div>
  );
}
