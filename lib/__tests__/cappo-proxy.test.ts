/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

describe("CAPPO proxy boundary", () => {
  let proxyModule: ProxyModule;
  const originalBackendUrl = process.env.CAPPO_BACKEND_URL;
  const originalApiKey = process.env.CAPPO_API_KEY;

  beforeAll(() => {
    process.env.CAPPO_BACKEND_URL = "https://cappo.test";
    process.env.CAPPO_API_KEY = "server-cappo-key";
    jest.isolateModules(() => {
      proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule;
    });
  });

  afterAll(() => {
    if (originalBackendUrl === undefined) delete process.env.CAPPO_BACKEND_URL;
    else process.env.CAPPO_BACKEND_URL = originalBackendUrl;
    if (originalApiKey === undefined) delete process.env.CAPPO_API_KEY;
    else process.env.CAPPO_API_KEY = originalApiKey;
  });

  it("refuses an unlisted CAPPO path without contacting an upstream", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/not-allowlisted", {
      method: "GET",
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("requires a validated BYOS session and never forwards its bearer to CAPPO", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "invalid token" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/runs", {
      method: "GET",
      headers: {
        authorization: "Bearer byos-session-token",
        cookie: "veklom.session=present",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(401);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://api.veklom.com/api/v1/auth/me");
    expect(fetchSpy.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      headers: expect.any(Headers),
    }));
    fetchSpy.mockRestore();
  });
});
