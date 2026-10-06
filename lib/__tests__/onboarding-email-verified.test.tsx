// Onboarding read `me.is_verified`, a field LockerPhycer's /api/v1/auth/me
// never returns, so every signed-in operator saw "Email not yet verified"
// although login is refused until the email is verified.

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { isEmailVerified } from "@/lib/auth-context";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/os/onboarding",
}));
jest.mock("@/components/cos/OnboardingChecklist", () => ({ OnboardingChecklist: () => null }));
jest.mock("@/components/wallet/WalletStep", () => ({ WalletStep: () => null }));

import OnboardingPage from "@/app/os/onboarding/page";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function renderWithMe(me: Record<string, unknown>) {
  Object.defineProperty(global, "fetch", {
    configurable: true,
    writable: true,
    value: jest.fn(async (input: string | URL | Request) =>
      String(input).includes("/api/v1/auth/me") ? jsonResponse(me, 200) : jsonResponse({ error: "not found" }, 404),
    ),
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<OnboardingPage />);
  });
  return container.querySelector('[data-testid="verification-state"]')?.textContent;
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("veklom.access_token", "session-token");
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
  delete (global as { fetch?: typeof fetch }).fetch;
});

// The shape LockerPhycer's UserResponse returns today: no verification flag.
const LIVE_ME = {
  id: "u1",
  email: "operator@example.com",
  workspace_id: null,
  role: "owner",
  status: "active",
  mfa_enabled: false,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  last_login: "2026-10-06T00:00:00Z",
};

describe("onboarding verification state", () => {
  it("shows an active LockerPhycer account as verified", async () => {
    expect(await renderWithMe(LIVE_ME)).toBe("Verified by LockerPhycer");
  });

  it("prefers an explicit email_verified flag", async () => {
    expect(await renderWithMe({ ...LIVE_ME, email_verified: false })).toBe("Email not yet verified");
  });

  it("shows a pending account as not verified", async () => {
    expect(await renderWithMe({ ...LIVE_ME, status: "pending_verification" })).toBe("Email not yet verified");
  });
});

describe("isEmailVerified", () => {
  it("prefers email_verified, then is_verified, then an active status", () => {
    expect(isEmailVerified({ email_verified: true, status: "pending" })).toBe(true);
    expect(isEmailVerified({ email_verified: false, is_verified: true, status: "active" })).toBe(false);
    expect(isEmailVerified({ is_verified: true })).toBe(true);
    expect(isEmailVerified({ is_verified: false, status: "active" })).toBe(false);
    expect(isEmailVerified({ status: "ACTIVE" })).toBe(true);
    expect(isEmailVerified({ status: "suspended" })).toBe(false);
    expect(isEmailVerified({})).toBe(false);
    expect(isEmailVerified(null)).toBe(false);
  });
});
