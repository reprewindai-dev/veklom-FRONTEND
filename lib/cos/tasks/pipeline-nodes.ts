import type { Edge, Node } from "reactflow";
import type { TaskState } from "./task-types";

/**
 * The five positions the Workspace draws on its React Flow canvas. Each status is derived from
 * what has actually been observed in the task: there are no timers and nothing lights up on its own.
 */
export type PipelineStatus = "idle" | "running" | "success" | "failure";

export type PipelinePosition = {
  id: "prepared" | "permission" | "executing" | "result" | "evidence";
  label: string;
  nodeType: string;
  status: PipelineStatus;
  subtitle: string;
};

export function pipelinePositions(state: TaskState): PipelinePosition[] {
  const { phase, plan, authority, execution, readback } = state;
  const compiled = Boolean(plan);
  const prepared: PipelineStatus = phase === "compiling" ? "running"
    : phase === "refused" ? "failure"
      : compiled ? "success"
        : phase === "failed" && !plan ? "failure" : "idle";
  const permission: PipelineStatus = phase === "requesting_authority" ? "running"
    : authority ? (authority.decision === "allow" ? "success" : "failure")
      : phase === "failed" && plan ? "failure" : "idle";
  const executing: PipelineStatus = phase === "executing" ? "running"
    : phase === "outcome_unknown" ? "failure"
      : execution ? (execution.decision === "allow" ? "success" : "failure") : "idle";
  const result: PipelineStatus = phase === "reading_back" ? "running"
    : readback ? (readback.proof === "Verified" ? "success" : "failure") : "idle";
  const evidence: PipelineStatus = execution?.decision === "allow"
    ? (execution.anchoringStatus === "confirmed" ? "success" : execution.anchoringStatus ? "failure" : "idle")
    : "idle";
  return [
    { id: "prepared", label: "Prepared", nodeType: "abide · contract", status: prepared, subtitle: plan ? `${plan.steps.length} step${plan.steps.length === 1 ? "" : "s"} · ${plan.verdict.replace(/_/g, " ")}` : "not compiled" },
    { id: "permission", label: "Permission", nodeType: "cappo · grant", status: permission, subtitle: authority ? `${authority.decision}${authority.mountId ? ` · ${authority.mountId}` : ""}` : "not requested" },
    { id: "executing", label: "Executing", nodeType: "cappo · execute", status: executing, subtitle: execution ? `${execution.decision}${execution.receiptId ? ` · receipt ${execution.receiptId}` : ""}` : "not run" },
    { id: "result", label: "Result check", nodeType: "target · readback", status: result, subtitle: readback ? readback.proof : "not read" },
    { id: "evidence", label: "Evidence", nodeType: "pgl · anchoring", status: evidence, subtitle: execution?.anchoringStatus ?? "not anchored" },
  ];
}

const X_STEP = 220;

export function pipelineGraph(state: TaskState): { nodes: Node[]; edges: Edge[] } {
  const positions = pipelinePositions(state);
  const nodes: Node[] = positions.map((position, index) => ({
    id: position.id,
    type: "custom",
    position: { x: index * X_STEP, y: 0 },
    data: { label: position.label, subtitle: position.subtitle, node_type: position.nodeType, status: position.status },
  }));
  const edges: Edge[] = positions.slice(1).map((position, index) => ({
    id: `${positions[index].id}->${position.id}`,
    source: positions[index].id,
    target: position.id,
    // An edge is animated only while the position it leads to is being observed.
    animated: position.status === "running",
  }));
  return { nodes, edges };
}
