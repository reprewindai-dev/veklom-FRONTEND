/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

// ABIDE (wiring W-06) compiles blueprints and grants nothing: the proxy requires a
// live LockerPhycer session but never forwards the caller's credentials to it.
describe("ABIDE blueprint proxy", () => {
  let proxyModule: ProxyModule;
  const saved = { abide: process.env.ABIDE_URL, locker: process.env.LOCKERPHYCER_URL };

  beforeAll(() => {
    process.env.ABIDE_URL = "http://abide.test:8010";
    process.env.LOCKERPHYCER_URL = "http://lockerphycer.test:8092";
    jest.isolateModules(() => {
      proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => {
    for (const [key, value] of [["ABIDE_URL", saved.abide], ["LOCKERPHYCER_URL", saved.locker]] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  function stubFetch(meStatus: number) {
    return jest.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/v1/auth/me")) return new Response("{}", { status: meStatus });
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    });
  }

  it("refuses without a live session and never reaches ABIDE", async () => {
    const fetchSpy = stubFetch(401);
    const response = await proxyModule.POST(new NextRequest("https://veklom.com/api/abide/v1/blueprint/compile", {
      method: "POST", headers: { authorization: "Bearer expired" }, body: "{}",
    }));
    expect(response.status).toBe(401);
    expect(fetchSpy.mock.calls.some(([url]) => String(url).startsWith("http://abide.test"))).toBe(false);
  });

  it("forwards to ABIDE without the caller's credentials", async () => {
    const fetchSpy = stubFetch(200);
    const response = await proxyModule.POST(new NextRequest("https://veklom.com/api/abide/v1/blueprint/compile", {
      method: "POST", headers: { authorization: "Bearer operator", cookie: "s=1", "content-type": "application/json" }, body: "{}",
    }));
    expect(response.status).toBe(200);
    const call = fetchSpy.mock.calls.find(([url]) => String(url).startsWith("http://abide.test"));
    expect(String(call?.[0])).toBe("http://abide.test:8010/v1/blueprint/compile");
    const forwarded = new Headers((call?.[1] as RequestInit).headers);
    expect(forwarded.get("authorization")).toBeNull();
    expect(forwarded.get("cookie")).toBeNull();
  });
});
