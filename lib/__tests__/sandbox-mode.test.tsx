import { readFileSync } from "fs";
import { join } from "path";
import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
  environmentForProject,
  projectOfRecord,
  readEnvironmentIsSandbox,
  rowVisibleInEnvironment,
  SANDBOX_COPY,
  SandboxProvider,
  writeEnvironmentIsSandbox,
} from "@/lib/cos/sandbox";
import { EnvironmentFrame, ScopeTag } from "@/components/cos/EnvironmentFrame";
import { EnvironmentFooter, RuntimePill } from "@/components/cos/AppShell";
import { capabilityBadgeText } from "@/components/cos/CapabilityCard";
import { beaconStats, NO_DATA } from "@/lib/cos/beacon-stats";
import {
  readSessionCapabilityLease,
  storeSessionCapabilityLease,
} from "@/lib/cos/lease-session";
import {
  runSandboxScenario,
  sandboxMountRequest,
  SANDBOX_SCENARIOS,
  scenarioSdkSnippet,
  type ScenarioRequest,
  type ScenarioResponse,
} from "@/lib/cos/sandbox-scenarios";
import { resolveStageTransportPath } from "@/lib/cos/useStageData";

function renderToStaticMarkup(element: ReactElement): string {
  const container = document.createElement("div");
  const root = createRoot(container);
  flushSync(() => root.render(element));
  const html = container.innerHTML;
  flushSync(() => root.unmount());
  return html;
}

describe("sandbox environment mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("reads sandbox mode from localStorage", () => {
    window.localStorage.setItem("veklom.environment", "sandbox");
    expect(readEnvironmentIsSandbox()).toBe(true);
  });

  it("does not treat production mode as sandbox", () => {
    window.localStorage.setItem("veklom.environment", "production");
    expect(readEnvironmentIsSandbox()).toBe(false);
  });

  it("defaults to production when unset", () => {
    expect(readEnvironmentIsSandbox()).toBe(false);
  });
});

describe("sandbox chrome", () => {
  const render = (sandbox: boolean, node: ReactElement) => renderToStaticMarkup(
    <SandboxProvider value={sandbox}>{node}</SandboxProvider>,
  );

  it("renders the non-dismissible sandbox banner only in sandbox", () => {
    const sandboxHtml = render(true, <EnvironmentFrame />);
    expect(sandboxHtml).toContain('data-testid="sandbox-banner"');
    expect(sandboxHtml).toContain("SANDBOX — NON-PRODUCTION ENVIRONMENT · SAFE REHEARSAL · NO LIVE CONSEQUENCE");
    expect(sandboxHtml).not.toMatch(/dismiss|aria-label="close"/i);

    const liveHtml = render(false, <EnvironmentFrame />);
    expect(liveHtml).not.toContain('data-testid="sandbox-banner"');
    expect(liveHtml).not.toContain("NON-PRODUCTION");
  });

  it("switches runtime pill and footer copy by environment", () => {
    expect(renderToStaticMarkup(<RuntimePill sandbox />)).toContain("Runtime · Sandbox");
    expect(renderToStaticMarkup(<RuntimePill sandbox={false} />)).toContain("Runtime · Live");
    expect(renderToStaticMarkup(<EnvironmentFooter sandbox />)).toContain("SANDBOX ENVIRONMENT");
    expect(renderToStaticMarkup(<EnvironmentFooter sandbox={false} />)).not.toContain("SANDBOX");
  });

  it("labels mounted capability cards SANDBOX instead of MOUNTED in sandbox", () => {
    expect(capabilityBadgeText("Mounted", true)).toBe("SANDBOX");
    expect(capabilityBadgeText("Mounted", false)).toBe("MOUNTED");
    expect(capabilityBadgeText("Available", true)).toBe("AVAILABLE");
  });

  it("tags records with the environment CAPPO returned, never guessing live", () => {
    expect(renderToStaticMarkup(<ScopeTag project="sandbox" />)).toContain("SANDBOX");
    expect(renderToStaticMarkup(<ScopeTag project="acme" />)).toContain("LIVE");
    expect(renderToStaticMarkup(<ScopeTag />)).toContain("UNSCOPED");
    expect(environmentForProject(undefined)).toBe("unscoped");
  });
});

