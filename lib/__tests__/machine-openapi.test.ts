import fs from "node:fs";
import path from "node:path";
import { publicMachineSpec } from "@/lib/machine-openapi";

const op = (ref?: string) => ({
  post: {
    summary: "op",
    ...(ref ? { requestBody: { content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } } } } : {}),
    responses: { "200": { description: "ok" } },
  },
});

const internalSpec = {
  openapi: "3.1.0",
  info: { title: "CAPPO Runtime", version: "0.1.0" },
  paths: {
    "/v1/capability/packages": { get: { summary: "List Packages", responses: {} } },
    "/v1/capability/mounts": op("MountRequest"),
    "/v1/capability/mounts/{mount_id}/execute": op("ExecuteRequest"),
    "/v1/license/issue": op("IssueRequest"),
    "/v1/kill-switch/{workspace_id}": op("KillSwitchRequest"),
    "/v1/budget/{workspace_id}": op("BudgetRequest"),
    "/legacy/snmp/toggle": op(),
    "/v1/consequence/reconcile": op("ReconcileReq"),
    "/v1/vnp/admin/providers": op("ProviderRequest"),
  },
  components: {
    schemas: {
      MountRequest: { properties: { execution_scope: { $ref: "#/components/schemas/MountScope" } } },
      MountScope: { properties: { workspace: { type: "string" } } },
      ExecuteRequest: { properties: { token_id: { type: "string" } } },
      IssueRequest: { properties: { plan_tier: { type: "string" } } },
      KillSwitchRequest: { properties: { active: { type: "boolean" } } },
      BudgetRequest: { properties: { balance_cents: { type: "integer" } } },
      ReconcileReq: { properties: { simulate_target_503: { type: "boolean" } } },
      ProviderRequest: { properties: { name: { type: "string" } } },
    },
  },
};

describe("public machine OpenAPI", () => {
  const spec = publicMachineSpec(internalSpec) as {
    paths: Record<string, Record<string, Record<string, unknown>>>;
    components: { schemas: Record<string, unknown> };
    servers: { url: string }[];
  };

  it("publishes only routes the site forwards, at their public paths", () => {
    expect(Object.keys(spec.paths).sort()).toEqual([
      "/api/cappo/v1/capability/mounts",
      "/api/cappo/v1/capability/mounts/{mount_id}/execute",
      "/api/cappo/v1/capability/packages",
    ]);
    expect(spec.servers[0].url).toBe("https://veklom.com");
  });

  it("never publishes internal admin, licence, kill-switch, budget, legacy or test routes", () => {
    const text = JSON.stringify(spec);
    for (const hidden of ["/v1/license", "kill-switch", "/v1/budget", "/legacy/", "simulate_target_503", "/v1/vnp/admin"]) {
      expect(text).not.toContain(hidden);
    }
  });

  it("keeps only the schemas the published routes use, following nested references", () => {
    expect(Object.keys(spec.components.schemas).sort()).toEqual(["ExecuteRequest", "MountRequest", "MountScope"]);
  });

  it("marks which routes need a signed-in session", () => {
    expect(spec.paths["/api/cappo/v1/capability/packages"].get["x-veklom-access"]).toBe("public read");
    expect(spec.paths["/api/cappo/v1/capability/mounts"].post["x-veklom-access"]).toBe("signed-in session required");
  });

  it("does not forward the quarantine queue (list, approve, deny) to any caller", async () => {
    const { isCappoProxyPath } = await import("@/lib/cappo-proxy-paths");
    for (const p of ["/v1/governance/v2/quarantine", "/v1/governance/v2/quarantine/q1/approve", "/v1/governance/v2/quarantine/q1/deny"]) {
      expect(isCappoProxyPath(p)).toBe(false);
    }
    // Still forwarded (session required): the routes the product uses.
    expect(isCappoProxyPath("/v1/capability/mounts")).toBe(true);
    expect(isCappoProxyPath("/v1/capability/packages")).toBe(true);
  });

  it("no longer forwards the full internal spec through a rewrite", () => {
    const config = fs.readFileSync(path.join(process.cwd(), "next.config.mjs"), "utf8");
    expect(config).not.toMatch(/source:\s*"\/machine\/openapi\.json"/);
  });
});
