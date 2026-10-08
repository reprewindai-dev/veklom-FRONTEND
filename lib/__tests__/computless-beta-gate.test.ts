/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { inFabricBeta, parseFabricBeta } from "@/lib/computless-proxy-paths";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

// Limited beta: with FABRIC_BETA_EMAILS set, only listed accounts (and listed owners) reach
// Private Cloud; every other account is refused before any fabric call.
describe("Private Cloud limited beta", () => {
  let proxyModule: ProxyModule;
  const keys = ["COMPUTLESS_URL", "FABRIC_OWNER_TOKEN", "FABRIC_SERVICE_TOKEN", "FABRIC_OWNER_EMAILS", "FABRIC_BETA_EMAILS", "LOCKERPHYCER_URL"] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

  beforeAll(() => {
    process.env.COMPUTLESS_URL = "http://fabric.test:3000";
    process.env.FABRIC_OWNER_TOKEN = "owner-token-test";
    process.env.FABRIC_SERVICE_TOKEN = "service-token-test";
    process.env.FABRIC_OWNER_EMAILS = "owner@example.com";
    process.env.FABRIC_BETA_EMAILS = "Beta@Example.com";
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

  function stubFetch(me: { email: string; workspace_id?: string | null }) {
    return jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).endsWith("/api/v1/auth/me")) {
        return new Response(JSON.stringify({ id: "u1", ...me }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    });
  }
  const fabricCalls = (spy: jest.SpyInstance) => spy.mock.calls.filter(([url]) => String(url).startsWith("http://fabric.test"));
  const get = (path: string) => new NextRequest(`https://veklom.com/api/computless${path}`, { headers: { authorization: "Bearer s" } });
  const post = (path: string) => new NextRequest(`https://veklom.com/api/computless${path}`, {
    method: "POST", headers: { authorization: "Bearer s", "content-type": "application/json" }, body: "{}",
  });

  it("refuses an account outside the beta on every Private Cloud route, with no fabric call", async () => {
    const spy = stubFetch({ email: "stranger@example.com", workspace_id: "ws-S" });
    for (const res of [
      await proxyModule.GET(get("/fabric/state")),
      await proxyModule.POST(post("/fabric/enrollment-keys")),
      await proxyModule.POST(post("/fabric/jobs")),
    ]) {
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "PRIVATE_CLOUD_BETA_ONLY" });
    }
    expect(fabricCalls(spy)).toHaveLength(0);
  });

  it("lets a beta account reach its own workspace", async () => {
    const spy = stubFetch({ email: "beta@example.com", workspace_id: "ws-B" });
    const res = await proxyModule.GET(get("/fabric/state"));
    expect(res.status).toBe(200);
    const [call] = fabricCalls(spy);
    expect(String(call[0])).toBe("http://fabric.test:3000/api/fabric/t/state");
  });

  it("does not shut the owner out", async () => {
    const spy = stubFetch({ email: "owner@example.com", workspace_id: "ws-O" });
    expect((await proxyModule.GET(get("/fabric/state"))).status).toBe(200);
    expect(String(fabricCalls(spy)[0][0])).toBe("http://fabric.test:3000/api/fabric/state");
  });

  it("is open when unset and admits nobody when set but empty", () => {
    expect(inFabricBeta({ email: "a@example.com" }, parseFabricBeta(undefined))).toBe(true);
    expect(inFabricBeta({ email: "a@example.com" }, parseFabricBeta(""))).toBe(false);
    expect(inFabricBeta({ email: " A@example.com " }, parseFabricBeta("a@example.com"))).toBe(true);
    expect(inFabricBeta(null, parseFabricBeta("a@example.com"))).toBe(false);
  });
});
