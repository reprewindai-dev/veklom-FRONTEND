import { getStage } from "@/lib/cos/stages";
import { resolveStageBaseUrl, resolveStageTransportPath } from "@/lib/cos/useStageData";

describe("Capability OS Mount transport", () => {
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

  it("sends Mount calls through the same-origin CAPPO proxy", () => {
    expect(resolveStageTransportPath("mount", "/v1/capability/packages"))
      .toBe("/api/cappo/v1/capability/packages");
    expect(resolveStageTransportPath("mount", "/v1/capability/mounts"))
      .toBe("/api/cappo/v1/capability/mounts");
    expect(resolveStageTransportPath("mount", "/v1/capability/mounts/mnt_123/actions"))
      .toBe("/api/cappo/v1/capability/mounts/mnt_123/actions");
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

  it("does not rewrite unrelated stage routes", () => {
    expect(resolveStageTransportPath("execute", "/v1/exec")).toBe("/v1/exec");
    expect(resolveStageTransportPath("measure", "/v1/vnp/metrics")).toBe("/v1/vnp/metrics");
  });
});