describe("hard separation between sandbox and live", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("never reads a live lease in sandbox or a sandbox lease in live", () => {
    storeSessionCapabilityLease({ mountId: "mnt_live", tokenId: "t", nonce: "n", project: "acme" });
    writeEnvironmentIsSandbox(true);
    expect(readSessionCapabilityLease()).toBeNull();
    storeSessionCapabilityLease({ mountId: "mnt_sbx", tokenId: "t", nonce: "n", project: "sandbox" });
    expect(readSessionCapabilityLease()?.mountId).toBe("mnt_sbx");
    writeEnvironmentIsSandbox(false);
    expect(readSessionCapabilityLease()?.mountId).toBe("mnt_live");
  });

  it("filters evidence rows by the returned project scope", () => {
    const sandboxRow = { id: "a", scope: { project: "sandbox" } };
    const liveRow = { id: "b", execution_scope: { project: "acme" } };
    const unscoped = { id: "c" };
    expect(projectOfRecord(sandboxRow)).toBe("sandbox");
    expect(rowVisibleInEnvironment(sandboxRow, true)).toBe(true);
    expect(rowVisibleInEnvironment(liveRow, true)).toBe(false);
    expect(rowVisibleInEnvironment(unscoped, true)).toBe(false);
    expect(rowVisibleInEnvironment(sandboxRow, false)).toBe(false);
    expect(rowVisibleInEnvironment(liveRow, false)).toBe(true);
  });
});

describe("sandbox mode reaches CAPPO", () => {
  it("every scenario mount request carries execution_scope.project=sandbox", () => {
    expect(sandboxMountRequest("ws_1")).toMatchObject({
      package_ref: "veklom.governed-counter@v1",
      execution_scope: { workspace: "ws_1", project: "sandbox" },
    });
  });

  function fakeCappo(options: { project?: string; allowReset?: boolean } = {}) {
    const requests: ScenarioRequest[] = [];
    let value = 4;
    let version = 4;
    const transport = async (request: ScenarioRequest): Promise<ScenarioResponse> => {
      requests.push(request);
      if (request.path === "/v1/capability/packages") {
        return { status: 200, data: [{ id: "veklom.governed-counter@v1", family: "sandbox" }] };
      }
      if (request.path === "/v1/capability/mounts") {
        const scope = (request.body?.execution_scope ?? {}) as Record<string, unknown>;
        return {
          status: 200,
          data: {
            decision: "allow",
            reason: "mounted",
            anchoring: { status: "confirmed", anchor_id: "anc_mount" },
            mount: { id: "mnt_1", scope: { ...scope, project: options.project ?? scope.project } },
            token: { token_id: "tok_1", nonce: "nonce_1", mount_id: "mnt_1" },
          },
        };
      }
      if (request.path.startsWith("/v1/capability/targets/")) {
        return { status: 200, data: { project: options.project ?? "sandbox", state: { value, version } } };
      }
      if (request.path.endsWith("/execute")) {
        const action = request.body?.action;
        if (action === "counter.increment" || (action === "counter.reset" && options.allowReset)) {
          value = action === "counter.reset" ? 0 : value + 1;
          version += 1;
          return { status: 200, data: { decision: "allow", reason: "allowed", anchoring: { anchor_id: "anc_exec", pgl_event_hash: "pgl_1" }, consequence: { receipt_id: "rcpt_1", terminated: true } } };
        }
        return { status: 200, data: { decision: "deny", reason: "action_blocked", anchoring: { anchor_id: "anc_deny" }, consequence: { terminated: true } } };
      }
      return { status: 200, data: { decision: "allow", reason: "terminated" } };
    };
    return { transport, requests };
  }

  it("allowed increment passes only with decision=allow and readback delta +1", async () => {
    const cappo = fakeCappo();
    const result = await runSandboxScenario("allowed-increment", { workspace: "ws_1", resource: "r1", transport: cappo.transport, newId: () => "id" });
    expect(result.pass).toBe(true);
    expect(result.evidence).toMatchObject({ receiptId: "rcpt_1", anchorId: "anc_exec", pglEventHash: "pgl_1", mountId: "mnt_1" });
    const mounts = cappo.requests.filter((request) => request.path === "/v1/capability/mounts");
    expect(mounts.length).toBeGreaterThan(0);
    for (const mount of mounts) {
      expect((mount.body?.execution_scope as Record<string, unknown>).project).toBe("sandbox");
    }
  });

  it("blocked counter.reset fails the scenario if CAPPO ever allows it", async () => {
    expect((await runSandboxScenario("blocked-reset", { workspace: "w", resource: "r", transport: fakeCappo().transport, newId: () => "id" })).pass).toBe(true);
    expect((await runSandboxScenario("blocked-reset", { workspace: "w", resource: "r", transport: fakeCappo({ allowReset: true }).transport, newId: () => "id" })).pass).toBe(false);
  });

  it("aborts instead of running if CAPPO does not echo project=sandbox", async () => {
    const result = await runSandboxScenario("allowed-increment", { workspace: "w", resource: "r", transport: fakeCappo({ project: "acme" }).transport, newId: () => "id" });
    expect(result.pass).toBe(false);
    expect(result.actual).toMatch(/refusing to continue outside sandbox/);
    expect(result.steps.some((step) => step.path.endsWith("/execute"))).toBe(false);
  });

  it("routes scenario calls through the same proxies as Mount/Execute", () => {
    expect(resolveStageTransportPath("mount", "/v1/capability/mounts")).toBe("/api/capi/interlink/capability/mounts");
    expect(resolveStageTransportPath("mount", "/v1/capability/mounts/m/execute")).toBe("/api/cappo/v1/capability/mounts/m/execute");
    const snippet = scenarioSdkSnippet("allowed-increment", {
      baseUrl: "https://example.test",
      workspace: "ws",
      resource: "r",
      transportPath: (path) => resolveStageTransportPath("mount", path),
    });
    expect(snippet).toContain("from veklom import VeklomClient");
    expect(snippet).toContain('"project": "sandbox"');
    expect(snippet).toContain("/api/cappo/v1/capability/mounts/{mount_id}/execute");
  });

  it("defines the required scenario set (no payment rehearsal without a real route)", () => {
    expect(SANDBOX_SCENARIOS.map((scenario) => scenario.id)).toEqual([
      "allowed-increment",
      "blocked-reset",
      "replay-spent-token",
      "revoked-credential",
      "forged-credential",
      "expired-mount",
      "unknown-mount",
    ]);
  });
});

