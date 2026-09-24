/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

describe("CAPPO proxy boundary", () => {
  let proxyModule: ProxyModule;
  const originalBackendUrl = process.env.CAPPO_BACKEND_URL;
  const originalCapiBackendUrl = process.env.CAPI_BACKEND_URL;
  const originalCapiApiKey = process.env.CAPI_API_KEY;

  beforeAll(() => {
    process.env.CAPPO_BACKEND_URL = "https://cappo.test";
    process.env.CAPI_BACKEND_URL = "https://capi.test";
    process.env.CAPI_API_KEY = "capi-admin-key";
    jest.isolateModules(() => {
      proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    if (originalBackendUrl === undefined) delete process.env.CAPPO_BACKEND_URL;
    else process.env.CAPPO_BACKEND_URL = originalBackendUrl;
    if (originalCapiBackendUrl === undefined) delete process.env.CAPI_BACKEND_URL;
    else process.env.CAPI_BACKEND_URL = originalCapiBackendUrl;
    if (originalCapiApiKey === undefined) delete process.env.CAPI_API_KEY;
    else process.env.CAPI_API_KEY = originalCapiApiKey;
  });

  it("refuses an unlisted CAPPO path without contacting an upstream", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/not-allowlisted", {
      method: "GET",
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(404);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards identity to CAPPO without forwarding browser credentials or API keys", async () => {
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
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://cappo.test/v1/runs");
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("authorization")).toBe("Bearer byos-session-token");
    expect(upstreamHeaders.get("cookie")).toBeNull();
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
  });

  it("maps a missing workspace to 403 without contacting CAPPO", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: { error: "WORKSPACE_CONTEXT_MISSING" } }), {
        status: 403,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/runs", {
      method: "GET",
      headers: { authorization: "Bearer byos-session-token" },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      detail: { error: "WORKSPACE_CONTEXT_MISSING" },
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("forwards a bounded execution request to CAPPO without an internal key", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: "payment-required" }), {
          status: 402,
          headers: { "content-type": "application/json" },
        }),
      );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/exec", {
      method: "POST",
      headers: {
        authorization: "Bearer byos-session-token",
        "x-api-key": "browser-key-must-not-forward",
        "content-type": "application/json",
      },
      body: JSON.stringify({ capability: "demo" }),
    });

    const response = await proxyModule.POST(request);

    expect(response.status).toBe(402);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://cappo.test/v1/exec");
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
    expect(upstreamHeaders.get("authorization")).toBe("Bearer byos-session-token");
    expect(upstreamHeaders.get("cookie")).toBeNull();
  });

  it("proxies the authenticated agents collection through CAPPO", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ agents: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/api/v1/agents", {
      method: "GET",
      headers: {
        authorization: "Bearer byos-session-token",
        cookie: "veklom.session=present",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://cappo.test/api/v1/agents");
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
    expect(upstreamHeaders.get("x-workspace-id")).toBeNull();
    expect(upstreamHeaders.get("x-veklom-requester-id")).toBeNull();
    expect(upstreamHeaders.get("authorization")).toBe("Bearer byos-session-token");
    expect(upstreamHeaders.get("cookie")).toBeNull();
  });

  it("preserves CAPPO's upstream failure rather than inventing authorization", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "unavailable" }), {
          status: 503,
          headers: { "content-type": "application/json" },
        }),
      );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/runs", {
      method: "GET",
      headers: { authorization: "Bearer byos-session-token" },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "unavailable" });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://cappo.test/v1/runs");
  });

  it("forwards public CAPPO discovery paths without credentials", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ x402Version: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/.well-known/x402", {
      method: "GET",
      headers: {
        authorization: "Bearer browser-session",
        cookie: "session=present",
        "x-api-key": "browser-key",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("authorization")).toBeNull();
    expect(upstreamHeaders.get("cookie")).toBeNull();
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
  });

  it("keeps public VNP metrics credential-free", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ proofState: "measured" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/vnp/metrics", {
      method: "GET",
      headers: {
        authorization: "Bearer browser-session",
        cookie: "session=present",
        "x-workspace-id": "client-controlled-workspace",
      },
    });

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://cappo.test/v1/vnp/metrics");
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("authorization")).toBeNull();
    expect(upstreamHeaders.get("cookie")).toBeNull();
    expect(upstreamHeaders.get("x-workspace-id")).toBeNull();
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
  });

  it("passes CAPPO payment challenges through without an extra authority exchange", async () => {
    const paymentBody = JSON.stringify({ x402Version: 1, accepts: [] });
    const fetchSpy = jest.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(paymentBody, {
          status: 402,
          headers: { "content-type": "application/json", "x-payment-required": "true" },
        }),
      );
    const request = new NextRequest("https://control.veklom.com/api/cappo/v1/exec", {
      method: "POST",
      headers: { authorization: "Bearer byos-session-token" },
      body: JSON.stringify({ capability: "demo" }),
    });

    const response = await proxyModule.POST(request);

    expect(response.status).toBe(402);
    expect(await response.json()).toEqual(JSON.parse(paymentBody));
    expect(response.headers.get("x-payment-required")).toBe("true");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("https://cappo.test/v1/exec");
  });

  it("forwards Interlink bearers without a cAPI admin key", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ packages: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const request = new NextRequest(
      "https://control.veklom.com/api/capi/interlink/capability/packages",
      {
        method: "GET",
        headers: {
          authorization: "Bearer lockerphycer-session",
          "x-api-key": "browser-key-must-not-forward",
        },
      },
    );

    const response = await proxyModule.GET(request);

    expect(response.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0])
      .toBe("https://capi.test/api/v1/capi/interlink/capability/packages");
    const upstreamHeaders = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(upstreamHeaders.get("authorization")).toBe("Bearer lockerphycer-session");
    expect(upstreamHeaders.get("x-api-key")).toBeNull();
  });
});
