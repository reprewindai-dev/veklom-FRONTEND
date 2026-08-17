import { getStage, isCappoStagePath, stages } from "@/lib/cos/stages";
import { resolveStageBaseUrl, resolveStageTransportPath } from "@/lib/cos/useStageData";

describe("Capability OS stage transport", () => {
  it("keeps the visible Mount contract on CAPPO canonical /v1 paths", () => {
    const mount = getStage("mount");
    expect(mount.endpoints.map((endpoint) => `${endpoint.method} ${endpoint.path}`)).toEqual([
      "GET /v1/capability/packages",
      "POST /v1/capability/mounts",
      "GET /v1/capability/mounts/{mount_id}",
      "POST /v1/capability/mounts/{mount_id}/actions",
      "POST /v1/capability/mounts/{mount_id}/terminate",
    ]);
  });

  it("sends every CAPPO stage call through the same-origin proxy", () => {
    const cappoPaths = [
      "/v1/capability/packages",
      "/v1/capability/mounts",
      "/v1/capability/mounts/mnt_123/actions",
      "/v1/exec",
      "/v1/governance/v2/assess",
      "/v1/vnp/metrics",
      "/api/v1/agents",
      "/api/v1/platform/pulse",
      "/.well-known/x402",
    ];

    for (const path of cappoPaths) {
      expect(resolveStageTransportPath("mount", path)).toBe(`/api/cappo${path}`);
    }

    expect(resolveStageTransportPath("measure", "/v1/vnp/metrics"))
      .toBe("/api/cappo/v1/vnp/metrics");
  });

  it("rewrites every declared CAPPO endpoint across all stages", () => {
    for (const stage of stages) {
      for (const endpoint of stage.endpoints) {
        if (!isCappoStagePath(endpoint.path)) continue;
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

  it("preserves sandbox base behavior for unrelated stages", () => {
    expect(
      resolveStageBaseUrl(
        "execute",
        true,
        "https://execute.example",
        "https://sandbox.example",
      ),
    ).toBe("https://sandbox.example");
    expect(resolveStageBaseUrl("execute", false, "https://execute.example"))
      .toBe("https://execute.example");
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
  });
});
