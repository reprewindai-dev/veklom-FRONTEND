// Onboarding step 2 dead-ended live: Continue was disabled until a workspace
// was bound, the only way forward was a separate "Bind workspace" button, and
// nothing said so. Binding is now the step's single action, the slug follows
// the name, an owned workspace is found and shown as bound, and a taken slug
// is reported inline.

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";

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

type Call = { method: string; url: string; body?: unknown };
type Route = (method: string, url: string) => [unknown, number] | undefined;

function installFetch(route: Route): Call[] {
  const calls: Call[] = [];
  Object.defineProperty(global, "fetch", {
    configurable: true,
    writable: true,
    value: jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      const url = String(input);
      calls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      const answer = route(method, url);
      return answer ? jsonResponse(answer[0], answer[1]) : jsonResponse({ detail: "Not Found" }, 404);
    }),
  });
  return calls;
}

const LIVE_ME = { id: "u1", email: "owner@example.com", status: "active", workspace_id: null };

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function renderAtWorkspaceStep() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<OnboardingPage />);
  });
  await click(button(container, "Continue"));
  expect(container.textContent).toContain("Establish the workspace");
  return container;
}

function button(el: HTMLElement, label: string): HTMLButtonElement {
  const found = Array.from(el.querySelectorAll("button")).find((candidate) => candidate.textContent?.trim() === label);
  if (!found) throw new Error(`button "${label}" not found in: ${el.textContent}`);
  return found as HTMLButtonElement;
}

function input(el: HTMLElement, label: string): HTMLInputElement {
  const found = Array.from(el.querySelectorAll("label")).find((candidate) => candidate.textContent?.startsWith(label));
  if (!found) throw new Error(`field "${label}" not found`);
  return found.querySelector("input")!;
}

async function type(target: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(target, value);
    target.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function click(target: HTMLElement) {
  await act(async () => {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem("veklom.access_token", "session-token");
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
  delete (global as { fetch?: typeof fetch }).fetch;
});

describe("onboarding workspace step", () => {
  it("fills the slug from the name as the operator types", async () => {
    installFetch((method, url) => (url.includes("/api/v1/auth/me") ? [LIVE_ME, 200] : undefined));
    const el = await renderAtWorkspaceStep();

    await type(input(el, "Name"), "Acme Ops Team");
    expect(input(el, "Slug").value).toBe("acme-ops-team");

    // A hand-edited slug sticks; clearing it hands it back to the name.
    await type(input(el, "Slug"), "acme-");
    expect(input(el, "Slug").value).toBe("acme-");
    await type(input(el, "Name"), "Acme Ops");
    expect(input(el, "Slug").value).toBe("acme-");
    await type(input(el, "Slug"), "");
    expect(input(el, "Slug").value).toBe("acme-ops");
  });

  it("binds the workspace and moves on with a single action", async () => {
    const calls = installFetch((method, url) => {
      if (url.includes("/api/v1/auth/me")) return [LIVE_ME, 200];
      if (method === "POST" && url.endsWith("/api/v1/workspace")) {
        return [{ id: "ws-new", name: "Acme Ops", slug: "acme-ops", tier: "free" }, 201];
      }
      return undefined;
    });
    const el = await renderAtWorkspaceStep();

    // No dead Continue while nothing is bound: the one action binds.
    expect(Array.from(el.querySelectorAll("button")).some((b) => b.textContent?.trim() === "Continue")).toBe(false);
    await type(input(el, "Name"), "Acme Ops");
    await click(button(el, "Bind workspace and continue"));

    const post = calls.find((call) => call.method === "POST" && call.url.endsWith("/api/v1/workspace"));
    expect(post?.body).toEqual({ name: "Acme Ops", slug: "acme-ops" });
    expect(el.textContent).toContain("Set up your wallet");
    expect(window.localStorage.getItem("veklom.workspace_id")).toBe("ws-new");
  });

  it("shows the workspace from the session token as bound and lets Continue through", async () => {
    installFetch((method, url) => (url.includes("/api/v1/auth/me") ? [{ ...LIVE_ME, workspace_id: "ws-claim" }, 200] : undefined));
    const el = await renderAtWorkspaceStep();

    expect(el.textContent).toContain("Workspace bound: ws-claim");
    expect(el.querySelector("form")).toBeNull();
    await click(button(el, "Continue"));
    expect(el.textContent).toContain("Set up your wallet");
  });

  it("finds a workspace the operator already owns via /api/v1/workspace/me", async () => {
    const calls = installFetch((method, url) => {
      if (url.includes("/api/v1/auth/me")) return [LIVE_ME, 200];
      if (method === "GET" && url.includes("/api/v1/workspace/me")) return [{ id: "ws-owned", name: "Owned", slug: "owned", tier: "free" }, 200];
      return undefined;
    });
    const el = await renderAtWorkspaceStep();

    expect(calls.some((call) => call.method === "GET" && call.url.includes("/api/v1/workspace/me"))).toBe(true);
    expect(el.textContent).toContain("Workspace bound: ws-owned");
    expect(button(el, "Continue").disabled).toBe(false);
  });

  it("reports a taken slug inline and stays on the step", async () => {
    installFetch((method, url) => {
      if (url.includes("/api/v1/auth/me")) return [LIVE_ME, 200];
      if (method === "POST" && url.endsWith("/api/v1/workspace")) return [{ detail: "Workspace slug already exists" }, 409];
      return undefined;
    });
    const el = await renderAtWorkspaceStep();

    await type(input(el, "Name"), "Taken");
    await click(button(el, "Bind workspace and continue"));

    const inline = el.querySelector('[data-testid="workspace-error"]');
    expect(inline?.getAttribute("role")).toBe("alert");
    expect(inline?.textContent).toContain('The slug "taken" is already taken');
    expect(inline?.textContent).toContain("Workspace slug already exists");
    expect(el.textContent).toContain("Establish the workspace");
  });
});
