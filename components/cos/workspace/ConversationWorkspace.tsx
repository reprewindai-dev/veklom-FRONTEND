"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { FailureNotice } from "@/components/cos/StageParts";
import { asRecord, asString, mountEndpoint, returnedGrants, type JsonRecord, type MountResponse } from "@/components/cos/MountParts";
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
import type { StepBinding, TaskState } from "@/lib/cos/tasks/task-types";
import type { StageCallResult, useStageData } from "@/lib/cos/useStageData";
import { readBoundWorkspaceId } from "@/lib/cos/workspace-session";
import { ActionReviewCard } from "./ActionReviewCard";
import { ActiveTaskCard } from "./ActiveTaskCard";
import { ConversationLog } from "./ConversationLog";
import { InspectorPanel } from "./InspectorPanel";
import { PipelineCanvas } from "./PipelineCanvas";
import { TaskComposer } from "./TaskComposer";
import { TaskReceipt } from "./TaskReceipt";

type StageData = ReturnType<typeof useStageData>;

const COMPILE: StageEndpoint = { method: "POST", path: "/api/abide/v1/blueprint/compile", classification: "present", response: "ABIDE contract" };

function newOperationId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `op-${Date.now()}`;
}

function failureDetail(result: StageCallResult<unknown>): string {
  return result.record.error || `HTTP ${result.record.status ?? "unreachable"}`;
}

const BUSY_PHASES: ReadonlySet<TaskState["phase"]> = new Set(["compiling", "requesting_authority", "executing", "reading_back"]);

/**
 * One conversation that drives the lifecycle the operator pages drive, through the same routes
 * and the same session storage: the Mount/Authority/Execute pages and the Consequence Ring read
 * whatever this surface does. Every transition is a response or the user's click; see task-reducer.
 */
