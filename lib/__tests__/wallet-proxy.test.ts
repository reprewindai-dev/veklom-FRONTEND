/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";
import { buildWalletBindingMessage, SIWE_STATEMENT } from "@/lib/wallet/siwe";

type ProxyModule = typeof import("@/app/api/[...proxy]/route");

describe("wallet routes through the LockerPhycer proxy", () => {
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

  it("refuses a wallet call without the operator bearer and never substitutes the service secret", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch");
    const response = await proxyModule.GET(new NextRequest("https://veklom.com/api/v1/wallet", { method: "GET" }));
    expect(response.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("forwards the operator bearer to LockerPhycer", async () => {
    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ wallet: null }), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const response = await proxyModule.POST(new NextRequest("https://veklom.com/api/v1/wallet/nonce", {
      method: "POST",
      headers: { authorization: "Bearer operator-token", "content-type": "application/json" },
      body: "{}",
    }));
    expect(response.status).toBe(200);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://lockerphycer.test:8092/api/v1/wallet/nonce");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer operator-token");
  });
});

describe("wallet binding message", () => {
  it("is an EIP-4361 message for the configured chain", () => {
    const text = buildWalletBindingMessage({
      address: "0x1234567890AbcdEF1234567890aBcdef12345678",
      chainId: 84532,
      nonce: "abcdef0123456789",
      domain: "veklom.com",
      uri: "https://veklom.com",
      issuedAt: new Date("2026-09-30T12:00:00.000Z"),
    });
    const lines = text.split("\n");
    expect(lines[0]).toBe("veklom.com wants you to sign in with your Ethereum account:");
    expect(lines[3]).toBe(SIWE_STATEMENT);
    expect(text).toContain("\nChain ID: 84532\n");
    expect(text).toContain("\nNonce: abcdef0123456789\n");
    expect(text).toContain("\nExpiration Time: 2026-09-30T12:10:00.000Z");
  });
});
