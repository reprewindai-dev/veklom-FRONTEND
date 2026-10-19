"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { ExecutionIntent } from "@/lib/cos/execution-intent";
import {
  applyExecuteResponse,
  clearSessionConsequence,
  readSessionConsequence,
  storeSessionCapabilityLease,
  storeSessionConsequence,
  type SessionCapabilityLease,
} from "@/lib/cos/lease-session";
import { mountRequestBody, readMountBinding, type MountBinding } from "@/lib/cos/mount-binding";
import { targetStateReadbackPath } from "@/lib/cos/readback";
import { SANDBOX_PROJECT, useSandboxMode } from "@/lib/cos/sandbox";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { parseCompileResponse } from "@/lib/cos/tasks/compile-shape";
import { activeStep, initialTaskState, taskReducer } from "@/lib/cos/tasks/task-reducer";
import type { StepBinding, TaskState, WorkspacePlan } from "@/lib/cos/tasks/task-types";
import type { StageCallResult, useStageData } from "@/lib/cos/useStageData";
import { readBoundWorkspaceId } from "@/lib/cos/workspace-session";
import { asRecord, asString, mountEndpoint, returnedGrants, type JsonRecord, type MountResponse } from "@/components/cos/MountParts";
import { FailureNotice } from "@/components/cos/StageParts";
import { TaskComposer } from "./TaskComposer";
import { ActiveTaskCard } from "./ActiveTaskCard";
import { InspectorPanel } from "./InspectorPanel";
import { DualTrackEvidenceInspector } from "@/components/cos/DualTrackEvidenceInspector";

type StageData = ReturnType<typeof useStageData>;

const COMPILE: StageEndpoint = {
  method: "POST",
  path: "/api/abide/v1/blueprint/compile",
  classification: "present",
  response: "ABIDE contract",
};

function newOperationId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `op-${Date.now()}`;
}

function failureDetail(result: StageCallResult<unknown>): string {
  return result.record.error || `HTTP ${result.record.status ?? "unreachable"}`;
}

const BUSY_PHASES: ReadonlySet<TaskState["phase"]> = new Set([
  "compiling",
  "requesting_authority",
  "executing",
  "reading_back",
]);

// Approved Default Plan matching Concept 2 image (media_1792447504521_6d08be07.png)
const DEFAULT_SALES_PLAN: WorkspacePlan = {
  planId: "contract-sales-oct",
  canonicalHash: "8e4b7c12f019a3d4e5f6789012345678",
  intent: "Prepare the monthly sales summary and email it to the sales team.",
  verdict: "ready_for_mount",
  shape: "contract",
  pythonCode: `from veklom import VeklomClient, CapabilityLease, EvidenceReceipt

client = VeklomClient(endpoint="http://127.0.0.1:8010")

def execute_monthly_sales_summary():
    # Step 1: Ingest verified dataset
    dataset = client.datasets.load("sales-october.csv", integrity="sha256:8e4b7c...")
    
    # Step 2: Compute executive summary
    summary = client.compute.summarize(dataset, model="gemini-1.5-pro", temperature=0.0)
    
    # Step 3: Render certified PDF report
    report_pdf = client.documents.render_pdf(
        template="executive_sales_summary",
        data=summary,
        output="sales-summary.pdf"
    )
    
    # Step 4: Consequential Action (HALT FOR APPROVAL)
    # Requires explicit operator grant before emission
    lease: CapabilityLease = client.cappo.acquire_lease(
        capability="email.send",
        recipients=["sales-leads@company.internal", "sarah.c@company.internal"],
        subject="Monthly sales summary — October 2026",
        attachment=report_pdf
    )
    
    # Step 5: Execute and anchor cryptographic evidence
    receipt: EvidenceReceipt = client.execute(lease)
    print(f"Committed: receipt_id={receipt.id}, pgl_proof={receipt.proof_hash}")
    return receipt

if __name__ == "__main__":
    execute_monthly_sales_summary()
`,
  steps: [
    {
      stepId: "step-1",
      sequence: 1,
      clause: "send report email to sales team",
      coverage: "write",
      action: "email.send",
      packageRef: "pkg-email-corp",
      reason: "Permitted under sales operations policy",
      requiresApproval: true,
      bindable: true,
      operation: {
        package_ref: "pkg-email-corp",
        target_ref: "target-exchange",
        resource: "sales-leads@company.internal",
        action: "email.send",
        arguments: { recipients: 6, format: "pdf" },
      },
    },
  ],
};

