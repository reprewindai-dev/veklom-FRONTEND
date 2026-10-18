/**
 * Raw ABIDE compile responses captured from the running container (veklom-abide, 2026-10-18,
 * POST http://abide:8010/v1/blueprint/compile). The parser and reducer are pinned to the real
 * shape, not to one inferred from the pages.
 */
import increment from "./fixtures/abide-compile-increment.json";
import pizza from "./fixtures/abide-compile-pizza.json";
import { parseCompileResponse } from "../compile-shape";
import { pipelinePositions } from "../pipeline-nodes";
import { activeStep, initialTaskState, taskReducer } from "../task-reducer";

describe("ABIDE compile fixtures (captured 2026-10-18)", () => {
  it("parses the real response as a contract and keeps the contract hash, not the plan hash", () => {
    const plan = parseCompileResponse(increment);
    expect(plan).not.toBeNull();
    expect(plan?.shape).toBe("contract");
    expect(plan?.planId).toBe("bc_0c84fd40c4962310");
    expect(plan?.canonicalHash).toBe("0c84fd40c49623109b4ea05a47d06eecc18df399a029ba6c82a8e720f99ef5b5");
    expect(plan?.verdict).toBe("ready_for_mount");
    expect(plan?.catalogDigest).toBe("c9f890a58ff552ca62029fdf70b789be32c319f8643b3c96ba838ac85ff04616");
    expect(plan?.steps).toHaveLength(1);
    const step = plan!.steps[0];
    expect(step.stepId).toBe("st_c364a80b19b8");
    expect(step.coverage).toBe("write");
    expect(step.action).toBe("counter.increment");
    expect(step.packageRef).toBe("veklom.governed-counter@v1");
    // The real service returned the covered write step unbound and not flagged bindable.
    expect(step.bindable).toBe(false);
    expect(step.operation).toBeNull();
  });

  it("asks for the exact resource when the real covered step comes back unbound", () => {
    const plan = parseCompileResponse(increment)!;
    const state = taskReducer(taskReducer(initialTaskState, { type: "submit", intent: "increment the counter" }), { type: "compiled", plan });
    expect(state.phase).toBe("needs_input");
    expect(activeStep(state)?.stepId).toBe("st_c364a80b19b8");
    // Nothing can be approved until ABIDE binds the operation.
    expect(taskReducer(state, { type: "approve" })).toBe(state);
    expect(pipelinePositions(state).map((p) => p.status)).toEqual(["success", "idle", "idle", "idle", "idle"]);
  });

  it("refuses the real uncovered intent in plain words and names the clause", () => {
    const plan = parseCompileResponse(pizza)!;
    expect(plan.verdict).toBe("incomplete");
    expect(plan.steps[0].coverage).toBe("uncovered");
    const state = taskReducer(taskReducer(initialTaskState, { type: "submit", intent: "order a pizza to 123 Main St" }), { type: "compiled", plan });
    expect(state.phase).toBe("refused");
    const last = state.messages[state.messages.length - 1];
    expect(last.text).toContain('No capability covers this step: "order a pizza to 123 Main St"');
    expect(last.text).toContain("will not pretend");
    expect(last.text).not.toContain("covered:");
    expect(taskReducer(state, { type: "approve" })).toBe(state);
    expect(pipelinePositions(state).find((p) => p.id === "prepared")?.status).toBe("failure");
  });

  it("falls back to the plan shape when the contract block is absent", () => {
    const { contract: _contract, ...planOnly } = increment;
    void _contract;
    const plan = parseCompileResponse(planOnly);
    expect(plan?.shape).toBe("plan");
    expect(plan?.planId).toBe("bp_9e818dad37e73d81");
    expect(plan?.canonicalHash).toBe("sha256:9e818dad37e73d81068219e857b368efb2299f9f14864ff25ea642db87ba37cd");
    expect(plan?.steps[0].coverage).toBe("write");
  });
});
