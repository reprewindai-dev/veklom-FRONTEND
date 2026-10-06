// components/Shell redirected to /login whenever the profile was missing,
// including after a transient /auth/me failure. It must redirect only on a
// definite sign-out and otherwise keep the session and show a retry.

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

const mockReplace = jest.fn();
let mockAuthState: Record<string, unknown> = {};

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/dashboard",
}));
jest.mock("@/lib/auth-context", () => ({
  useAuth: () => mockAuthState,
}));
jest.mock("@/components/Logo", () => ({
  LogoWordmark: () => null,
  LogoMark: () => null,
}));

import Shell from "@/components/Shell";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <Shell>
        <p>private content</p>
      </Shell>,
    );
  });
  return container;
}

const base = {
  sub: undefined,
  tier: "free",
  logout: jest.fn(),
  refresh: jest.fn(async () => {}),
  login: jest.fn(),
  signup: jest.fn(),
  loginWithGithub: jest.fn(),
};

beforeEach(() => {
  mockReplace.mockClear();
  base.refresh.mockClear();
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
});

describe("Shell session gate", () => {
  it("redirects to /login only on a definite sign-out", async () => {
    mockAuthState = { ...base, me: undefined, loading: false, signedOut: true, error: undefined };
    const el = await render();
    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(el.textContent).not.toContain("private content");
  });

  it("keeps the session and shows a retry when the profile failed transiently", async () => {
    mockAuthState = { ...base, me: undefined, loading: false, signedOut: false, error: "LockerPhycer authentication unavailable" };
    const el = await render();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(el.textContent).toContain("Session check failed");
    expect(el.textContent).toContain("LockerPhycer authentication unavailable");
    expect(el.textContent).toContain("nothing was signed out");

    const retry = el.querySelector("button");
    expect(retry?.textContent).toContain("Retry");
    await act(async () => {
      retry!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(base.refresh).toHaveBeenCalledTimes(1);
  });

  it("does not redirect while the profile is still loading", async () => {
    mockAuthState = { ...base, me: undefined, loading: true, signedOut: false };
    await render();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("renders the shell for a signed-in operator", async () => {
    mockAuthState = { ...base, me: { id: "u1", email: "operator@example.com" }, loading: false, signedOut: false };
    const el = await render();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(el.textContent).toContain("operator@example.com");
    expect(el.textContent).toContain("private content");
  });
});
