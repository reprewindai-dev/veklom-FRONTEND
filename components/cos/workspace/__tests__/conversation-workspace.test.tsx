/**
 * The orchestrator against a stubbed transport: the exact routes and bodies the Workspace sends,
 * in order, and that the result shown is driven by the responses. The stub returns the real
 * ABIDE contract shape (captured fixture) and CAPPO/cAPI response shapes the operator pages read.
 */
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { StageCallResult } from "@/lib/cos/useStageData";
import type { StageEndpoint } from "@/lib/cos/stages";
import increment from "@/lib/cos/tasks/__tests__/fixtures/abide-compile-increment.json";
import { ConversationWorkspace } from "../ConversationWorkspace";

jest.mock("@/lib/auth-context", () => ({ useAuth: () => ({ me: { workspace_id: "ws_test" } }) }));

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Call = { endpoint: StageEndpoint; body?: unknown };

function ok<T>(endpoint: StageEndpoint, data: T): StageCallResult<T> {
  return { data, record: { method: endpoint.method, path: endpoint.path, classification: endpoint.classification, status: 200, proof: "Present", observation: "returned" } as StageCallResult<T>["record"] };
}

function unreachable(endpoint: StageEndpoint): StageCallResult<never> {
  return { record: { method: endpoint.method, path: endpoint.path, classification: endpoint.classification, status: undefined, proof: "Needs proof", observation: "unreachable", error: "connection reset" } as StageCallResult<never>["record"] };
}

function boundIncrement() {
  const contract = { ...increment.contract, steps: [{ ...increment.contract.steps[0], bindable: true, operation: { package_ref: "veklom.governed-counter@v1", target_ref: "activation.governed-counter", resource: "demo-counter", action: "counter.increment", arguments: {} } }] };
  return { ...increment, contract };
}

function makeTransport(options: { loseExecute?: boolean } = {}) {
  const calls: Call[] = [];
  const call = jest.fn(async <T,>(endpoint: StageEndpoint, body?: unknown): Promise<StageCallResult<T>> => {
    calls.push({ endpoint, body });
    const { path, method } = endpoint;
    if (path === "/api/abide/v1/blueprint/compile") {
      const ops = (body as { operations?: unknown[] }).operations ?? [];
      return ok(endpoint, (ops.length ? boundIncrement() : increment) as unknown as T);
    }
    if (method === "POST" && path === "/v1/capability/mounts") {
      return ok(endpoint, { decision: "allow", mount: { id: "mnt_1", grants: { reads: [], writes: ["counter.increment"], blocked: ["counter.reset"] } }, token: { token_id: "tok_1", nonce: "n_1", mount_id: "mnt_1", authority_epoch: 3, expires_at: "2026-10-23T00:05:00Z" }, anchoring: { status: "confirmed" } } as unknown as T);
    }
    if (method === "POST" && path === "/v1/capability/mounts/mnt_1/execute") {
      if (options.loseExecute) return unreachable(endpoint) as StageCallResult<T>;
      return ok(endpoint, { decision: "allow", consequence: { receipt_id: "rcpt_1", resulting_state: { value: 1, version: 1 }, terminated: true }, anchoring: { status: "confirmed", pgl_event_hash: "0xabc" } } as unknown as T);
    }
    if (method === "GET" && path.startsWith("/v1/capability/targets/activation.governed-counter/state")) {
      return ok(endpoint, { state: { value: 1, version: 1 } } as unknown as T);
    }
    throw new Error(`unexpected call ${method} ${path}`);
  });
  const data = { call, stageProof: "Needs proof", records: [], payloads: {}, loading: false, stage: {} } as unknown as Parameters<typeof ConversationWorkspace>[0]["data"];
  return { calls, data };
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

async function mountWorkspace(data: Parameters<typeof ConversationWorkspace>[0]["data"]) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root!.render(<ConversationWorkspace data={data} />); });
  return container;
}

async function flush() {
  for (let i = 0; i < 6; i += 1) {
    await act(async () => { await Promise.resolve(); });
  }
}

function setValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function button(el: HTMLElement, text: string): HTMLButtonElement {
  const found = Array.from(el.querySelectorAll("button")).find((b) => b.textContent?.includes(text));
  if (!found) throw new Error(`no button containing "${text}"`);
  return found;
}

afterEach(async () => {
  if (root) { await act(async () => { root!.unmount(); }); root = null; }
  if (container) { container.remove(); container = null; }
  window.sessionStorage.clear();
});

async function driveToReview(el: HTMLElement) {
  const textarea = el.querySelector("textarea") as HTMLTextAreaElement;
  await act(async () => { setValue(textarea, "increment the counter"); });
  await act(async () => { el.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  await flush();
  // The real contract comes back unbound: the Workspace asks for the resource and recompiles with the binding.
  expect(el.textContent).toContain("needs its exact target resource");
  const resource = el.querySelector("input[placeholder='e.g. demo-counter']") as HTMLInputElement;
  await act(async () => { setValue(resource, "demo-counter"); });
  const bindForm = resource.closest("form") as HTMLFormElement;
  await act(async () => { bindForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  await flush();
  expect(el.textContent).toContain("Run counter.increment on demo-counter?");
}

describe("ConversationWorkspace drives the real lifecycle routes", () => {
  it("compile → bind → approve → mount → execute on the mount → readback → Verified", async () => {
    const { calls, data } = makeTransport();
    const el = await mountWorkspace(data);
    expect(el.textContent).toContain("No task yet");
    await driveToReview(el);

    await act(async () => { button(el, "Approve and run once").click(); });
    await flush();

    const paths = calls.map((c) => `${c.endpoint.method} ${c.endpoint.path.split("?")[0]}`);
    expect(paths).toEqual([
      "POST /api/abide/v1/blueprint/compile",
      "POST /api/abide/v1/blueprint/compile",
      "POST /v1/capability/mounts",
      "POST /v1/capability/mounts/mnt_1/execute",
      "GET /v1/capability/targets/activation.governed-counter/state",
    ]);
    // The recompile carries the user's binding for ABIDE to bind; the browser never assembles the operation.
    expect((calls[1].body as { operations: unknown[] }).operations).toEqual([{ sequence: 1, resource: "demo-counter", arguments: {} }]);
    // Execute presents the single-use token, nonce, a fresh operation id and the epoch the grant stated.
    const exec = calls[3].body as Record<string, unknown>;
    expect(exec.token_id).toBe("tok_1");
    expect(exec.nonce).toBe("n_1");
    expect(exec.authority_epoch).toBe(3);
    expect(exec.action).toBe("counter.increment");
    expect(exec.target_ref).toBe("activation.governed-counter");
    expect(typeof exec.operation_id).toBe("string");
    // Readback is the target's own route, scoped to this mount.
    expect(calls[4].endpoint.path).toContain("resource=demo-counter");
    expect(calls[4].endpoint.path).toContain("mount_id=mnt_1");

    expect(el.textContent).toContain("Verified and complete");
    expect(el.textContent).toContain("rcpt_1");
    // The same session storage the operator pages read now holds this run.
    const lease = JSON.parse(window.sessionStorage.getItem("veklom.capability_lease") ?? "null");
    expect(lease?.mountId).toBe("mnt_1");
    expect(lease?.lastOperationId).toBe(exec.operation_id);
  });

  it("a lost execute answer is an unknown outcome: the target is read back but never upgraded to Verified", async () => {
    const { calls, data } = makeTransport({ loseExecute: true });
    const el = await mountWorkspace(data);
    await driveToReview(el);
    await act(async () => { button(el, "Approve and run once").click(); });
    await flush();
    expect(calls.map((c) => c.endpoint.path.split("?")[0])).toContain("/v1/capability/targets/activation.governed-counter/state");
    expect(el.textContent).toContain("Outcome unknown: reconciliation required");
    expect(el.textContent).not.toContain("Verified and complete");
  });
});
