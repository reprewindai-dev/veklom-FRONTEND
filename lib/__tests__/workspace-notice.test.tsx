import { render, screen } from "@testing-library/react";
import { WorkspaceNotice } from "@/components/cos/WorkspaceNotice";

const auth = { me: null as null | { workspace_id?: string | null } };
let pathname = "/os";
let sandbox = false;

jest.mock("@/lib/auth-context", () => ({ useAuth: () => auth }));
jest.mock("@/lib/cos/sandbox", () => ({ useSandboxMode: () => sandbox }));
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));

describe("WorkspaceNotice", () => {
  beforeEach(() => { auth.me = null; pathname = "/os"; sandbox = false; });

  it("tells a signed-in account with no workspace where the one required step is", () => {
    auth.me = { workspace_id: null };
    render(<WorkspaceNotice />);
    expect(screen.getByTestId("workspace-notice")).toHaveTextContent("no workspace yet");
    expect(screen.getByRole("link", { name: /create your workspace/i })).toHaveAttribute("href", "/os/onboarding");
  });

  it("stays silent for an account that has a workspace", () => {
    auth.me = { workspace_id: "ws_1" };
    render(<WorkspaceNotice />);
    expect(screen.queryByTestId("workspace-notice")).toBeNull();
  });

  it("stays silent when signed out, on onboarding itself, and in the sandbox", () => {
    render(<WorkspaceNotice />);
    expect(screen.queryByTestId("workspace-notice")).toBeNull();
    auth.me = { workspace_id: null }; pathname = "/os/onboarding";
    render(<WorkspaceNotice />);
    expect(screen.queryByTestId("workspace-notice")).toBeNull();
    pathname = "/os"; sandbox = true;
    render(<WorkspaceNotice />);
    expect(screen.queryByTestId("workspace-notice")).toBeNull();
  });
});
