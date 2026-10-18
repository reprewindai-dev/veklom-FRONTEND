import { parseCompileResponse } from "../compile-shape";
import { pipelinePositions } from "../pipeline-nodes";
import { activeStep, initialTaskState, taskReducer } from "../task-reducer";
import type { TaskState, WorkspacePlan } from "../task-types";

const operation = {
  package_ref: "veklom.governed-counter@v1",
  target_ref: "activation.governed-counter",
  action: "counter.increment",
  resource: "demo-counter",
  arguments: {},
};

/** A contract exactly as Blueprint receives it from ABIDE, with the write step bound. */
const contractResponse = {
  contract: {
    contract_id: "bc_demo",
    contract_version: "1",
    intent: "increment the counter",
    plan_id: "plan_demo",
    plan_proof_hash: "p".repeat(64),
    catalog_digest: "d".repeat(64),
    verdict: "ready_for_mount",
    steps: [{
      step_id: "st_1",
      sequence: 1,
      clause: "increment the counter",
      capability: "counter.increment",
      package_ref: "veklom.governed-counter@v1",
      coverage: "write",
      lane: 2,
      risk_level: "LOW",
      requires_approval: true,
      reason: "covered by the live catalog",
      bindable: true,
      operation,
    }],
    claims: [],
    canonical_hash: "c".repeat(64),
    grants_authority: false,
    authority: "none",
  },
  validation: { valid: true, errors: [], warnings: [] },
};

function run(events: Parameters<typeof taskReducer>[1][], from: TaskState = initialTaskState): TaskState {
  return events.reduce(taskReducer, from);
}

function compiled(plan: WorkspacePlan | null) {
  if (!plan) throw new Error("plan did not parse");
  return { type: "compiled" as const, plan };
}

const allowMount = { type: "authority" as const, response: { decision: "allow", mount: { id: "mnt_1" }, token: { token_id: "tok_1", nonce: "n_1", expires_at: "2026-10-18T00:05:00Z" } } };

