export type StageId = 
  | "command"
  | "capabilities"
  | "workflows"
  | "authority"
  | "governed-compute"
  | "executions"
  | "evidence"
  | "measure"
  | "settings"
  | "terminal";

export interface StageDefinition {
  id: StageId;
  label: string;
  route: string;
  purpose: string;
  crossCutting?: boolean;
}

export const stages: StageDefinition[] = [
  { id: "command", label: "Command", route: "/os/command", purpose: "Command center" },
  { id: "capabilities", label: "Capabilities", route: "/os/capabilities", purpose: "Capabilities" },
  { id: "workflows", label: "Workflows", route: "/os/workflows", purpose: "Workflows" },
  { id: "authority", label: "Authority", route: "/os/authority", purpose: "Authority" },
  { id: "governed-compute", label: "Governed Compute", route: "/os/governed-compute", purpose: "Governed Compute" },
  { id: "executions", label: "Executions", route: "/os/executions", purpose: "Executions" },
  { id: "evidence", label: "Evidence", route: "/os/evidence", purpose: "Evidence" },
  { id: "measure", label: "Measure", route: "/os/measure", purpose: "Measure" },
  { id: "settings", label: "Settings", route: "/os/settings", purpose: "Settings", crossCutting: true },
  { id: "terminal", label: "Terminal", route: "/os/terminal", purpose: "Terminal", crossCutting: true },
];

export const spineStages = stages.filter((stage) => !stage.crossCutting);
export const crossCuttingStages = stages.filter((stage) => stage.crossCutting);

export function getStage(id: StageId): StageDefinition {
  const stage = stages.find((candidate) => candidate.id === id);
  if (!stage) throw new Error(`Unknown Capability OS stage: ${id}`);
  return stage;
}
