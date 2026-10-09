// The auth context must only drop the session when the identity authority
// definitely rejected it. A transient /auth/me failure (429, 5xx, proxy 503,
// network) used to clearTokens() and drop `me`, which bounced a signed-in
// operator to /login seconds after a successful login.

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AuthProvider, isDefiniteSignOut, PROFILE_RETRY_DELAY_MS, useAuth } from "@/lib/auth-context";
import { ApiError, SESSION_INVALID_EVENT } from "@/lib/api";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Auth = ReturnType<typeof useAuth>;
let latest: Auth | null = null;

function Probe() {
  const auth = useAuth();
  // Published after commit (inside act), not during render, so render stays pure.
  React.useEffect(() => {
    latest = auth;
  });
  return null;
}

function jsonResponse(body: unknown, status: number): Response {
  return {
    body: null,
    headers: { get: (name: string) => (name.toLowerCase() === "content-type" ? "application/json" : null) },
    ok: status >= 200 && status < 300,
    status,
    statusText: "",
    text: async () => JSON.stringify(body),
  } as Response;
}

const ME = { id: "u1", email: "operator@example.com", workspace_id: "ws-1" };

/** Queue of /auth/me answers; everything else is a 404 from the proxy table. */
function installFetch(meAnswers: Array<[unknown, number]>) {
  const calls: string[] = [];
  const fetchMock = jest.fn(async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/api/v1/auth/me")) {
      const next = meAnswers.shift();
      if (!next) throw new Error("unexpected extra /auth/me call");
      return jsonResponse(next[0], next[1]);
    }
    return jsonResponse({ error: "Route not found in proxy table" }, 404);
  });
  Object.defineProperty(global, "fetch", { configurable: true, writable: true, value: fetchMock });
  return calls;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function mountProvider() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
  });
}

async function runRetry() {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(PROFILE_RETRY_DELAY_MS);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  latest = null;
  window.localStorage.clear();
  window.history.replaceState({}, "", "/os/onboarding");
});

afterEach(async () => {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
  }
  container?.remove();
  root = null;
  container = null;
  jest.useRealTimers();
  delete (global as { fetch?: typeof fetch }).fetch;
});

describe("AuthProvider session handling", () => {
  it("keeps the tokens and retries once when /auth/me answers 429", async () => {
    window.localStorage.setItem("veklom.access_token", "session-token");
    const calls = installFetch([
      [{ detail: "Too many requests" }, 429],
      [ME, 200],
    ]);

    await mountProvider();
    expect(latest?.loading).toBe(true);
    expect(latest?.signedOut).toBe(false);
    expect(window.localStorage.getItem("veklom.access_token")).toBe("session-token");

    await runRetry();
    expect(latest?.loading).toBe(false);
    expect(latest?.me?.email).toBe(ME.email);
    expect(latest?.signedOut).toBe(false);
    expect(latest?.error).toBeUndefined();
    expect(calls.filter((url) => url.includes("/api/v1/auth/me"))).toHaveLength(2);
  });

  it("surfaces a transient error after the retry without dropping the session", async () => {
    window.localStorage.setItem("veklom.access_token", "session-token");
    installFetch([
      [{ error: "LockerPhycer authentication unavailable" }, 503],
      [{ error: "LockerPhycer authentication unavailable" }, 503],
    ]);

    await mountProvider();
    await runRetry();

    expect(latest?.loading).toBe(false);
    expect(latest?.signedOut).toBe(false);
    expect(latest?.error).toBe("LockerPhycer authentication unavailable");
    expect(window.localStorage.getItem("veklom.access_token")).toBe("session-token");
  });

  it("keeps the previous profile when a refresh fails transiently", async () => {
    window.localStorage.setItem("veklom.access_token", "session-token");
    installFetch([
      [ME, 200],
      [{ error: "Gateway Proxy Error" }, 502],
      [{ error: "Gateway Proxy Error" }, 502],
    ]);

    await mountProvider();
    expect(latest?.me?.email).toBe(ME.email);

    await act(async () => {
      await latest!.refresh();
    });
    await runRetry();

    expect(latest?.me?.email).toBe(ME.email);
    expect(latest?.signedOut).toBe(false);
    expect(latest?.error).toBe("Gateway Proxy Error");
    expect(window.localStorage.getItem("veklom.access_token")).toBe("session-token");
  });

  it("drops the session when LockerPhycer answers 401 Invalid token", async () => {
    window.localStorage.setItem("veklom.access_token", "expired-token");
    installFetch([[{ error: { code: 401, message: "Invalid token" } }, 401]]);

    await mountProvider();

    expect(latest?.loading).toBe(false);
    expect(latest?.signedOut).toBe(true);
    expect(latest?.me).toBeUndefined();
    expect(latest?.error).toBeUndefined();
    expect(window.localStorage.getItem("veklom.access_token")).toBeNull();
  });

  it("treats 403 Not authenticated (no bearer presented) as signed out", async () => {
    installFetch([[{ error: { code: 403, message: "Not authenticated" } }, 403]]);

    await mountProvider();

    expect(latest?.signedOut).toBe(true);
    expect(latest?.me).toBeUndefined();
  });

  it("drops the session when the transport signals the identity authority rejected the bearer", async () => {
    window.localStorage.setItem("veklom.access_token", "session-token");
    installFetch([[ME, 200]]);

    await mountProvider();
    expect(latest?.me?.email).toBe(ME.email);

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent(SESSION_INVALID_EVENT, { detail: { path: "/api/v1/workspace", status: 401, message: "Invalid token" } }),
      );
    });

    expect(latest?.me).toBeUndefined();
    expect(latest?.signedOut).toBe(true);
    expect(window.localStorage.getItem("veklom.access_token")).toBeNull();
  });
});

describe("isDefiniteSignOut", () => {
  it("accepts only the identity authority's rejections", () => {
    expect(isDefiniteSignOut(new ApiError(401, "Invalid token"))).toBe(true);
    expect(isDefiniteSignOut(new ApiError(403, "Not authenticated"))).toBe(true);
    expect(isDefiniteSignOut(new ApiError(403, "Forbidden"))).toBe(false);
    expect(isDefiniteSignOut(new ApiError(429, "Too many requests"))).toBe(false);
    expect(isDefiniteSignOut(new ApiError(503, "LockerPhycer backend is not configured"))).toBe(false);
    expect(isDefiniteSignOut(new ApiError(undefined, "Failed to fetch", undefined, "network"))).toBe(false);
    expect(isDefiniteSignOut(new Error("timeout"))).toBe(false);
  });
});
