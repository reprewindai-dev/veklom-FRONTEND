// A 401/403 from a non-identity service must never navigate the browser.
// Signed-in operators were bounced to /login (and earlier to a non-existent
// /governance page) by any CAPPO/cAPI/PGL answer whose message mentioned
// "auth" or "token", while the LockerPhycer session was still valid.

import { readFileSync } from "fs";
import { join } from "path";
import { api, ApiError, isIdentityRoute, SESSION_INVALID_EVENT } from "../api";

function mockResponse(body: unknown, status: number): Response {
  return {
    body: null,
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null) },
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    text: async () => JSON.stringify(body),
  } as Response;
}

// jsdom's window.location cannot be replaced, and jsdom does not implement
// cross-document navigation: every attempt is reported through the virtual
// console as "Not implemented: navigation". Record those reports.
const navigations: string[] = [];
let consoleError: jest.SpyInstance;

beforeAll(() => {
  window.history.replaceState({}, "", "/os/onboarding");
  consoleError = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    const text = args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(" ");
    if (/not implemented: navigation/i.test(text)) navigations.push(text);
  });
});

afterAll(() => {
  consoleError.mockRestore();
});

describe("navigation detector", () => {
  it("records a navigation attempt (proves the assertions below can fail)", () => {
    navigations.length = 0;
    window.location.href = "/login";
    expect(navigations).toHaveLength(1);
    expect(window.location.pathname).toBe("/os/onboarding");
    navigations.length = 0;
  });
});

