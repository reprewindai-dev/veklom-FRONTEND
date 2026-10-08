/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { isFabricOwner, parseFabricOwners } from "@/lib/computless-proxy-paths";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

// Private Cloud owner routes carry the fabric owner token (join command with the
// enrollment token, placement policy). A signed-in stranger must not reach them.
describe("Private Cloud owner gate", () => {
  let proxyModule: ProxyModule;
  const keys = ["COMPUTLESS_URL", "FABRIC_OWNER_TOKEN", "FABRIC_OWNER_EMAILS", "LOCKERPHYCER_URL"] as const;
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));

  beforeAll(() => {
    process.env.COMPUTLESS_URL = "http://fabric.test:3000";
    process.env.FABRIC_OWNER_TOKEN = "owner-token-test";
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

  function stubFetch(email: string | null) {
    return jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/me")) {
        return email === null
          ? new Response("{}", { status: 401 })
          : new Response(JSON.stringify({ id: "u1", email }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    });
  }

  const fabricCalls = (spy: jest.SpyInstance) => spy.mock.calls.filter(([url]) => String(url).startsWith("http://fabric.test"));

  it("refuses the join command to a signed-in account that is not an owner", async () => {
    const spy = stubFetch("stranger@example.com");
    const res = await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/enrollment", {
      headers: { authorization: "Bearer stranger" },
    }));
    expect(res.status).toBe(403);
    expect(fabricCalls(spy)).toHaveLength(0);
  });

  it("refuses a policy change from a non-owner", async () => {
    const spy = stubFetch("stranger@example.com");
    const res = await proxyModule.PUT(new NextRequest("https://veklom.com/api/computless/fabric/policy", {
      method: "PUT", headers: { authorization: "Bearer stranger", "content-type": "application/json" }, body: '{"cloud_enabled":true}',
    }));
    expect(res.status).toBe(403);
    expect(fabricCalls(spy)).toHaveLength(0);
  });

  it("lets a listed owner through with the owner token attached server-side", async () => {
    const spy = stubFetch("owner@example.com");
    const res = await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/enrollment", {
      headers: { authorization: "Bearer owner-session" },
    }));
    expect(res.status).toBe(200);
    const [call] = fabricCalls(spy);
    expect(String(call[0])).toBe("http://fabric.test:3000/api/fabric/enrollment");
    expect(new Headers((call[1] as RequestInit).headers).get("authorization")).toBe("Bearer owner-token-test");
  });

  it("still lets any signed-in account read fabric state (no owner token sent)", async () => {
    const spy = stubFetch("stranger@example.com");
    const res = await proxyModule.GET(new NextRequest("https://veklom.com/api/computless/fabric/state", {
      headers: { authorization: "Bearer stranger" },
    }));
    expect(res.status).toBe(200);
    const [call] = fabricCalls(spy);
    expect(new Headers((call[1] as RequestInit).headers).get("authorization")).toBeNull();
  });

  it("fails closed when no owner list is configured", () => {
    expect(isFabricOwner({ email: "owner@example.com" }, parseFabricOwners(""))).toBe(false);
    expect(isFabricOwner({ email: "owner@example.com" }, parseFabricOwners(undefined))).toBe(false);
    expect(isFabricOwner(null, parseFabricOwners("owner@example.com"))).toBe(false);
    expect(isFabricOwner({ email: " OWNER@example.com " }, parseFabricOwners("owner@example.com"))).toBe(true);
  });
});
