// Onboarding step outcomes that must not block the operator.
//
// The PGL agent-genome step talks to the ledger through the frontend proxy,
// which answers 503 "PGL ledger proxy is not configured" when the deployment
// has no PGL_LEDGER_API_KEY. That is a deployment state, not an operator
// error: the workspace is already bound and the mount page works without a
// registered genome. The step is shown as unavailable and can be retried.

import { ApiError } from "@/lib/api";

export type AgentStepOutcome =
  | { kind: "unavailable"; message: string }
  | { kind: "failed"; message: string };

const UNAVAILABLE_STATUSES = new Set([502, 503, 504]);

export function classifyAgentRegistrationFailure(cause: unknown): AgentStepOutcome {
  if (cause instanceof ApiError) {
    const unavailable =
      (cause.status !== undefined && UNAVAILABLE_STATUSES.has(cause.status)) ||
      cause.kind === "network" ||
      cause.kind === "configuration";
    if (unavailable) {
      return { kind: "unavailable", message: cause.message || "The agent ledger is unavailable" };
    }
    return { kind: "failed", message: cause.message || `HTTP ${cause.status}` };
  }
  return { kind: "failed", message: cause instanceof Error ? cause.message : "Request failed" };
}

/** The mount page needs a bound workspace; a registered genome is optional. */
export function canOpenMount(workspaceId: string | null | undefined): boolean {
  return Boolean(workspaceId && workspaceId.trim());
}

export type WorkspaceClaimState = "unknown" | "missing" | "bound";

/**
 * A LockerPhycer session token carries the workspace in its claims once a
 * workspace has been bound. A token without one (`workspace_id` null) is a
 * valid session that still needs a workspace; the operator is offered
 * creation, never redirected.
 */
export function workspaceClaimState(me: { workspace_id?: string | null } | null | undefined): WorkspaceClaimState {
  if (!me) return "unknown";
  return typeof me.workspace_id === "string" && me.workspace_id.trim() ? "bound" : "missing";
}
