"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Code2,
  Copy,
  Download,
  Eye,
  FileText,
  GitBranch,
  Info,
  MessageSquare,
  Paperclip,
  Send,
  ShieldCheck,
  X,
  Check,
} from "lucide-react";
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
import { ActionApprovalCard } from "./ActionApprovalCard";
import { ConversationLog } from "./ConversationLog";
import { HorizontalExecutionDAG } from "./HorizontalExecutionDAG";
import { InspectorPanel } from "./InspectorPanel";
import { TaskReceipt } from "./TaskReceipt";
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

export function ConversationWorkspace({ data }: { data: StageData }) {
  const [state, dispatch] = useReducer(taskReducer, initialTaskState);
  const { me } = useAuth();
  const sandbox = useSandboxMode();
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [heldProject, setHeldProject] = useState<string | undefined>(undefined);
  
  // UI States matching Concept 2 (media_1792384473666_34e07e62.png)
  const [activeTab, setActiveTab] = useState<"conversation" | "graph" | "python">("graph");
  const [pythonDrawerOpen, setPythonDrawerOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inputPrompt, setInputPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const capiBase = getStage("mount").endpoints[0]?.baseUrl;
  const cappoBase = getStage("execute").endpoints[0]?.baseUrl;

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
    if (!step?.operation || !plan || !workspace) {
      dispatch({
        type: "authority_unreachable",
        detail: workspace
          ? "no bound operation to request a grant for"
          : "no workspace is bound to this session",
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
      dispatch({
        type: "execute_unreachable",
        detail: "no grant is held for this operation",
        operationId: operationId.current || newOperationId(),
      });
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

  function handlePromptSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = inputPrompt.trim();
    if (!prompt || busy) return;
    dispatch({ type: "submit", intent: prompt });
    setInputPrompt("");
    setActiveTab("graph");
  }

  const generatedPython = state.plan?.pythonCode
    ? state.plan.pythonCode
    : state.plan
      ? `# VEKLOM CAPABILITY OS — COMPILED CONTRACT
# Contract ID: ${state.plan.planId}
# Canonical Hash: ${state.plan.canonicalHash}
# Verdict: ${state.plan.verdict}
# Bound Steps (${state.plan.steps.length}):
${state.plan.steps
  .map(
    (s) =>
      `#   Step ${s.sequence}: ${s.clause}\n#     Action: ${s.action ?? "unbound"}\n#     Coverage: ${s.coverage}`
  )
  .join("\n")}
#
# Note: Full python pipeline bytecode is emitted by ABIDE (/api/abide/v1/blueprint/compile).`
      : `# No compiled contract yet.
# Enter intent and click "Compile to Python" to invoke the ABIDE compiler.
`;
  const compiledPythonReady = Boolean(state.plan);

  function handleCompileToPython() {
    if (!state.plan && state.intent) {
      void compile(state);
    }
    setPythonDrawerOpen(true);
    setActiveTab("python");
  }

  function handleCopyPython() {
    navigator.clipboard.writeText(generatedPython);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPython() {
    const blob = new Blob([generatedPython], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `veklom_task_${state.plan?.planId || "draft"}.py`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleRunWithGovernance() {
    if (state.phase === "needs_review") {
      dispatch({ type: "approve" });
    } else if (state.plan) {
      dispatch({ type: "approve" });
    }
  }

  function handleAttachmentClick() {
    const filename = prompt("Enter attachment filename to bind to context:", "dataset.csv");
    if (filename && filename.trim() && !attachments.includes(filename.trim())) {
      setAttachments((prev) => [...prev, filename.trim()]);
    }
  }

  return (
    <div className="xl:col-span-2 space-y-6">
      {/* 0. 12 GOVERNED COMPUTES DIAL-IN STATUS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/30 bg-[#080d1a]/95 px-5 py-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300">
            12/12 Governed Computes Connected
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
            RC1 Sealed · Zero Ambient Authority · Dual-State Consequence Engine Live
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="rounded bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-slate-300">ABIDE: 8010</span>
          <span className="rounded bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-slate-300">CAPPO: 8002</span>
          <span className="rounded bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-slate-300">cAPI: 3003</span>
          <span className="rounded bg-slate-800/90 border border-slate-700/60 px-2 py-0.5 text-slate-300">PGL: 8001</span>
        </div>
      </div>

      {/* 1. TOP CARD: CHAT / CONVERSATION AREA (Annotation 2) */}
      <section className="rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md p-6 space-y-4 shadow-xl">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          What do you need to do?
        </h2>

        {state.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-600 stroke-[1.5]" />
            <p className="text-sm text-slate-400">
              Your conversation and task results appear here.
            </p>
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto pr-1">
            <ConversationLog messages={state.messages} />
          </div>
        )}
      </section>

      {/* 2. MIDDLE CARD: DYNAMIC DAG, COMPILER, & RUN ACTIONS (Annotations 3, 4, 5) */}
      <section className="rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md p-6 space-y-5 shadow-xl">
        {/* Tab Bar + Compile Button Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("conversation")}
              className={`flex items-center gap-2 text-sm font-medium pb-2 -mb-4 transition border-b-2 ${
                activeTab === "conversation"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare size={16} />
              <span>Conversation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("graph")}
              className={`flex items-center gap-2 text-sm font-medium pb-2 -mb-4 transition border-b-2 ${
                activeTab === "graph"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <GitBranch size={16} />
              <span>Task graph</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("python")}
              className={`flex items-center gap-2 text-sm font-medium pb-2 -mb-4 transition border-b-2 ${
                activeTab === "python"
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Code2 size={16} />
              <span>Python</span>
            </button>
          </div>

          {/* Right: Compile to Python */}
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleCompileToPython}
              disabled={busy || !state.intent}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 px-4 py-2 text-xs font-semibold text-slate-950 transition shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              <Code2 size={14} />
              <span>Compile to Python</span>
            </button>
            <span className="text-[10px] text-slate-500 font-mono">
              Compiles the current graph — does not run it.
            </span>
          </div>
        </div>

        {/* Tab Body */}
        {activeTab === "graph" || activeTab === "conversation" ? (
          <div className="rounded-xl border border-dashed border-slate-700/80 bg-[#0a1224]/60 p-5 space-y-4">
            <div className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
              TASK GRAPH — GENERATED FROM YOUR REQUEST
            </div>

            {/* Dynamic Graph Flow */}
            <HorizontalExecutionDAG state={state} />

            <div className="text-[11px] text-slate-500 font-mono">
              Structure and nodes change with the task. No execution has occurred.
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-[#050914] p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
            <pre>{generatedPython}</pre>
          </div>
        )}

        {/* Drawer / Run Actions Row (Annotation 5) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          {/* Left: Collapsible Generated Python */}
          <button
            type="button"
            onClick={() => setPythonDrawerOpen(!pythonDrawerOpen)}
            className="inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition"
          >
            <ChevronDown size={14} className={`transform transition-transform ${pythonDrawerOpen ? "rotate-180" : ""}`} />
            <span>Generated Python · {compiledPythonReady ? "available" : "available after compilation"}</span>
          </button>

          {/* Right: Copy, Download, Run with Governance */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCopyPython}
              disabled={!compiledPythonReady}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-40"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPython}
              disabled={!compiledPythonReady}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition disabled:opacity-40"
            >
              <Download size={13} />
              <span>Download</span>
            </button>

            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={handleRunWithGovernance}
                disabled={busy || !workspace}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-950 transition shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                <ShieldCheck size={14} />
                <span>Run with governance</span>
              </button>
              <span className="text-[10px] text-slate-500 font-mono">
                Separate from compilation.
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Python Drawer Content */}
        {pythonDrawerOpen && (
          <div className="rounded-xl border border-slate-800 bg-[#050914] p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-72">
            <pre>{generatedPython}</pre>
          </div>
        )}
      </section>

      {/* 3. QUESTIONS, APPROVALS, & BOTTOM PROMPT BAR (Annotation 5 & 6) */}
      <section className="space-y-3">
        {/* Notice */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Info size={14} className="text-slate-500" />
          <span>Questions and approvals appear here only when needed.</span>
        </div>

        {/* Dynamic Contextual Action / Approval Card */}
        {(state.phase === "needs_review" || state.phase === "needs_input") && (
          <ActionApprovalCard
            state={state}
            workspace={workspace}
            busy={busy}
            onBind={onBind}
            onApprove={() => dispatch({ type: "approve" })}
            onCancel={() => dispatch({ type: "submit", intent: "" })}
          />
        )}

        {/* Failure Notice on Error */}
        {state.error && state.phase === "failed" ? (
          <FailureNotice detail={state.error} />
        ) : null}

        {/* Task-Linked Audit Receipt */}
        {(state.authority || state.execution) && (
          <div className="rounded-2xl border border-slate-800/80 bg-[#080d1a]/90 backdrop-blur-md p-5 space-y-4 shadow-xl">
            <div className="font-mono text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
              TASK-LINKED AUDIT RECEIPT &amp; SINK READBACK
            </div>
            <TaskReceipt state={state} project={heldProject} />
          </div>
        )}

        {/* Dual-Track Enterprise Audit Surface (Human-Readable + Machine GraphQL) */}
        {state.execution && (
          <DualTrackEvidenceInspector
            operationId={state.execution.operationId}
            receiptId={state.execution.receiptId}
          />
        )}

        {/* Pill Prompt Input Bar */}
        <form onSubmit={handlePromptSubmit} className="relative">
          <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-[#0d1627] px-4 py-2.5 focus-within:border-cyan-500/50 shadow-lg transition">
            <button
              type="button"
              onClick={handleAttachmentClick}
              className="text-slate-400 hover:text-slate-200 transition"
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>

            {attachments.length > 0 && (
              <div className="flex items-center gap-1.5">
                {attachments.map((att) => (
                  <span
                    key={att}
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-300"
                  >
                    <span>{att}</span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((a) => a !== att))}
                      className="text-slate-500 hover:text-white"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              disabled={busy}
              placeholder="Describe any supported task..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={busy || !inputPrompt.trim()}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 flex items-center justify-center transition disabled:opacity-40 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </div>
        </form>

        {/* Bottom-Right Links (Annotation 6) */}
        <div className="flex items-center justify-end gap-5 pt-1 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition"
          >
            <Eye size={14} />
            <span>Inspect task</span>
          </button>

          <Link
            href="/os/evidence"
            className="inline-flex items-center gap-1.5 hover:text-cyan-400 transition"
          >
            <FileText size={14} />
            <span>View evidence</span>
          </Link>
        </div>
      </section>

      {/* Inspector Panel Overlay / Side Drawer */}
      {inspectorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#091122] border-l border-slate-800 p-6 overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Task Inspector & Telemetry</h3>
              <button
                type="button"
                onClick={() => setInspectorOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <InspectorPanel state={state} project={heldProject} />
          </div>
        </div>
      )}

      {/* 4. PLATFORM FOOTER (Annotation: Behind the interface) */}
      <footer className="flex items-center justify-center gap-3 py-6 text-xs text-slate-400 border-t border-slate-800/40">
        <div className="text-cyan-400 font-mono text-sm">⬡</div>
        <div>
          <span className="font-semibold text-slate-300">Behind the interface: </span>
          existing planning · capability binding · policy · CAPPO authority · execution · evidence. Preserved, not replaced.
        </div>
      </footer>
    </div>
  );
}
