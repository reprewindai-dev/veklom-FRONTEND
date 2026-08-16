/**
 * @jest-environment node
 *
 * The /os gate must be satisfiable by a browser. A Bearer header cannot be attached
 * to a top-level navigation, so navigations are gated on the session marker cookie
 * and API calls are gated on the header.
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
  it("redirects an unauthenticated navigation to /login with returnTo", async () => {
    const response = await middleware(navigation("/os/mount"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") as string);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("returnTo")).toBe("/os/mount");
  });

  it("does not answer a navigation with 401, which a browser could never satisfy", async () => {
    const response = await middleware(navigation("/os"));
    expect(response.status).not.toBe(401);
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