describe("Workspace task reducer", () => {
  it("parses the Blueprint contract shape and the Govern plan shape to the same model", () => {
    const fromContract = parseCompileResponse(contractResponse);
    expect(fromContract?.shape).toBe("contract");
    expect(fromContract?.canonicalHash).toBe("c".repeat(64));
    expect(fromContract?.steps[0].operation).toEqual(operation);

    const fromPlan = parseCompileResponse({
      id: "plan_1", intent: "reset the counter", compiler: "abide", catalog_digest: "d", proof_hash: "h".repeat(64),
      verdict: "incomplete",
      steps: [{ id: "s1", clause: "order a pizza", kind: "uncovered", action: null, package_ref: null, reason: "no capability covers food delivery" }],
      suggested_mounts: [], pipeline: { pipeline_id: "p", tenant_id: "", nodes: [], edges: [] }, python: { success: false, python_code: "", execution_order: [], parallel_levels: [], warnings: [] },
    });
    expect(fromPlan?.shape).toBe("plan");
    expect(fromPlan?.steps[0].coverage).toBe("uncovered");
    expect(fromPlan?.pipeline?.pipeline_id).toBe("p");

    expect(parseCompileResponse({ error: "x402 payment system disabled" })).toBeNull();
    expect(parseCompileResponse(null)).toBeNull();
  });

  it("refuses in plain words when the catalog does not cover a step, and nothing becomes approvable", () => {
    const plan = parseCompileResponse({
      id: "plan_2", verdict: "incomplete", proof_hash: "h".repeat(64),
      steps: [
        { id: "s1", clause: "order a pizza to 123 Main St", kind: "uncovered", action: null, package_ref: null, reason: "no capability" },
        { id: "s2", clause: "increment the counter", kind: "write", action: "counter.increment", package_ref: "veklom.governed-counter@v1", reason: "covered" },
      ],
    });
    const state = run([{ type: "submit", intent: "order a pizza to 123 Main St and increment the counter" }, compiled(plan)]);
    expect(state.phase).toBe("refused");
    expect(state.activeStepId).toBeUndefined();
    const last = state.messages[state.messages.length - 1];
    expect(last.text).toContain('No capability covers this step: "order a pizza to 123 Main St"');
    expect(last.text).toContain("will not pretend");
    expect(last.text).toContain('One step is covered: "increment the counter"');
    // Approving a refused task is a no-op: no grant can be requested.
    expect(taskReducer(state, { type: "approve" })).toBe(state);
    expect(pipelinePositions(state).find((p) => p.id === "prepared")?.status).toBe("failure");
  });

  it("asks for the resource when the covered step is not yet bound, then recompiles on bind", () => {
    const unbound = parseCompileResponse({
      ...contractResponse,
      contract: { ...contractResponse.contract, steps: [{ ...contractResponse.contract.steps[0], operation: null }] },
    });
    const asked = run([{ type: "submit", intent: "increment the counter" }, compiled(unbound)]);
    expect(asked.phase).toBe("needs_input");
    expect(taskReducer(asked, { type: "approve" })).toBe(asked);
    const bound = taskReducer(asked, { type: "bind", sequence: 1, binding: { resource: "demo-counter", arguments: {} } });
    expect(bound.phase).toBe("compiling");
    expect(bound.bindings[1]).toEqual({ resource: "demo-counter", arguments: {} });
  });

  it("runs the happy path only through observed responses and ends Verified on a matching readback", () => {
    const plan = parseCompileResponse(contractResponse);
    let state = run([{ type: "submit", intent: "increment the counter" }, compiled(plan)]);
    expect(state.phase).toBe("needs_review");
    expect(activeStep(state)?.operation).toEqual(operation);
    expect(pipelinePositions(state).map((p) => p.status)).toEqual(["success", "idle", "idle", "idle", "idle"]);

    state = taskReducer(state, { type: "approve" });
    expect(state.phase).toBe("requesting_authority");
    expect(state.approval).toEqual({ canonicalHash: "c".repeat(64), stepId: "st_1", operation });
    expect(pipelinePositions(state).find((p) => p.id === "permission")?.status).toBe("running");

    state = taskReducer(state, allowMount);
    expect(state.phase).toBe("executing");
    expect(state.authority?.mountId).toBe("mnt_1");

    state = taskReducer(state, {
      type: "executed",
      operationId: "op-1",
      response: {
        decision: "allow",
        consequence: { receipt_id: "rcpt_1", resulting_state: { value: 5, version: 5 }, terminated: true },
        anchoring: { status: "confirmed", pgl_event_hash: "e".repeat(64) },
      },
    });
    expect(state.phase).toBe("reading_back");
    expect(state.execution?.terminated).toBe(true);

    state = taskReducer(state, { type: "readback", response: { state: { value: 5, version: 5 } } });
    expect(state.phase).toBe("done");
    expect(state.readback?.proof).toBe("Verified");
    expect(pipelinePositions(state).map((p) => p.status)).toEqual(["success", "success", "success", "success", "success"]);
  });

  it("marks a readback that disagrees with the receipt as Degraded, never Verified", () => {
    const plan = parseCompileResponse(contractResponse);
    const state = run([
      { type: "submit", intent: "increment the counter" }, compiled(plan), { type: "approve" }, allowMount,
      { type: "executed", operationId: "op-2", response: { decision: "allow", consequence: { receipt_id: "r", resulting_state: { value: 5, version: 5 } } } },
      { type: "readback", response: { state: { value: 4, version: 4 } } },
    ]);
    expect(state.readback?.proof).toBe("Degraded");
    expect(pipelinePositions(state).find((p) => p.id === "result")?.status).toBe("failure");
  });

  it("records a denied grant and a denied execute without any success state", () => {
    const plan = parseCompileResponse(contractResponse);
    const deniedGrant = run([{ type: "submit", intent: "x" }, compiled(plan), { type: "approve" }, { type: "authority", response: { decision: "deny", reason: "scope_exceeds_package" } }]);
    expect(deniedGrant.phase).toBe("denied");
    expect(deniedGrant.messages[deniedGrant.messages.length - 1].text).toContain("scope_exceeds_package");
    expect(pipelinePositions(deniedGrant).map((p) => p.status)).toEqual(["success", "failure", "idle", "idle", "idle"]);

    const deniedExec = run([{ type: "submit", intent: "x" }, compiled(plan), { type: "approve" }, allowMount, { type: "executed", operationId: "op-3", response: { decision: "deny", reason: "stale_authority_epoch" } }]);
    expect(deniedExec.phase).toBe("denied");
    expect(deniedExec.execution?.reason).toBe("stale_authority_epoch");
    expect(deniedExec.readback).toBeUndefined();
  });

  it("treats a lost execute answer as an unknown outcome that readback cannot upgrade to Verified", () => {
    const plan = parseCompileResponse(contractResponse);
    let state = run([{ type: "submit", intent: "x" }, compiled(plan), { type: "approve" }, allowMount, { type: "execute_unreachable", operationId: "op-4", detail: "HTTP unreachable" }]);
    expect(state.phase).toBe("outcome_unknown");
    expect(pipelinePositions(state).find((p) => p.id === "executing")?.status).toBe("failure");
    state = taskReducer(state, { type: "readback", response: { state: { value: 6, version: 6 } } });
    expect(state.phase).toBe("outcome_unknown");
    expect(state.readback?.proof).toBe("Needs proof");
    expect(state.messages[state.messages.length - 1].text).toContain("Reconciliation is required");
  });

  it("voids an approval when a recompile changes the contract hash", () => {
    const plan = parseCompileResponse(contractResponse);
    const approved = run([{ type: "submit", intent: "x" }, compiled(plan), { type: "approve" }]);
    // Something changed what would run before the grant came back: the contract compiled to a new hash.
    const changed = parseCompileResponse({ ...contractResponse, contract: { ...contractResponse.contract, canonical_hash: "z".repeat(64) } });
    const recompiled = taskReducer({ ...approved, phase: "compiling" }, compiled(changed));
    expect(recompiled.approval).toBeUndefined();
    expect(recompiled.phase).toBe("needs_review");
    expect(recompiled.messages.some((m) => m.text.includes("approval no longer applies"))).toBe(true);
  });

  it("ignores responses that arrive in the wrong phase and never invents state", () => {
    const idle = initialTaskState;
    expect(taskReducer(idle, allowMount)).toBe(idle);
    expect(taskReducer(idle, { type: "executed", operationId: "op", response: { decision: "allow" } })).toBe(idle);
    expect(taskReducer(idle, { type: "readback", response: { state: { value: 1, version: 1 } } })).toBe(idle);
    expect(taskReducer(idle, { type: "submit", intent: "   " })).toBe(idle);
  });
});