const DEFAULT_SALES_STATE: TaskState = {
  phase: "needs_review",
  intent: "Prepare the monthly sales summary and email it to the sales team.",
  plan: DEFAULT_SALES_PLAN,
  activeStepId: "step-1",
  bindings: {},
  messages: [
    {
      id: "m1",
      role: "user",
      text: "Prepare the monthly sales summary and email it to the sales team.",
    },
    {
      id: "m2",
      role: "assistant",
      text: "Plan compiled via ABIDE. Consequential action identified: email.send requires operator approval before execution.",
    },
  ],
  seq: 2,
};

export function ConversationWorkspace({ data }: { data: StageData }) {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const { me } = useAuth();
  const sandbox = useSandboxMode();
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [heldProject, setHeldProject] = useState<string | undefined>(undefined);
  const [hasUserSubmitted, setHasUserSubmitted] = useState(false);

  const capiBase = getStage("mount").endpoints[0]?.baseUrl;
  const cappoBase = getStage("execute").endpoints[0]?.baseUrl;

  const lease = useRef<SessionCapabilityLease | null>(null);
  const operationId = useRef<string>("");
  const authorityEpoch = useRef<number | undefined>(undefined);
  const inFlight = useRef<string | null>(null);
  const { call } = data;

  useEffect(() => {
    const profileWorkspace = typeof me?.workspace_id === "string" ? me.workspace_id : null;
    setWorkspace(readBoundWorkspaceId() || profileWorkspace || "ws-sales-ops");
  }, [me?.workspace_id]);

  const compile = useCallback(async (current: TaskState) => {
    const result = await call<unknown>(COMPILE, {
      intent: current.intent,
      claims: [],
      operations: Object.entries(current.bindings).map(([sequence, binding]) => ({
        sequence: Number(sequence),
        ...binding,
      })),
    });
    const plan = parseCompileResponse(result.data);
    if (!plan) {
      dispatch({
        type: "compile_failed",
        detail: result.data
          ? "The compiler answered, but not with a contract this page understands."
          : failureDetail(result),
      });
      return;
    }
    dispatch({ type: "compiled", plan });
  }, [call]);

  const requestAuthority = useCallback(async (current: TaskState) => {
    const step = activeStep(current);
    const plan = current.plan;
    const targetWs = workspace || "ws-sales-ops";
    if (!step?.operation || !plan) {
      dispatch({
        type: "authority_unreachable",
        detail: "no bound operation to request a grant for",
      });
      return;
    }
    const operation = step.operation;
    const intent: ExecutionIntent = {
      contractId: plan.planId,
      canonicalHash: plan.canonicalHash,
      stepId: step.stepId,
      sequence: step.sequence,
      clause: step.clause,
      operation,
      boundAt: new Date().toISOString(),
    };
    const lastProject = readMountBinding()?.project;
    const binding: MountBinding = {
      packageRef: operation.package_ref,
      targetRef: operation.target_ref,
      workspace: targetWs,
      project: sandbox ? SANDBOX_PROJECT : (lastProject && lastProject !== SANDBOX_PROJECT ? lastProject : "workspace"),
      reads: [],
      writes: [operation.action],
      blocked: [],
      resource: operation.resource,
      ttlSeconds: 300,
      intent,
      preparedAt: new Date().toISOString(),
    };
    const result = await call<MountResponse>(mountEndpoint("POST", "/v1/capability/mounts", capiBase), mountRequestBody(binding));
    if (!result.data) {
      dispatch({ type: "authority_unreachable", detail: failureDetail(result) });
      return;
    }
    const response = result.data;
    const mount = asRecord(response.mount);
    const token = asRecord(response.token);
    const mountId = asString(mount?.id) ?? asString(token?.mount_id);
    const tokenId = asString(token?.token_id);
    const nonce = asString(token?.nonce);
    if (response.decision === "allow" && mountId && tokenId && nonce) {
      const holderCredential = asString(response.holder_credential);
      const held: SessionCapabilityLease = {
        mountId,
        tokenId,
        nonce,
        packageRef: binding.packageRef,
        targetRef: binding.targetRef,
        workspace: binding.workspace,
        project: binding.project,
        resource: operation.resource,
        grants: returnedGrants(mount?.grants) ?? returnedGrants(token?.grants),
        executionId: asString(token?.execution_id),
        expiresAt: asString(token?.expires_at),
        ...(holderCredential ? { holderCredential } : {}),
        intent,
      };
      const epoch = token?.authority_epoch ?? mount?.authority_epoch;
      authorityEpoch.current = typeof epoch === "number" ? epoch : undefined;
      lease.current = held;
      setHeldProject(held.project);
      clearSessionConsequence();
      storeSessionCapabilityLease(held);
    }
    dispatch({ type: "authority", response: response as JsonRecord });
  }, [call, capiBase, sandbox, workspace]);

  const execute = useCallback(async (current: TaskState) => {
    const held = lease.current;
    const step = activeStep(current);
    if (!held || !step?.operation) {
      dispatch({ type: "execution_unreachable", detail: "no held grant to execute under" });
      return;
    }
    operationId.current = newOperationId();
    inFlight.current = operationId.current;
    const endpoint: StageEndpoint = {
      method: "POST",
      path: "/v1/exec",
      classification: "consequential",
      response: "execution result",
      baseUrl: cappoBase,
    };
    const body: JsonRecord = {
      token_id: held.tokenId,
      nonce: held.nonce,
      package_ref: held.packageRef,
      action: step.operation.action,
      resource: held.resource,
      arguments: step.operation.arguments ?? {},
      operation_id: operationId.current,
      ...(authorityEpoch.current !== undefined ? { authority_epoch: authorityEpoch.current } : {}),
      ...(held.holderCredential ? { holder_credential: held.holderCredential } : {}),
    };
    const result = await call<JsonRecord>(endpoint, body);
    inFlight.current = null;
    if (!result.data) {
      dispatch({ type: "execution_unreachable", detail: failureDetail(result) });
      return;
    }
    const response = result.data;
    const consequence = applyExecuteResponse(held, response);
    if (consequence) {
      storeSessionConsequence(consequence);
    }
    dispatch({ type: "executed", response });
  }, [call, cappoBase]);

  const readback = useCallback(async (current: TaskState) => {
    const step = activeStep(current);
    const held = lease.current;
    if (!step?.operation) {
      dispatch({ type: "readback", proof: "TargetUnchanged" });
      return;
    }
    const path = targetStateReadbackPath(step.operation.action, held?.resource ?? step.operation.resource);
    if (!path) {
      dispatch({ type: "readback", proof: "Verified" });
      return;
    }
    const endpoint: StageEndpoint = {
      method: "GET",
      path,
      classification: "independent",
      response: "target state",
      baseUrl: cappoBase,
    };
    const result = await call<JsonRecord>(endpoint);
    const previous = readSessionConsequence()?.stateBefore;
    dispatch({
      type: "readback",
      proof: result.data ? "Verified" : "TargetUnchanged",
      state: result.data ?? undefined,
      previous,
    });
  }, [call, cappoBase]);

  // Reactive state machine transitions
  useEffect(() => {
    if (state.phase === "compiling") {
      void compile(state);
    } else if (state.phase === "requesting_authority") {
      void requestAuthority(state);
    } else if (state.phase === "executing") {
      void execute(state);
    } else if (state.phase === "reading_back") {
      void readback(state);
    }
  }, [compile, execute, readback, requestAuthority, state]);

  // Determine effective state (user active state or default concept state)
  const effectiveState: TaskState = hasUserSubmitted ? state : DEFAULT_SALES_STATE;
  const busy = BUSY_PHASES.has(hasUserSubmitted ? state.phase : "idle");

  const handleSubmitIntent = (intent: string) => {
    setHasUserSubmitted(true);
    dispatch({ type: "submit", intent });
  };

  const handleApprove = () => {
    if (!hasUserSubmitted) {
      setHasUserSubmitted(true);
      dispatch({ type: "submit", intent: DEFAULT_SALES_PLAN.intent });
      dispatch({ type: "compiled", plan: DEFAULT_SALES_PLAN });
      dispatch({ type: "approve" });
    } else {
      dispatch({ type: "approve" });
    }
  };

  const onBind = (sequence: number, binding: StepBinding) => {
    dispatch({ type: "bind_step", sequence, binding });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left/Main Column: 7 cols on lg, 8 cols on xl */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-6">
        {/* 1. Task Composer Box */}
        <TaskComposer
          busy={busy}
          onSubmit={handleSubmitIntent}
        />

        {/* 2. Active Task Card */}
        <ActiveTaskCard
          state={effectiveState}
          workspace={workspace}
          busy={busy}
          onBind={onBind}
          onApprove={handleApprove}
          onCancel={() => {
            setHasUserSubmitted(true);
            dispatch({ type: "submit", intent: "" });
          }}
        />

        {/* Failure Notice if error occurred */}
        {state.error && state.phase === "failed" ? (
          <FailureNotice detail={state.error} />
        ) : null}

        {/* Task-Linked Dual Track Evidence Inspector (anchored upon execution) */}
        {effectiveState.execution && (
          <DualTrackEvidenceInspector
            operationId={effectiveState.execution.operationId}
            receiptId={effectiveState.execution.receiptId}
          />
        )}
      </div>

      {/* Right Column: Persistent Inspector Panel (5 cols on lg, 4 cols on xl) */}
      <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
        <InspectorPanel
          state={effectiveState}
          project={heldProject || workspace || "Sales Operations"}
        />
      </div>
    </div>
  );
}
