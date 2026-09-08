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
  | "terminal"
  | "blueprint"
  | "execute"
  | "govern"
  | "mount"
  | "settle"
  | "tracker";

export interface StageEndpoint {
  path: string;
  baseUrl?: string;
  method?: "POST" | "GET" | "PUT" | "PATCH" | "DELETE";
  classification?: string;
  response?: any;
}

export interface StageDefinition {
  id: StageId;
  label: string;
  route: string;
  purpose: string;
  crossCutting?: boolean;
  endpoints: StageEndpoint[];
}

export const stages: StageDefinition[] = [
  { id: "command", label: "Command", route: "/os/command", purpose: "Command center", endpoints: [] },
  {
    id: "capabilities",
    label: "Capabilities",
    route: "/os/capabilities",
    purpose: "Capabilities",
    endpoints: [
      { method: "GET", path: "/api/v1/agents" },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard" },
      { method: "GET", path: "/v1/capability/beacons" },
      { method: "GET", path: "/v1/capability/beacons/verify" },
      { method: "GET", path: "/.well-known/capability-beacon-keys" },
    ],
  },
  { id: "workflows", label: "Workflows", route: "/os/workflows", purpose: "Workflows", endpoints: [] },
  { id: "authority", label: "Authority", route: "/os/authority", purpose: "Authority", endpoints: [] },
  { id: "governed-compute", label: "Governed Compute", route: "/os/governed-compute", purpose: "Governed Compute", endpoints: [] },
  { id: "executions", label: "Executions", route: "/os/executions", purpose: "Executions", endpoints: [] },
  { id: "evidence", label: "Evidence", route: "/os/evidence", purpose: "Evidence", endpoints: [] },
  { id: "measure", label: "Measure", route: "/os/measure", purpose: "Measure", endpoints: [] },
  {
    id: "mount",
    label: "Mount",
    route: "/os/mount",
    purpose: "Bind a capability package to a scoped, expiring execution boundary.",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages" },
      { method: "POST", path: "/v1/capability/mounts" },
      { method: "GET", path: "/v1/capability/mounts/{mount_id}" },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/actions" },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/terminate" },
    ],
  },
  {
    id: "settle",
    label: "Settle",
    route: "/os/settle",
    purpose: "Inspect payment requirements and settlement evidence for an action.",
    endpoints: [
      { method: "GET", path: "/.well-known/x402" },
      { method: "GET", path: "/api/v1/pricing" },
    ],
    crossCutting: true,
  },
  { id: "settings", label: "Settings", route: "/os/settings", purpose: "Settings", crossCutting: true, endpoints: [] },
  { id: "terminal", label: "Terminal", route: "/os/terminal", purpose: "Terminal", crossCutting: true, endpoints: [] },
];

const navOrder: StageId[] = [
  "command",
  "capabilities",
  "workflows",
  "authority",
  "governed-compute",
  "executions",
  "evidence",
  "measure",
];

export const spineStages = navOrder
  .map((id) => stages.find((stage) => stage.id === id)!)
  .filter(Boolean);

export const crossCuttingStages = stages.filter(
  (stage) => stage.crossCutting && !navOrder.includes(stage.id as StageId),
);

export function getStage(id: StageId | string): StageDefinition {
  const stage = stages.find((candidate) => candidate.id === id);
  if (!stage) return {
    id: id as StageId,
    label: id,
    route: `/os/${id}`,
    purpose: "Legacy",
    endpoints: [
      { method: "GET", path: "/.well-known/x402" },
      { method: "GET", path: "/api/v1/pricing" },
    ],
  };
  return stage;
}
