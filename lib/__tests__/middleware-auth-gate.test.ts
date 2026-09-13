/**
 * @jest-environment node
 *
 * Browser navigation to the Capability OS is public, while private API and
 * administrative surfaces remain gated.
 */
import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

jest.mock("../../lib/interlink-capi/edge", () => ({
  getExecutionIdentity: jest.fn(async () => null),
  hasRequiredCapabilities: jest.fn(() => ({ missing: [] as string[] })),
}));

function navigation(path: string, cookie?: string) {
  return new NextRequest(`https://control.veklom.com${path}`, {
    headers: {
      "sec-fetch-mode": "navigate",
      accept: "text/html,application/xhtml+xml",
      ...(cookie ? { cookie } : {}),
    },
  });
}

function apiCall(path: string, authorization?: string) {
  return new NextRequest(`https://control.veklom.com${path}`, {
    headers: {
      accept: "application/json",
      ...(authorization ? { authorization } : {}),
    },
  });
}

describe("middleware auth gate", () => {
  it("allows a cold client to navigate to /os", async () => {
    const response = await middleware(navigation("/os"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows a cold client to navigate to an /os child route", async () => {
    const response = await middleware(navigation("/os/mount"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("leaves /proof ungated", async () => {
    const response = await middleware(navigation("/proof"));
    expect(response.status).not.toBe(401);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows a navigation carrying the session marker", async () => {
    const response = await middleware(navigation("/os", "veklom.session=present"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("still rejects an API call without a Bearer token", async () => {
    const response = await middleware(apiCall("/api/private/thing"));
    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toBe("Bearer");
  });

  it("does not accept the session marker in place of a Bearer token on API calls", async () => {
    const request = new NextRequest("https://control.veklom.com/api/private/thing", {
      headers: { accept: "application/json", cookie: "veklom.session=present" },
    });
    const response = await middleware(request);
    expect(response.status).toBe(401);
  });

  it("leaves public surfaces ungated", async () => {
    const response = await middleware(navigation("/dev"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
