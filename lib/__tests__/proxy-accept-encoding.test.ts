/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

// Browsers advertise zstd. If the proxy forwards that, upstreams answer in zstd,
// Node 20's fetch cannot decode it, and the proxy (which drops content-encoding)
// hands the browser raw compressed bytes labelled as JSON. The mount page then
// reports "malformed JSON" for the capability catalog.
describe("proxy never forwards the browser's Accept-Encoding", () => {
  let proxyModule: ProxyModule;
  const saved = process.env.LOCKERPHYCER_URL;

  beforeAll(() => {
    process.env.LOCKERPHYCER_URL = "http://lockerphycer.test:8092";
    jest.isolateModules(() => {
      proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(() => {
    if (saved === undefined) delete process.env.LOCKERPHYCER_URL;
    else process.env.LOCKERPHYCER_URL = saved;
  });

  it("drops accept-encoding so Node negotiates an encoding it can decode", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    );
    await proxyModule.GET(new NextRequest("https://veklom.com/api/v1/auth/me", {
      headers: { authorization: "Bearer operator-token", "accept-encoding": "gzip, deflate, br, zstd" },
    }));
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).get("accept-encoding")).toBeNull();
  });
});