describe("no invented numbers on the Command screen", () => {
  it("renders — for every beacon stat until CAPPO returns data", () => {
    for (const stat of beaconStats(undefined, {})) expect(stat.value).toBe(NO_DATA);
  });

  it("derives beacon stats from the returned beacon set only", () => {
    const now = Date.parse("2026-09-30T12:00:00Z");
    const stats = beaconStats({
      beacons: [
        { package_ref: "a", issued_at: "2026-09-30T10:00:00Z", expires_at: "2026-10-01T00:00:00Z" },
        { package_ref: "b", issued_at: "2026-09-20T10:00:00Z", expires_at: "2026-09-29T00:00:00Z" },
      ],
    }, { a: { valid: true }, b: { valid: false } }, now);
    const byId = Object.fromEntries(stats.map((stat) => [stat.id, stat.value]));
    expect(byId).toEqual({ active: "1", new: "1", verified: "50%", networks: NO_DATA, nodes: NO_DATA });
  });

  it("contains no hard-coded mockup statistics", () => {
    const root = join(__dirname, "..", "..");
    const sources = [
      "app/os/page.tsx",
      "components/cos/BeaconDiscovery.tsx",
      "components/cos/AppShell.tsx",
      "components/cos/LeftNav.tsx",
      "lib/cos/beacon-stats.ts",
    ].map((file) => readFileSync(join(root, file), "utf8"));
    for (const source of sources) {
      expect(source).not.toMatch(/\b127\b|1,264|\b1264\b|48 new|12 networks|["'>]\s*100%|SYSTEMS OPERATIONAL/);
    }
    expect(SANDBOX_COPY.footer).toBe("SANDBOX ENVIRONMENT");
  });
});
