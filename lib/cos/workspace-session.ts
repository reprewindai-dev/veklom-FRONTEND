// The workspace bound during onboarding (LockerPhycer POST /api/v1/workspace) is
// remembered in the browser so the mount page can prefill it. It is a hint only:
// CAPPO still checks the workspace against the session token at mount time.

const WORKSPACE_KEY = "veklom.workspace_id";

export function storeBoundWorkspaceId(workspaceId: string) {
  if (typeof window === "undefined" || !window.localStorage || !workspaceId) return;
  try {
    localStorage.setItem(WORKSPACE_KEY, workspaceId);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function readBoundWorkspaceId(): string | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  try {
    const value = localStorage.getItem(WORKSPACE_KEY);
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function clearBoundWorkspaceId() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.removeItem(WORKSPACE_KEY);
  } catch {
    // ignore
  }
}