describe("api(): 401/403 handling never navigates", () => {
  const sessionInvalid = jest.fn();

  beforeEach(() => {
    navigations.length = 0;
    sessionInvalid.mockClear();
    window.localStorage.clear();
    window.localStorage.setItem("veklom.access_token", "valid-session-token");
    window.addEventListener(SESSION_INVALID_EVENT, sessionInvalid);
    Object.defineProperty(global, "fetch", { configurable: true, writable: true, value: jest.fn() });
  });

  afterEach(() => {
    window.removeEventListener(SESSION_INVALID_EVENT, sessionInvalid);
    delete (global as { fetch?: typeof fetch }).fetch;
  });

  it("throws a CAPPO 401 AUTHENTICATION_REQUIRED to the caller on a private page", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ error: "AUTHENTICATION_REQUIRED" }, 401));

    const error = await api("/api/cappo/v1/capability/mounts", { method: "POST", body: {} }).catch((caught) => caught);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401, message: "AUTHENTICATION_REQUIRED", path: "/api/cappo/v1/capability/mounts" });
    expect(navigations).toEqual([]);
    expect(sessionInvalid).not.toHaveBeenCalled();
  });

  it("throws a cAPI 403 'Not authenticated' without signing out", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ detail: "Not authenticated" }, 403));

    await expect(api("/api/capi/interlink/capability/packages")).rejects.toMatchObject({ status: 403 });
    expect(navigations).toEqual([]);
    expect(sessionInvalid).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("veklom.access_token")).toBe("valid-session-token");
  });

  it("throws a PGL 503 'ledger proxy is not configured' as a plain ApiError", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ error: "PGL ledger proxy is not configured" }, 503));

    await expect(api("/api/pgl/agents/", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 503,
      message: "PGL ledger proxy is not configured",
    });
    expect(navigations).toEqual([]);
    expect(sessionInvalid).not.toHaveBeenCalled();
  });

  it("throws a VLink 401 whose message mentions credentials without navigating", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ message: "invalid credentials" }, 401));

    await expect(api("/api/v1/vlinks/abc")).rejects.toMatchObject({ status: 401 });
    expect(navigations).toEqual([]);
    expect(sessionInvalid).not.toHaveBeenCalled();
  });

  it("signals sign-out only when the identity authority rejects the presented bearer with 401", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ error: { code: 401, message: "Invalid token" } }, 401));

    await expect(api("/api/v1/auth/me")).rejects.toMatchObject({ status: 401, message: "Invalid token" });
    expect(navigations).toEqual([]);
    expect(sessionInvalid).toHaveBeenCalledTimes(1);
    const detail = (sessionInvalid.mock.calls[0][0] as CustomEvent).detail;
    expect(detail).toEqual({ path: "/api/v1/auth/me", status: 401, message: "Invalid token" });
    // Clearing the session is the auth context's job, not the transport's.
    expect(window.localStorage.getItem("veklom.access_token")).toBe("valid-session-token");
  });

  it("signals sign-out for an identity 401 whose message mentions a token, not a missing-key intervention", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ detail: "Token has been revoked" }, 401));

    await expect(api("/api/v1/workspace")).rejects.toMatchObject({ status: 401, message: "Token has been revoked" });
    expect(sessionInvalid).toHaveBeenCalledTimes(1);
    expect(navigations).toEqual([]);
  });

  it("never navigates for a CAPPO 403 about a missing key or a forbidden workspace", async () => {
    for (const body of [{ detail: "Missing API key" }, { detail: "workspace mismatch" }, { error: "forbidden" }]) {
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse(body, 403));
      await expect(api("/api/cappo/v1/capability/beacons")).rejects.toMatchObject({ status: 403 });
    }
    expect(navigations).toEqual([]);
    expect(sessionInvalid).not.toHaveBeenCalled();
  });

  it("does not signal sign-out for an identity 403 (no bearer presented)", async () => {
    window.localStorage.clear();
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ error: { code: 403, message: "Not authenticated" } }, 403));

    await expect(api("/api/v1/auth/me")).rejects.toMatchObject({ status: 403 });
    expect(sessionInvalid).not.toHaveBeenCalled();
    expect(navigations).toEqual([]);
  });

  it("does not signal sign-out for an unauthenticated identity request such as a failed login", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse({ error: { code: 401, message: "Invalid credentials" } }, 401));

    await expect(api("/api/v1/auth/login", { unauth: true, body: { email: "a@b.c", password: "x" } })).rejects.toMatchObject({ status: 401 });
    expect(sessionInvalid).not.toHaveBeenCalled();
    expect(navigations).toEqual([]);
  });

  it("ignores a 401 for a bearer that was replaced while the request was in flight", async () => {
    (global.fetch as jest.Mock).mockImplementation(async () => {
      window.localStorage.setItem("veklom.access_token", "fresh-token-after-login");
      return mockResponse({ error: { code: 401, message: "Invalid token" } }, 401);
    });

    await expect(api("/api/v1/auth/me")).rejects.toMatchObject({ status: 401 });
    expect(sessionInvalid).not.toHaveBeenCalled();
  });
});

describe("identity route classification", () => {
  it("treats LockerPhycer auth and workspace routes as identity routes", () => {
    expect(isIdentityRoute("/api/v1/auth/me")).toBe(true);
    expect(isIdentityRoute("/api/v1/workspace")).toBe(true);
    expect(isIdentityRoute("/api/v1/workspace/abc?x=1")).toBe(true);
    expect(isIdentityRoute("http://localhost/api/v1/auth/me")).toBe(true);
  });

  it("does not treat CAPPO, cAPI, PGL, VLink or wallet routes as identity routes", () => {
    for (const path of [
      "/api/cappo/v1/capability/mounts",
      "/api/capi/interlink/capability/packages",
      "/api/pgl/agents/",
      "/api/ledger/events",
      "/api/v1/vlinks/abc",
      "/api/v1/wallet",
      "/api/v1/billing/subscription",
    ]) {
      expect(isIdentityRoute(path)).toBe(false);
    }
  });
});

describe("lib/api.ts source", () => {
  it("contains no browser navigation at all", () => {
    const source = readFileSync(join(process.cwd(), "lib/api.ts"), "utf8");
    expect(source).not.toMatch(/location\.(href\s*=|assign\(|replace\()/);
    expect(source).not.toContain("/governance");
  });
});
