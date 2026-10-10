import type { ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { WorkspaceNotice } from "@/components/cos/WorkspaceNotice";

const auth = { me: null as null | { workspace_id?: string | null } };
let pathname = "/os";
let sandbox = false;

jest.mock("@/lib/auth-context", () => ({ useAuth: () => auth }));
jest.mock("@/lib/cos/sandbox", () => ({ useSandboxMode: () => sandbox }));
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));

function renderToStaticMarkup(element: ReactElement): string {
  const container = document.createElement("div");
  const root = createRoot(container);
  flushSync(() => root.render(element));
  const html = container.innerHTML;
  flushSync(() => root.unmount());
  return html;
}

describe("WorkspaceNotice", () => {
  beforeEach(() => { auth.me = null; pathname = "/os"; sandbox = false; });

  it("tells a signed-in account with no workspace where the one required step is", () => {
    auth.me = { workspace_id: null };
    const html = renderToStaticMarkup(<WorkspaceNotice />);
    expect(html).toContain("no workspace yet");
    expect(html).toContain('href="/os/onboarding"');
  });

  it("stays silent for an account that has a workspace", () => {
    auth.me = { workspace_id: "ws_1" };
    expect(renderToStaticMarkup(<WorkspaceNotice />)).toBe("");
  });

  it("stays silent when signed out, on onboarding itself, and in the sandbox", () => {
    expect(renderToStaticMarkup(<WorkspaceNotice />)).toBe("");
    auth.me = { workspace_id: null }; pathname = "/os/onboarding";
    expect(renderToStaticMarkup(<WorkspaceNotice />)).toBe("");
    pathname = "/os"; sandbox = true;
    expect(renderToStaticMarkup(<WorkspaceNotice />)).toBe("");
  });
});
