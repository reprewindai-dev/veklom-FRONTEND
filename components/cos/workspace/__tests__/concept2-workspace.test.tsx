import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { HorizontalExecutionDAG } from "../HorizontalExecutionDAG";
import { ActionApprovalCard } from "../ActionApprovalCard";
import { InspectorPanel } from "../InspectorPanel";
import { ActiveTaskCard } from "../ActiveTaskCard";
import { TaskComposer } from "../TaskComposer";
import { TaskReceipt } from "../TaskReceipt";
import { initialTaskState, taskReducer } from "@/lib/cos/tasks/task-reducer";
import type { TaskState, WorkspacePlan } from "@/lib/cos/tasks/task-types";
import { parseCompileResponse } from "@/lib/cos/tasks/compile-shape";
import increment from "@/lib/cos/tasks/__tests__/fixtures/abide-compile-increment.json";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function mount(node: React.ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(node);
  });
  return container;
}

afterEach(async () => {
  if (root) {
    await act(async () => {
      root!.unmount();
    });
    root = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
});

/** The real ABIDE contract for "increment the counter", with the step bound the way ABIDE binds it. */
function boundPlan(): WorkspacePlan {
  const plan = parseCompileResponse(increment)!;
  const step = plan.steps[0];
  return {
    ...plan,
    steps: [{
      ...step,
      bindable: true,
      operation: {
        package_ref: "veklom.governed-counter@v1",
        target_ref: "activation.governed-counter",
        resource: "demo-counter",
        action: "counter.increment",
        arguments: {},
      },
    }],
  };
}

function reviewState(): TaskState {
  const submitted = taskReducer(initialTaskState, { type: "submit", intent: "increment the counter" });
  return taskReducer(submitted, { type: "compiled", plan: boundPlan() });
}

const DEMO_WORDS = ["sales", "Sales", "sarah", "gemini", "recipients", "company.internal", "pkg-email", "contract-sales-oct"];

function expectNoDemoContent(text: string) {
  for (const word of DEMO_WORDS) expect(text).not.toContain(word);
}

describe("Workspace components render only observed task state", () => {
  it("starts empty: no example task, no pre-filled contract, no fabricated plan", async () => {
    const el = await mount(
      <>
        <TaskComposer busy={false} onSubmit={jest.fn()} />
        <ActiveTaskCard state={initialTaskState} workspace={null} busy={false} onBind={jest.fn()} onApprove={jest.fn()} />
        <InspectorPanel state={initialTaskState} workspace={null} />
      </>,
    );
    const textarea = el.querySelector("textarea") as HTMLTextAreaElement;
    expect(textarea.value).toBe("");
    expect(el.textContent).toContain("No task yet");
    expect(el.textContent).toContain("Not compiled");
    expect(el.textContent).toContain("Not requested");
    expect(el.textContent).toContain("Not executed");
    expectNoDemoContent(el.textContent ?? "");
  });

  it("DAG: five positions from pipelinePositions, permission waits for approval, no Python button without ABIDE code", async () => {
    const state = reviewState();
    const el = await mount(<HorizontalExecutionDAG state={state} onOpenPython={jest.fn()} />);
    for (const id of ["prepared", "permission", "executing", "result", "evidence"]) {
      expect(el.querySelector(`[data-testid="dag-node-${id}"]`)).not.toBeNull();
    }
    expect(el.textContent).toContain("Approval required");
    expect(el.textContent).toContain("counter.increment");
    expect(el.textContent).not.toContain("Python");
    expectNoDemoContent(el.textContent ?? "");
  });

  it("DAG: shows the Python button only when the contract carries code", async () => {
    const state = reviewState();
    const withCode: TaskState = { ...state, plan: { ...state.plan!, pythonCode: "print('governed')" } };
    const el = await mount(<HorizontalExecutionDAG state={withCode} onOpenPython={jest.fn()} />);
    expect(el.textContent).toContain("View governed Python");
  });

  it("approval card: names the compiler's action, target, resource and contract hash; approve needs a workspace", async () => {
    const state = reviewState();
    const onApprove = jest.fn();
    const el = await mount(<ActionApprovalCard state={state} workspace="ws_test" busy={false} onBind={jest.fn()} onApprove={onApprove} />);
    expect(el.textContent).toContain("Run counter.increment on demo-counter?");
    expect(el.textContent).toContain("activation.governed-counter");
    expect(el.textContent).toContain(state.plan!.canonicalHash);
    expect(el.textContent).toContain("Sandbox pool: governed-counter test capability");
    expect(el.textContent).toContain("Approve and run once");
    expectNoDemoContent(el.textContent ?? "");
    const approve = Array.from(el.querySelectorAll("button")).find((b) => b.textContent?.includes("Approve and run once")) as HTMLButtonElement;
    await act(async () => { approve.click(); });
    expect(onApprove).toHaveBeenCalledTimes(1);
  });

  it("approval card: without a bound workspace the approve button is disabled and says so", async () => {
    const el = await mount(<ActionApprovalCard state={reviewState()} workspace={null} busy={false} onBind={jest.fn()} onApprove={jest.fn()} />);
    const approve = Array.from(el.querySelectorAll("button")).find((b) => b.textContent?.includes("Approve and run once")) as HTMLButtonElement;
    expect(approve.disabled).toBe(true);
    expect(el.textContent).toContain("No workspace is bound to this session");
  });

  it("approval card: the unbound real contract asks for the resource and binds through onBind", async () => {
    const submitted = taskReducer(initialTaskState, { type: "submit", intent: "increment the counter" });
    const state = taskReducer(submitted, { type: "compiled", plan: parseCompileResponse(increment)! });
    expect(state.phase).toBe("needs_input");
    const onBind = jest.fn();
    const el = await mount(<ActionApprovalCard state={state} workspace="ws_test" busy={false} onBind={onBind} onApprove={jest.fn()} />);
    const input = el.querySelector("input[placeholder='e.g. demo-counter']") as HTMLInputElement;
    const form = el.querySelector("form") as HTMLFormElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      setter.call(input, "demo-counter");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
    expect(onBind).toHaveBeenCalledWith(1, { resource: "demo-counter", arguments: {} });
  });

  it("inspector: matrix follows the responses through grant, execute and verified readback", async () => {
    let state = taskReducer(reviewState(), { type: "approve" });
    expect(state.phase).toBe("requesting_authority");
    state = taskReducer(state, { type: "authority", response: { decision: "allow", mount: { id: "mnt_1" }, token: { token_id: "tok_1", nonce: "n_1" } } });
    state = taskReducer(state, { type: "executed", operationId: "op_1", response: { decision: "allow", consequence: { receipt_id: "rcpt_1", resulting_state: { value: 1, version: 1 }, terminated: true }, anchoring: { status: "confirmed", pgl_event_hash: "0xabc" } } });
    state = taskReducer(state, { type: "readback", response: { state: { value: 1, version: 1 } } });
    expect(state.phase).toBe("done");
    expect(state.readback?.proof).toBe("Verified");
    const el = await mount(<InspectorPanel state={state} workspace="ws_test" project="sandbox" />);
    expect(el.textContent).toContain("Approved by you");
    expect(el.textContent).toContain("Issued · consumed");
    expect(el.textContent).toContain("Executed once");
    expect(el.textContent).toContain("Verified");
    expect(el.textContent).toContain("rcpt_1");
    expect(el.textContent).toContain("mnt_1");
  });

  it("active card: status label tracks the phase, including refusal and unknown outcome", async () => {
    const refused = taskReducer(taskReducer(initialTaskState, { type: "submit", intent: "order a pizza" }), { type: "compiled", plan: { ...boundPlan(), verdict: "incomplete", steps: [{ ...boundPlan().steps[0], coverage: "uncovered", operation: null, bindable: false }] } });
    expect(refused.phase).toBe("refused");
    const el = await mount(<ActiveTaskCard state={refused} workspace="ws_test" busy={false} onBind={jest.fn()} onApprove={jest.fn()} />);
    expect(el.textContent).toContain("Refused: not covered by the catalog");

    let lost = taskReducer(reviewState(), { type: "approve" });
    lost = taskReducer(lost, { type: "authority", response: { decision: "allow", mount: { id: "mnt_1" }, token: { token_id: "tok_1", nonce: "n_1" } } });
    lost = taskReducer(lost, { type: "execute_unreachable", detail: "connection reset", operationId: "op_1" });
    expect(lost.phase).toBe("outcome_unknown");
    const el2 = await mount(<ActiveTaskCard state={lost} workspace="ws_test" busy={false} onBind={jest.fn()} onApprove={jest.fn()} />);
    expect(el2.textContent).toContain("Outcome unknown: reconciliation required");
  });

  it("receipt: Verified only when the target's own re-read matched", async () => {
    let state = taskReducer(reviewState(), { type: "approve" });
    state = taskReducer(state, { type: "authority", response: { decision: "allow", mount: { id: "mnt_1" }, token: { token_id: "tok_1", nonce: "n_1" } } });
    state = taskReducer(state, { type: "executed", operationId: "op_1", response: { decision: "allow", consequence: { receipt_id: "rcpt_1", resulting_state: { value: 2, version: 2 }, terminated: true }, anchoring: { status: "confirmed", pgl_event_hash: "0xabc" } } });
    const mismatch = taskReducer(state, { type: "readback", response: { state: { value: 1, version: 1 } } });
    expect(mismatch.readback?.proof).toBe("Degraded");
    const el = await mount(<TaskReceipt state={mismatch} project="sandbox" />);
    expect(el.textContent).toContain("did not confirm it");
    expect(el.textContent).toContain("op_1");
    expect(el.textContent).toContain("0xabc");
  });
});
