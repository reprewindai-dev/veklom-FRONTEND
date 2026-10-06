/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

// The proxy must never turn an anonymous LockerPhycer call into a service-authenticated
// one. LOCKERPHYCER_SECRET_KEY is Identity's JWT signing key; it is not a bearer.
describe("LockerPhycer proxy never substitutes the service secret", () => {
  let proxyModule: ProxyModule;
  const saved = { url: process.env.LOCKERPHYCER_URL, secret: process.env.LOCKERPHYCER_SECRET_KEY };

  beforeAll(() => {
    process.env.LOCKERPHYCER_URL = "http://lockerphycer.test:8092";
    process.env.LOCKERPHYCER_SECRET_KEY = "service-secret";
    jest.isolateModules(() => {
      proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => {
    if (saved.url === undefined) delete process.env.LOCKERPHYCER_URL;
    else process.env.LOCKERPHYCER_URL = saved.url;
    if (saved.secret === undefined) delete process.env.LOCKERPHYCER_SECRET_KEY;
    else process.env.LOCKERPHYCER_SECRET_KEY = saved.secret;
  });

  function upstreamOk() {
    return jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );
  }

  it.each(["/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/locker/status", "/api/v1/workspace"])(
    "forwards anonymous %s with no Authorization header at all",
    async (path) => {
      const fetchSpy = upstreamOk();
      const response = await proxyModule.POST(new NextRequest(`https://veklom.com${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }));
      expect(response.status).toBe(200);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`http://lockerphycer.test:8092${path}`);
      const forwarded = new Headers(init.headers);
      expect(forwarded.get("authorization")).toBeNull();
      expect(JSON.stringify([...forwarded.entries()])).not.toContain("service-secret");
    },
  );

  it("forwards the caller's own bearer unchanged", async () => {
    const fetchSpy = upstreamOk();
    await proxyModule.GET(new NextRequest("https://veklom.com/api/v1/auth/me", {
      headers: { authorization: "Bearer operator-token" },
    }));
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer operator-token");
  });
});
