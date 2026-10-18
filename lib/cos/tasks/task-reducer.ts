import { compareReadback } from "@/lib/cos/readback";
import type {
  StepBinding,
  TaskEvent,
  TaskMessage,
  TaskState,
  WorkspacePlan,
  WorkspaceStep,
} from "./task-types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const initialTaskState: TaskState = {
  phase: "idle",
  intent: "",
  bindings: {},
  messages: [],
  seq: 0,
};

function say(state: TaskState, role: TaskMessage["role"], text: string, tone?: TaskMessage["tone"]): TaskState {
  const seq = state.seq + 1;
  return { ...state, seq, messages: [...state.messages, { id: `m${seq}`, role, text, tone }] };
}

/** The step the Workspace will act on: the first one ABIDE says can be bound to an operation. */
export function chooseActiveStep(plan: WorkspacePlan): WorkspaceStep | undefined {
  return plan.steps.find((step) => step.bindable || step.operation) ?? plan.steps.find((step) => step.coverage === "write");
}

export function activeStep(state: TaskState): WorkspaceStep | undefined {
  return state.plan?.steps.find((step) => step.stepId === state.activeStepId);
}

function quoteList(items: string[]): string {
  return items.map((item) => `"${item}"`).join("; ");
}

function describeRefusal(plan: WorkspacePlan): string {
  if (plan.verdict === "empty") return "That did not compile into any step, so there is nothing to govern. Try saying what should change and where.";
  const blocked = plan.steps.filter((step) => step.coverage === "blocked");
  const uncovered = plan.steps.filter((step) => step.coverage === "uncovered");
  const parts: string[] = [];
  if (blocked.length) parts.push(`The catalog blocks ${blocked.length === 1 ? "this step" : "these steps"}: ${quoteList(blocked.map((step) => step.clause))}. The authority layer denies it even under a grant.`);
  if (uncovered.length) parts.push(`No capability covers ${uncovered.length === 1 ? "this step" : "these steps"}: ${quoteList(uncovered.map((step) => step.clause))}. Veklom will not pretend to do it.`);
  const covered = plan.steps.filter((step) => step.coverage === "read" || step.coverage === "write");
  if (covered.length) parts.push(`${covered.length === 1 ? "One step is" : `${covered.length} steps are`} covered: ${quoteList(covered.map((step) => step.clause))}. Ask for only that and it can run.`);
  return parts.join(" ");
}

function onCompiled(state: TaskState, plan: WorkspacePlan): TaskState {
  let next: TaskState = { ...state, plan, error: undefined };
  // The user approved a specific contract hash. Any change in what would run voids that approval.
  if (state.approval && state.approval.canonicalHash !== plan.canonicalHash) {
    next = say({ ...next, approval: undefined }, "veklom", "The contract changed after you approved it, so that approval no longer applies. Review the new action before it runs.", "warn");
  }
  if (plan.verdict !== "ready_for_mount") {
    return say({ ...next, phase: "refused", activeStepId: undefined }, "veklom", describeRefusal(plan), plan.verdict === "empty" ? "plain" : "warn");
  }
  const step = chooseActiveStep(plan);
  if (!step) {
    return say({ ...next, phase: "refused", activeStepId: undefined }, "veklom", "Every step is covered by the catalog, but none of them can be bound to an exact operation from here, so nothing can be approved or run.", "warn");
  }
  next = { ...next, activeStepId: step.stepId };
  const actionable = plan.steps.filter((candidate) => candidate.bindable || candidate.operation || candidate.coverage === "write");
  if (actionable.length > 1 && !state.plan) {
    next = say(next, "veklom", `This compiles to ${plan.steps.length} steps. The Workspace runs one governed step at a time, starting with step ${step.sequence}: "${step.clause}".`);
  }
  if (!step.operation) {
    // The user already supplied a binding for this step and the compiler still returned no
    // operation: say so, instead of asking the same question again as if nothing happened.
    if (state.bindings[step.sequence]) {
      return say({ ...next, phase: "needs_input" }, "veklom", `The compiler accepted the request but did not bind step ${step.sequence} to an operation on ${state.bindings[step.sequence].resource}. Its catalog entry for ${step.packageRef ?? "this capability"} may declare no target, or the service rejected the binding. Nothing can be approved until the contract carries the exact operation.`, "warn");
    }
    return say({ ...next, phase: "needs_input" }, "veklom", `Step ${step.sequence} ("${step.clause}") is covered by ${step.packageRef ?? "a capability"}${step.action ? ` as ${step.action}` : ""}. Tell me the exact resource it should act on, and any arguments, and I will bind it. Nothing is granted yet.`);
  }
  return say({ ...next, phase: "needs_review" }, "veklom", `Ready for your review: ${step.operation.action} on ${step.operation.resource} through ${step.operation.target_ref}. Approving asks the authority layer for a single-use grant for exactly this operation and runs it once.`);
}

function onAuthority(state: TaskState, response: JsonRecord): TaskState {
  const decision = asString(response.decision) ?? "error";
  const mount = asRecord(response.mount);
  const token = asRecord(response.token);
  const mountId = asString(mount?.id) ?? asString(token?.mount_id);
  const authority = {
    decision,
    reason: asString(response.reason),
    mountId,
    expiresAt: asString(token?.expires_at),
    anchoringStatus: asString(asRecord(response.anchoring)?.status),
  };
  if (decision === "allow" && mountId && asString(token?.token_id) && asString(token?.nonce)) {
    return say({ ...state, phase: "executing", authority }, "veklom", `Grant issued for mount ${mountId}. It is single-use${authority.expiresAt ? ` and backstopped by an expiry at ${authority.expiresAt}` : ""}. Executing now.`, "ok");
  }
  return say({ ...state, phase: "denied", authority }, "veklom", `The authority layer refused the grant: ${authority.reason ?? decision}. Nothing ran.`, "danger");
}