export function ConversationWorkspace({ data }: { data: StageData }) {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const { me } = useAuth();
  const sandbox = useSandboxMode();
  const [workspace, setWorkspace] = useState<string | null>(null);
  // The project CAPPO scoped the held grant to, kept in state because the receipt renders it.
  const [heldProject, setHeldProject] = useState<string | undefined>(undefined);
  const capiBase = getStage("mount").endpoints[0]?.baseUrl;
  const cappoBase = getStage("execute").endpoints[0]?.baseUrl;
  // The lease and the operation id of the run in progress live outside the reducer: they are
  // credentials and transport details, not task state.
  const lease = useRef<SessionCapabilityLease | null>(null);
  const operationId = useRef<string>("");
  const authorityEpoch = useRef<number | undefined>(undefined);
  const inFlight = useRef<string | null>(null);
  const { call } = data;

  useEffect(() => {
    const profileWorkspace = typeof me?.workspace_id === "string" ? me.workspace_id : null;
    setWorkspace(readBoundWorkspaceId() || profileWorkspace);
  }, [me?.workspace_id]);

  const compile = useCallback(async (current: TaskState) => {
    const result = await call<unknown>(COMPILE, {
      intent: current.intent,
      claims: [],
      operations: Object.entries(current.bindings).map(([sequence, binding]) => ({ sequence: Number(sequence), ...binding })),
    });
    const plan = parseCompileResponse(result.data);
    if (!plan) {
      dispatch({ type: "compile_failed", detail: result.data ? "The compiler answered, but not with a contract this page understands." : failureDetail(result) });
      return;
    }
    dispatch({ type: "compiled", plan });
  }, [call]);

  const requestAuthority = useCallback(async (current: TaskState) => {
    const step = activeStep(current);
    const plan = current.plan;
    if (!step?.operation || !plan || !workspace) {
      dispatch({ type: "authority_unreachable", detail: workspace ? "no bound operation to request a grant for" : "no workspace is bound to this session" });
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
    // Same binding the Mount page would prepare, same request body Authority would send.
    const lastProject = readMountBinding()?.project;
    const binding: MountBinding = {
      packageRef: operation.package_ref,
      targetRef: operation.target_ref,
      workspace,
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
      // The epoch the grant was issued at, when the authority layer states it; it is presented
      // back on execute so a stale holder cannot pass by omitting it.
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
    const operation = held?.intent?.operation;
    if (!held || !operation) {
      dispatch({ type: "execute_unreachable", detail: "no grant is held for this operation", operationId: operationId.current || newOperationId() });
      return;
    }
    const opId = newOperationId();
    operationId.current = opId;
    const body: JsonRecord = {
      token_id: held.tokenId,
      nonce: held.nonce,
      action: operation.action,
      target_ref: operation.target_ref,
      resource: operation.resource,
      arguments: operation.arguments,
      operation_id: opId,
      ...(authorityEpoch.current !== undefined ? { authority_epoch: authorityEpoch.current } : {}),
    };
    storeSessionConsequence({ mountId: held.mountId, response: { operation_id: opId, decision: "pending" }, denials: [] });
    const result = await call<JsonRecord>(mountEndpoint("POST", `/v1/capability/mounts/${held.mountId}/execute`, cappoBase), body);
    if (!result.data) {
      dispatch({ type: "execute_unreachable", detail: failureDetail(result), operationId: opId });
      return;
    }
    const response = result.data;
    storeSessionConsequence({
      mountId: held.mountId,
      response,
      lastAllowedResponse: response.decision === "allow" ? response : undefined,
      denials: [],
    });
    const next = { ...applyExecuteResponse(held, response), lastOperationId: opId };
    lease.current = next;
    storeSessionCapabilityLease(next);
    dispatch({ type: "executed", response, operationId: opId });
    void current;
  }, [call, cappoBase]);

  const readBack = useCallback(async () => {
    const held = lease.current;
    const operation = held?.intent?.operation;
    if (!held || !operation) {
      dispatch({ type: "readback", response: { error: "no held grant names the target to read back" } });
      return;
    }
    const result = await call<JsonRecord>(mountEndpoint("GET", targetStateReadbackPath(operation.target_ref, operation.resource, held.mountId), cappoBase));
    const response = result.data ?? { error: failureDetail(result) };
    const existing = readSessionConsequence(held.mountId);
    storeSessionConsequence({
      mountId: held.mountId,
      response: existing?.response ?? {},
      lastAllowedResponse: existing?.lastAllowedResponse,
      readback: response,
      pglProof: existing?.pglProof,
      denials: existing?.denials ?? [],
    });
    dispatch({ type: "readback", response });
  }, [call, cappoBase]);

  // Each phase that needs a network call runs it exactly once per entry into that phase.
  useEffect(() => {
    const key = `${state.phase}:${state.seq}`;
    if (inFlight.current === key) return;
    switch (state.phase) {
      case "compiling":
        inFlight.current = key;
        void compile(state);
        break;
      case "requesting_authority":
        inFlight.current = key;
        void requestAuthority(state);
        break;
      case "executing":
        inFlight.current = key;
        void execute(state);
        break;
      case "reading_back":
        inFlight.current = key;
        void readBack();
        break;
      case "outcome_unknown":
        // A lost execute answer: read the target before anyone decides what happened.
        if (!state.readback) {
          inFlight.current = key;
          void readBack();
        }
        break;
      default:
        break;
    }
  }, [state, compile, requestAuthority, execute, readBack]);

  const busy = BUSY_PHASES.has(state.phase);

  function onBind(sequence: number, binding: StepBinding) {
    dispatch({ type: "bind", sequence, binding });
  }

  return (
    <div className="xl:col-span-2 space-y-6">
      {/* 1. Full-Width Task Composer Box */}
      <TaskComposer
        busy={busy}
        onSubmit={(intent) => dispatch({ type: "submit", intent })}
      />

      {/* 2. Main 2-Column Section: Active Task Card (Left) + Inspector Rail (Right) */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] items-start">
        {/* Left Column: Active Task Workspace */}
        <div className="space-y-6">
          <ActiveTaskCard
            state={state}
            workspace={workspace}
            busy={busy}
            onBind={onBind}
            onApprove={() => dispatch({ type: "approve" })}
            onCancel={() => dispatch({ type: "submit", intent: "" })}
          />

          {/* Activity / Conversation Log */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#080d1a]/80 p-5 space-y-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Task Activity Stream
            </div>
            <ConversationLog messages={state.messages} />
          </div>

          {/* Failure Notice on Error */}
          {state.error && state.phase === "failed" ? (
            <FailureNotice detail={state.error} />
          ) : null}
        </div>

        {/* Right Column: Inspector Panel */}
        <div>
          <InspectorPanel state={state} project={heldProject} />
        </div>
      </div>
    </div>
  );
}
