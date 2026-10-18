import type { ArgumentValue, BoundOperation } from "@/lib/cos/execution-intent";
import type { GPCPipelineGraph } from "@/types/gpc";

/**
 * Workspace task model. One conversation drives the same lifecycle the operator pages drive
 * (Blueprint → Mount → Authority → Execute → readback). Nothing here decides what is permitted:
 * every transition below is caused by a response from ABIDE or CAPPO, or by the user's approval.
 */

export type StepCoverage = "read" | "write" | "blocked" | "uncovered";

export type WorkspaceStep = {
  stepId: string;
  sequence: number;
  clause: string;
  coverage: StepCoverage;
  action: string | null;
  packageRef: string | null;
  reason: string;
  requiresApproval: boolean;
  /** ABIDE says this step can be bound to one exact operation (resource + arguments). */
  bindable: boolean;
  /** The exact operation ABIDE bound, once the user supplied what it needed. Never assembled here. */
  operation: BoundOperation | null;
};

export type PlanVerdict = "ready_for_mount" | "blocked" | "incomplete" | "empty";

export type WorkspacePlan = {
  /** contract_id (contract shape) or plan id (pipeline shape). */
  planId: string;
  /** canonical_hash of the contract, else the plan proof hash. Approval is pinned to this. */
  canonicalHash: string;
  intent: string;
  verdict: PlanVerdict;
  steps: WorkspaceStep[];
  catalogDigest?: string;
  pipeline?: GPCPipelineGraph;
  shape: "contract" | "plan";
};

export type StepBinding = { resource: string; arguments: Record<string, ArgumentValue> };

export type TaskPhase =
  | "idle"
  | "compiling"
  | "needs_input"
  | "needs_review"
  | "refused"
  | "requesting_authority"
  | "executing"
  | "reading_back"
  | "done"
  | "denied"
  | "outcome_unknown"
  | "failed";

export type TaskMessage = {
  id: string;
  role: "you" | "veklom";
  text: string;
  tone?: "plain" | "ok" | "warn" | "danger";
};

export type TaskApproval = {
  /** The contract hash the user approved. A recompile that changes it voids the approval. */
  canonicalHash: string;
  stepId: string;
  operation: BoundOperation;
};

export type TaskAuthority = {
  decision: string;
  reason?: string;
  mountId?: string;
  expiresAt?: string;
  anchoringStatus?: string;
};

export type TaskExecution = {
  decision: string;
  reason?: string;
  operationId: string;
  receiptId?: string;
  anchoringStatus?: string;
  eventHash?: string;
  resultingState?: Record<string, unknown>;
  terminated?: boolean;
};

export type TaskReadback = {
  proof: "Verified" | "Degraded" | "Needs proof";
  state?: Record<string, unknown>;
  error?: string;
};

export type TaskState = {
  phase: TaskPhase;
  intent: string;
  plan?: WorkspacePlan;
  bindings: Record<number, StepBinding>;
  /** The one step this task will act on. The Workspace runs one governed step at a time. */
  activeStepId?: string;
  approval?: TaskApproval;
  authority?: TaskAuthority;
  execution?: TaskExecution;
  readback?: TaskReadback;
  error?: string;
  messages: TaskMessage[];
  /** Monotonic counter for message ids; keeps the reducer free of clocks and randomness. */
  seq: number;
};

export type TaskEvent =
  | { type: "submit"; intent: string }
  | { type: "compiled"; plan: WorkspacePlan }
  | { type: "compile_failed"; detail: string }
  | { type: "bind"; sequence: number; binding: StepBinding }
  | { type: "approve" }
  | { type: "authority"; response: Record<string, unknown> }
  | { type: "authority_unreachable"; detail: string }
  | { type: "executed"; response: Record<string, unknown>; operationId: string }
  | { type: "execute_unreachable"; detail: string; operationId: string }
  | { type: "readback"; response: Record<string, unknown> }
  | { type: "reset" };
