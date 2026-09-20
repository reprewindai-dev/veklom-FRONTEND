import { isCappoProxyPath } from "@/lib/cappo-proxy-paths";
import { CAPI_RUNTIME_LABEL, CAPI_RUNTIME_URL } from "@/lib/capi-runtime";
import { getStage, stages } from "@/lib/cos/stages";
import {
  isCapiInterlinkPath,
  resolveStageBaseUrl,
  resolveStageTransportPath,
} from "@/lib/cos/useStageData";

describe("Capability OS stage transport", () => {
  it("uses canonical lifecycle labels and omits decommissioned endpoint ownership", () => {
    expect(stages.map((stage) => stage.id)).toEqual([
      "computeless",
      "capabilities",
      "mount",
      "blueprint",
      "govern",
      "authority",
      "execute",
      "evidence",
      "measure",
      "settle",
      "tracker",
      "terminal",
    ]);
    expect(stages.map((stage) => stage.label)).toEqual([
      "Runtime diagnostics",
      "Capabilities",
      "Mount",
      "Blueprint",
      "Govern",
      "Authority",
      "Execute",
      "Evidence",
      "Measure",
      "Settle",
      "Tracker",
      "Terminal",
    ]);
    expect(stages.flatMap((stage) => stage.endpoints).map((endpoint) => endpoint.path))
      .not.toContain("/api/v1/platform/pulse");
    expect(stages.flatMap((stage) => stage.endpoints).map((endpoint) => endpoint.path))
      .not.toContain("/api/v1/x402/verify");
    expect(stages.flatMap((stage) => stage.endpoints).map((endpoint) => endpoint.path))
      .not.toContain("/api/v1/x402/{receipt_id}/proof");
  });

  it("keeps the visible Mount contract on CAPPO canonical /v1 paths", () => {
    const mount = getStage("mount");
    expect(mount.owner).toBe(`${CAPI_RUNTIME_LABEL} Interlink bridge`);
    expect(mount.endpoints.slice(0, 4).every((endpoint) => endpoint.baseUrl === CAPI_RUNTIME_URL)).toBe(true);
    expect(mount.endpoints[4]?.baseUrl).toContain("cappo");
    expect(mount.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).toEqual([
      "GET /v1/capability/packages",
      "POST /v1/capability/mounts",
      "GET /v1/capability/mounts/{mount_id}",
      "POST /v1/capability/mounts/{mount_id}/actions",
      "POST /v1/capability/mounts/{mount_id}/terminate",
    ]);
  });

  it("sends Discovery, Mount, and action calls through cAPI Interlink", () => {
    const interlinkPaths = [
      "/v1/capability/packages",
      "/v1/capability/mounts",
      "/v1/capability/mounts/mnt_123",
      "/v1/capability/mounts/mnt_123/actions",
    ];

    for (const path of interlinkPaths) {
      expect(resolveStageTransportPath("mount", path)).toBe(`/api/capi/interlink${path}`);
    }

    expect(resolveStageTransportPath("execute", "/v1/capability/mounts/mnt_123/actions"))
      .toBe("/api/capi/interlink/v1/capability/mounts/mnt_123/actions");
  });

  it("keeps authority, execute, terminate, and readback on CAPPO", () => {
    const cappoPaths = [
      "/v1/executions/exec_123/evidence",
      "/v1/executions/exec_123/measurements",
      "/v1/exec",
      "/v1/governance/v2/assess",
      "/v1/vnp/metrics",
      "/api/v1/agents",
      "/api/v1/platform/pulse",
      "/.well-known/x402",
      "/v1/capability/mounts/mnt_123/terminate",
      "/v1/capability/mounts/mnt_123/execute",
      "/v1/capability/targets/target_123/state",
    ];

    for (const path of cappoPaths) {
      expect(resolveStageTransportPath("execute", path)).toBe(`/api/cappo${path}`);
    }

    expect(resolveStageTransportPath("measure", "/v1/vnp/metrics"))
      .toBe("/api/cappo/v1/vnp/metrics");
  });

  it("rewrites every declared CAPPO endpoint across all stages", () => {
    for (const stage of stages) {
      for (const endpoint of stage.endpoints) {
        if (isCapiInterlinkPath(endpoint.path)) {
          expect(resolveStageTransportPath(stage.id, endpoint.path))
            .toBe(`/api/capi/interlink${endpoint.path}`);
          continue;
        }
        if (!isCappoProxyPath(endpoint.path)) continue;
        expect(resolveStageTransportPath(stage.id, endpoint.path))
          .toBe(`/api/cappo${endpoint.path}`);
        expect(
          resolveStageBaseUrl(
            stage.id,
            false,
            endpoint.baseUrl,
            undefined,
            endpoint.path,
          ),
        ).toBeUndefined();
      }
    }
  });

  it("keeps the visible capability contracts on canonical CAPPO paths", () => {
    const capabilities = getStage("capabilities");
    expect(capabilities.endpoints.map((endpoint) => endpoint.path)).toEqual([
      "/api/v1/agents",
      "/api/v1/benchmarks/leaderboard",
      "/v1/capability/beacons",
      "/v1/capability/beacons/verify",
      "/.well-known/capability-beacon-keys",
    ]);
  });

  it("leaves non-CAPPO GPC calls on their existing same-origin path", () => {
    expect(resolveStageTransportPath("blueprint", "/api/v1/gpc/stats"))
      .toBe("/api/v1/gpc/stats");
  });

  it("never assigns an external base URL to Mount", () => {
    expect(resolveStageBaseUrl("mount", false, "https://cappo.example")).toBeUndefined();
    expect(
      resolveStageBaseUrl(
        "mount",
        true,
        "https://cappo.example",
        "https://sandbox.example",
      ),
    ).toBeUndefined();
  });

  it("keeps production same-origin and preserves explicit sandbox bases for unrelated stages", () => {
    expect(
      resolveStageBaseUrl(
        "execute",
        true,
        "https://execute.example",
        "https://sandbox.example",
      ),
    ).toBe("https://sandbox.example");
    expect(resolveStageBaseUrl("execute", false, "https://execute.example"))
      .toBeUndefined();
  });

  it("never assigns an external base URL to a CAPPO endpoint", () => {
    expect(
      resolveStageBaseUrl(
        "measure",
        false,
        "https://cappo.example",
        undefined,
        "/v1/vnp/metrics",
      ),
    ).toBeUndefined();
    expect(
      resolveStageBaseUrl(
        "measure",
        true,
        "https://cappo.example",
        "https://sandbox.example",
        "/v1/vnp/metrics",
      ),
    ).toBeUndefined();
  });
});
