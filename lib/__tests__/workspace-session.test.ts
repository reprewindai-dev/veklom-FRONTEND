import { clearBoundWorkspaceId, readBoundWorkspaceId, storeBoundWorkspaceId } from "@/lib/cos/workspace-session";

describe("bound workspace memory", () => {
  beforeEach(() => clearBoundWorkspaceId());

  it("has no workspace until onboarding binds one (never 'default')", () => {
    expect(readBoundWorkspaceId()).toBeNull();
  });

  it("remembers the workspace bound during onboarding", () => {
    storeBoundWorkspaceId("ws_7f3a");
    expect(readBoundWorkspaceId()).toBe("ws_7f3a");
    clearBoundWorkspaceId();
    expect(readBoundWorkspaceId()).toBeNull();
  });

  it("ignores blank values", () => {
    storeBoundWorkspaceId("");
    expect(readBoundWorkspaceId()).toBeNull();
  });
});