function onExecuted(state: TaskState, response: JsonRecord, operationId: string): TaskState {
  const decision = asString(response.decision) ?? "error";
  const consequence = asRecord(response.consequence);
  const anchoring = asRecord(response.anchoring);
  const execution = {
    decision,
    reason: asString(response.reason),
    operationId,
    receiptId: asString(consequence?.receipt_id),
    anchoringStatus: asString(anchoring?.status),
    eventHash: asString(anchoring?.pgl_event_hash),
    resultingState: asRecord(consequence?.resulting_state),
    terminated: consequence?.terminated === true,
  };
  if (decision === "allow") {
    return say({ ...state, phase: "reading_back", execution }, "veklom", `Executed once under operation ${operationId}${execution.receiptId ? `; receipt ${execution.receiptId}` : ""}. The grant is ${execution.terminated ? "consumed" : "still reported as held"}. Reading the target back independently.`, "ok");
  }
  if (decision === "deny") {
    return say({ ...state, phase: "denied", execution }, "veklom", `The authority layer refused to execute: ${execution.reason ?? "no reason returned"}. No change was made through Veklom.`, "danger");
  }
  return say({ ...state, phase: "failed", execution, error: execution.reason }, "veklom", `The execute call failed: ${execution.reason ?? "no reason returned"}.`, "danger");
}

function onReadback(state: TaskState, response: JsonRecord): TaskState {
  const error = asString(response.error);
  const readbackState = asRecord(response.state);
  if (state.phase === "outcome_unknown") {
    const readback = { proof: "Needs proof" as const, state: readbackState, error };
    return say({ ...state, readback }, "veklom", readbackState ? `The target now reports ${JSON.stringify(readbackState)}. Veklom got no answer to the execute call, so it cannot say whether this run caused that state. Reconciliation is required before trusting it.` : `The target could not be read back${error ? `: ${error}` : ""}. Reconciliation is required.`, "warn");
  }
  const proof = compareReadback(state.execution?.resultingState, response);
  const readback = { proof, state: readbackState, error };
  if (proof === "Verified") {
    return say({ ...state, phase: "done", readback }, "veklom", `Verified: the target's own state matches what the receipt said (${JSON.stringify(readbackState)}). This run is complete.`, "ok");
  }
  if (proof === "Degraded") {
    return say({ ...state, phase: "done", readback }, "veklom", `Problem: the target reports ${JSON.stringify(readbackState)}, which does not match the receipt's resulting state. Treat the receipt as unverified.`, "danger");
  }
  return say({ ...state, phase: "done", readback }, "veklom", `The receipt is recorded, but the independent re-read could not confirm it${error ? ` (${error})` : ""}. Shown as not yet verified.`, "warn");
}

export function taskReducer(state: TaskState, event: TaskEvent): TaskState {
  switch (event.type) {
    case "reset":
      return initialTaskState;
    case "submit": {
      const intent = event.intent.trim();
      if (!intent) return state;
      const fresh: TaskState = { ...initialTaskState, messages: state.messages, seq: state.seq, intent, phase: "compiling" };
      return say(say(fresh, "you", intent), "veklom", "Compiling that against the live capability catalog. Compiling grants nothing.");
    }
    case "compiled":
      if (state.phase !== "compiling") return state;
      return onCompiled(state, event.plan);
    case "compile_failed":
      return say({ ...state, phase: "failed", error: event.detail }, "veklom", `The contract compiler did not answer: ${event.detail}`, "danger");
    case "bind": {
      if (state.phase !== "needs_input" && state.phase !== "needs_review") return state;
      const bindings: Record<number, StepBinding> = { ...state.bindings, [event.sequence]: event.binding };
      // Binding changes what would run: the contract is recompiled and any approval is re-checked there.
      return say({ ...state, bindings, phase: "compiling" }, "veklom", `Binding step ${event.sequence} to ${event.binding.resource}. Recompiling so the contract records exactly that operation.`);
    }
    case "approve": {
      const step = activeStep(state);
      if (state.phase !== "needs_review" || !state.plan || !step?.operation) return state;
      const approval = { canonicalHash: state.plan.canonicalHash, stepId: step.stepId, operation: step.operation };
      return say({ ...state, phase: "requesting_authority", approval }, "veklom", `Approved. Requesting a single-use grant for ${step.operation.action} on ${step.operation.resource}.`);
    }
    case "authority":
      if (state.phase !== "requesting_authority") return state;
      return onAuthority(state, event.response);
    case "authority_unreachable":
      if (state.phase !== "requesting_authority") return state;
      return say({ ...state, phase: "failed", error: event.detail }, "veklom", `The authority layer could not be reached: ${event.detail}. No grant was issued and nothing ran.`, "danger");
    case "executed":
      if (state.phase !== "executing") return state;
      return onExecuted(state, event.response, event.operationId);
    case "execute_unreachable":
      if (state.phase !== "executing") return state;
      return say({ ...state, phase: "outcome_unknown", execution: { decision: "unknown", reason: event.detail, operationId: event.operationId } }, "veklom", `The execute call got no answer (${event.detail}). The effect may or may not have happened; a timeout never proves absence. Reading the target back.`, "warn");
    case "readback":
      if (state.phase !== "reading_back" && state.phase !== "outcome_unknown") return state;
      return onReadback(state, event.response);
  }
}
