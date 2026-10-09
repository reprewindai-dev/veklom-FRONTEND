// The live frontend has no PGL_LEDGER_API_KEY, so the PGL proxy answers 503
// "PGL ledger proxy is not configured". Onboarding used to dead-end there: the
// agent step had no Continue until a genome was registered. The step must be
// marked unavailable and the operator must still reach /os/mount with the
// bound workspace. A session without a workspace is offered creation.

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ApiError } from "@/lib/api";
import { canOpenMount, classifyAgentRegistrationFailure, workspaceClaimState } from "@/lib/cos/onboarding-steps";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, refresh: jest.fn() }),
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

type Route = (url: string, init?: RequestInit) => [unknown, number] | undefined;

function installFetch(route: Route) {
  const calls: string[] = [];
  const fetchMock = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    calls.push(`${init?.method ?? "GET"} ${url}`);
    const answer = route(url, init);
    if (!answer) return jsonResponse({ error: "Route not found in proxy table" }, 404);
    return jsonResponse(answer[0], answer[1]);
  });
  Object.defineProperty(global, "fetch", { configurable: true, writable: true, value: fetchMock });
  return calls;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(<OnboardingPage />);
  });
  return container;
}

function button(el: HTMLElement, label: string): HTMLButtonElement {
  const found = Array.from(el.querySelectorAll("button")).find((candidate) => candidate.textContent?.trim() === label);
  if (!found) throw new Error(`button "${label}" not found in: ${el.textContent}`);
  return found as HTMLButtonElement;
}

async function click(target: HTMLElement) {
  await act(async () => {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

beforeEach(() => {
  mockPush.mockClear();
  mockReplace.mockClear();
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

describe("onboarding with the PGL ledger unavailable", () => {
  it("marks the agent step unavailable and still opens the mount page with the bound workspace", async () => {
    const calls = installFetch((url) => {
      if (url.includes("/api/v1/auth/me")) return [{ email: "operator@example.com", workspace_id: "ws-live-1" }, 200];
      // Agent creation is routed through the canonical PGL endpoint (POST /api/pgl/).
      if (url.includes("/api/pgl/") && !url.includes("/ledger/")) return [{ error: "PGL ledger proxy is not configured" }, 503];
      return undefined;
    });

    const el = await render();
    expect(el.textContent).toContain("operator@example.com");

    await click(button(el, "Continue")); // identity -> workspace
    expect(el.textContent).toContain("Workspace bound");
    await click(button(el, "Continue")); // workspace -> wallet
    await click(button(el, "Continue without a wallet")); // wallet -> agent
    expect(el.textContent).toContain("Register the agent genome");

    const form = el.querySelector("form")!;
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(calls.some((call) => call.startsWith("POST ") && call.includes("/api/pgl/"))).toBe(true);
    const notice = el.querySelector('[data-testid="agent-step-unavailable"]');
    expect(notice?.textContent).toContain("Unavailable · retry later");
    expect(notice?.textContent).toContain("PGL ledger proxy is not configured");
    expect(el.textContent).toContain("Agent + Genome · unavailable");
    expect(button(el, "Retry registration")).toBeTruthy();

    await click(button(el, "Continue without agent genome"));
    expect(el.textContent).toContain("Activate under real authority");
    expect(el.textContent).toContain("Not registered · ledger unavailable, retry later");
    expect(el.textContent).toContain("ws-live-1");

    // The first real action starts in Blueprint; Mount stays one click away with the workspace.
    const mountLink = Array.from(el.querySelectorAll("a")).find((a) => a.textContent?.trim() === "Open mount");
    expect(mountLink?.getAttribute("href")).toBe("/os/mount?workspace=ws-live-1");
    await click(button(el, "Start in Blueprint"));
    expect(mockPush).toHaveBeenCalledWith("/os/blueprint");
    expect(window.localStorage.getItem("veklom.workspace_id")).toBe("ws-live-1");
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("offers workspace creation when the session has no workspace, without redirecting", async () => {
    installFetch((url) => {
      if (url.includes("/api/v1/auth/me")) return [{ email: "operator@example.com", workspace_id: null }, 200];
      return undefined;
    });

    const el = await render();
    await click(button(el, "Continue"));

    expect(el.querySelector('[data-testid="workspace-missing"]')).not.toBeNull();
    expect(button(el, "Bind workspace and continue")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows a retry instead of 'sign in required' when /auth/me fails transiently", async () => {
    const answers: Array<[unknown, number]> = [
      [{ error: "LockerPhycer authentication unavailable" }, 503],
      [{ email: "operator@example.com", workspace_id: "ws-live-1" }, 200],
    ];
    installFetch((url) => (url.includes("/api/v1/auth/me") ? answers.shift() : undefined));

    const el = await render();
    expect(el.textContent).not.toContain("Sign in required");
    expect(el.textContent).toContain("LockerPhycer authentication unavailable");

    await click(button(el, "Retry identity check"));
    expect(el.textContent).toContain("operator@example.com");
    expect(el.textContent).not.toContain("LockerPhycer authentication unavailable");
  });
});

describe("onboarding step helpers", () => {
  it("classifies proxy/ledger outages as unavailable and request errors as failed", () => {
    expect(classifyAgentRegistrationFailure(new ApiError(503, "PGL ledger proxy is not configured")).kind).toBe("unavailable");
    expect(classifyAgentRegistrationFailure(new ApiError(502, "Gateway Proxy Error")).kind).toBe("unavailable");
    expect(classifyAgentRegistrationFailure(new ApiError(undefined, "Failed to fetch", undefined, "network")).kind).toBe("unavailable");
    expect(classifyAgentRegistrationFailure(new ApiError(422, "agent_name: field required")).kind).toBe("failed");
    expect(classifyAgentRegistrationFailure(new Error("boom"))).toEqual({ kind: "failed", message: "boom" });
  });

  it("requires only a bound workspace to open the mount page", () => {
    expect(canOpenMount("ws-1")).toBe(true);
    expect(canOpenMount(" ")).toBe(false);
    expect(canOpenMount(null)).toBe(false);
  });

  it("reads the workspace claim from the profile", () => {
    expect(workspaceClaimState(null)).toBe("unknown");
    expect(workspaceClaimState({ workspace_id: null })).toBe("missing");
    expect(workspaceClaimState({ workspace_id: "ws-1" })).toBe("bound");
  });
});
