/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { isFabricOwner, parseFabricOwners, principalWorkspace } from "@/lib/computless-proxy-paths";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

// Private Cloud: a listed owner uses the single-owner fabric (owner token). Every other
// signed-in account is a customer routed only to its own workspace (service token + the
// workspace LockerPhycer reports for the session). A customer never sees the owner token,
// the owner's join command, or another workspace.
describe("Private Cloud owner and workspace routing", () => {
  let proxyModule: ProxyModule;
  const keys = ["COMPUTLESS_URL", "FABRIC_OWNER_TOKEN", "FABRIC_SERVICE_TOKEN", "FABRIC_OWNER_EMAILS", "LOCKERPHYCER_URL"] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

  beforeAll(() => {
    process.env.COMPUTLESS_URL = "http://fabric.test:3000";
    process.env.FABRIC_OWNER_TOKEN = "owner-token-test";
    process.env.FABRIC_SERVICE_TOKEN = "service-token-test";
    process.env.FABRIC_OWNER_EMAILS = "Owner@Example.com, second@example.com";
    process.env.LOCKERPHYCER_URL = "http://lockerphycer.test:8092";
    jest.isolateModules(() => {
      proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  function stubFetch(me: { email: string; workspace_id?: string | null } | null) {
    return jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/me")) {
        return me === null
          ? new Response("{}", { status: 401 })
          : new Response(JSON.stringify({ id: "u1", ...me }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    });
  }

  const fabricCalls = (spy: jest.SpyInstance) => spy.mock.calls.filter(([url]) => String(url).startsWith("http://fabric.test"));
  const sent = (call: unknown[]) => new Headers((call[1] as RequestInit).headers);
  const customerA = { email: "a@example.com", workspace_id: "ws-A" };

  it("refuses the owner's join command to a customer and never calls the fabric", async () => {
    const spy = stubFetch(customerA);
    const res = await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/enrollment", {
      headers: { authorization: "Bearer a" },
    }));
    expect(res.status).toBe(403);
    expect(fabricCalls(spy)).toHaveLength(0);
  });

  it("routes a customer's policy change to its own workspace, never with the owner token", async () => {
    const spy = stubFetch(customerA);
    const res = await proxyModule.PUT(new NextRequest("https://veklom.com/api/computless/fabric/policy", {
      method: "PUT", headers: { authorization: "Bearer a", "content-type": "application/json" }, body: '{"cloud_enabled":true}',
    }));
    expect(res.status).toBe(200);
    const [call] = fabricCalls(spy);
    expect(String(call[0])).toBe("http://fabric.test:3000/api/fabric/t/policy");
    expect(sent(call).get("authorization")).toBe("Bearer service-token-test");
    expect(sent(call).get("x-veklom-workspace")).toBe("ws-A");
  });

  it("uses the session's workspace and ignores one supplied by the browser", async () => {
    const spy = stubFetch(customerA);
    await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/state", {
      headers: { authorization: "Bearer a", "x-veklom-workspace": "ws-B" },
    }));
    const [call] = fabricCalls(spy);
    expect(String(call[0])).toBe("http://fabric.test:3000/api/fabric/t/state");
    expect(sent(call).get("x-veklom-workspace")).toBe("ws-A");
  });

  it("lets a customer mint its own setup key and revoke its own machine", async () => {
    const spy = stubFetch(customerA);
    await proxyModule.POST(new NextRequest("https://veklom.com/api/computless/fabric/enrollment-keys", {
      method: "POST", headers: { authorization: "Bearer a" }, body: "{}",
    }));
    await proxyModule.PUT(new NextRequest("https://veklom.com/api/computless/fabric/workers/wkr_123/revoke", {
      method: "PUT", headers: { authorization: "Bearer a" }, body: "{}",
    }));
    expect(fabricCalls(spy).map(([u]) => String(u))).toEqual([
      "http://fabric.test:3000/api/fabric/t/enrollment-keys",
      "http://fabric.test:3000/api/fabric/t/workers/wkr_123/revoke",
    ]);
  });

  it("refuses a customer whose session has no workspace", async () => {
    const spy = stubFetch({ email: "nows@example.com", workspace_id: null });
    const res = await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/state", {
      headers: { authorization: "Bearer n" },
    }));
    expect(res.status).toBe(403);
    expect(fabricCalls(spy)).toHaveLength(0);
  });

  it("refuses without a live session", async () => {
    const spy = stubFetch(null);
    const res = await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/state", {
      headers: { authorization: "Bearer expired" },
    }));
    expect(res.status).toBe(401);
    expect(fabricCalls(spy)).toHaveLength(0);
  });

  it("lets a listed owner reach the owner fabric with the owner token attached server-side", async () => {
    const spy = stubFetch({ email: "owner@example.com", workspace_id: "ws-owner" });
    const res = await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/enrollment", {
      headers: { authorization: "Bearer owner-session" },
    }));
    expect(res.status).toBe(200);
    const [call] = fabricCalls(spy);
    expect(String(call[0])).toBe("http://fabric.test:3000/api/fabric/enrollment");
    expect(sent(call).get("authorization")).toBe("Bearer owner-token-test");
  });

  it("fails closed when no owner list is configured, and rejects unusable workspaces", () => {
    expect(isFabricOwner({ email: "owner@example.com" }, parseFabricOwners(""))).toBe(false);
    expect(isFabricOwner({ email: "owner@example.com" }, parseFabricOwners(undefined))).toBe(false);
    expect(isFabricOwner(null, parseFabricOwners("owner@example.com"))).toBe(false);
    expect(isFabricOwner({ email: " OWNER@example.com " }, parseFabricOwners("owner@example.com"))).toBe(true);
    expect(principalWorkspace({ workspace_id: "__owner__" })).toBeNull();
    expect(principalWorkspace({ workspace_id: "ws/../x" })).toBeNull();
    expect(principalWorkspace({})).toBeNull();
    expect(principalWorkspace({ workspace_id: "ws-A" })).toBe("ws-A");
  });
});
