/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

describe("PGL server adapter boundary", () => {
  const originalUrl = process.env.PGL_URL;
  const originalKey = process.env.PGL_LEDGER_API_KEY;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  afterAll(() => {
    if (originalUrl === undefined) delete process.env.PGL_URL;
    else process.env.PGL_URL = originalUrl;
    if (originalKey === undefined) delete process.env.PGL_LEDGER_API_KEY;
    else process.env.PGL_LEDGER_API_KEY = originalKey;
  });

  it("fails closed before contacting PGL when the internal attachment is absent", async () => {
    delete process.env.PGL_URL;
    delete process.env.PGL_LEDGER_API_KEY;
    let proxyModule!: ProxyModule;
    jest.isolateModules(() => { proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule; });
    const fetchSpy = jest.spyOn(globalThis, "fetch");

    const response = await proxyModule.POST(new NextRequest(
      "https://veklom.com/api/v1/ledger/agents",
      { method: "POST", body: "{}", headers: { "content-type": "application/json" } },
    ));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "PGL evidence adapter is not configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps the canonical onboarding route and never leaks browser credentials", async () => {
    process.env.PGL_URL = "http://gnomledger-canary:8001";
    process.env.PGL_LEDGER_API_KEY = "internal-ledger-key";
    let proxyModule!: ProxyModule;
    jest.isolateModules(() => { proxyModule = require("@/app/api/[...proxy]/route") as ProxyModule; });
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(
      JSON.stringify({ agent_id: "agent-1", certificate_id: "cert-1" }),
      { status: 201, headers: { "content-type": "application/json" } },
    ));

    const response = await proxyModule.POST(new NextRequest(
      "https://veklom.com/api/v1/ledger/agents",
      {
        method: "POST",
        headers: {
          authorization: "Bearer browser-session",
          cookie: "veklom.session=present",
          "x-api-key": "browser-controlled-key",
          "content-type": "application/json",
        },
        body: JSON.stringify({ agent_name: "agent" }),
      },
    ));

    expect(response.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("http://gnomledger-canary:8001/api/v1/agents/");
    const headers = new Headers(fetchSpy.mock.calls[0]?.[1]?.headers);
    expect(headers.get("x-api-key")).toBe("internal-ledger-key");
    expect(headers.get("authorization")).toBeNull();
    expect(headers.get("cookie")).toBeNull();
  });
});
