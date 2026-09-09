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
      { method: "GET", path: "/api/v1/agents", classification: "live", response: "capability identity summaries" },
      { method: "GET", path: "/api/v1/benchmarks/leaderboard", classification: "live", response: "benchmark provider array" },
      { method: "GET", path: "/v1/capability/beacons", classification: "live", response: "capability beacon set" },
      { method: "POST", path: "/v1/capability/beacons/verify", classification: "live", response: "beacon verification result" },
      { method: "GET", path: "/.well-known/capability-beacon-keys", classification: "live", response: "published beacon issuer keys" },
    ],
  },
  { id: "workflows", label: "Workflows", route: "/os/workflows", purpose: "Workflows", endpoints: [] },
  { id: "authority", label: "Authority", route: "/os/authority", purpose: "Authority", endpoints: [] },
  { id: "governed-compute", label: "Governed Compute", route: "/os/governed-compute", purpose: "Governed Compute", endpoints: [] },
  { id: "executions", label: "Executions", route: "/os/executions", purpose: "Executions", endpoints: [] },
  { id: "evidence", label: "Evidence", route: "/os/evidence", purpose: "Evidence", endpoints: [] },
  { id: "measure", label: "Measure", route: "/os/measure", purpose: "Measure", endpoints: [] },
  { id: "settings", label: "Settings", route: "/os/settings", purpose: "Settings", crossCutting: true, endpoints: [] },
  { id: "terminal", label: "Terminal", route: "/os/terminal", purpose: "Terminal", crossCutting: true, endpoints: [] },
];

const operationalStages: StageDefinition[] = [
  {
    id: "mount",
    label: "Mount",
    route: "/os/mount",
    purpose: "Bind a capability package to a scoped, expiring execution boundary.",
    endpoints: [
      { method: "GET", path: "/v1/capability/packages", classification: "live", response: "capability package catalog" },
      { method: "POST", path: "/v1/capability/mounts", classification: "live", response: "mount decision, scope, and token descriptor" },
      { method: "GET", path: "/v1/capability/mounts/{mount_id}", classification: "live", response: "persisted mount lifecycle status" },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/actions", classification: "live", response: "action allow or deny decision" },
      { method: "POST", path: "/v1/capability/mounts/{mount_id}/terminate", classification: "live", response: "mount termination decision" },
    ],
  },
];

export const spineStages = stages.filter((stage) => !stage.crossCutting);
export const crossCuttingStages = stages.filter((stage) => stage.crossCutting);

export function getStage(id: StageId | string): StageDefinition {
  const stage = [...stages, ...operationalStages].find((candidate) => candidate.id === id);
  if (!stage) {
    return {
      id: id as StageId,
      label: id,
      route: `/os/${id}`,
      purpose: "Legacy",
      endpoints: [
        { path: "", baseUrl: "" },
        { path: "", baseUrl: "" },
        { path: "", baseUrl: "" },
      ],
    } as any;
  }
  return stage;
}
