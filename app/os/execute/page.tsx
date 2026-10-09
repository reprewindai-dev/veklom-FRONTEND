"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Ban, CheckCircle2, CircleAlert, RotateCcw, ShieldCheck, SquareTerminal } from "lucide-react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { PhaseTrace, type TracePhase } from "@/components/cos/PhaseTrace";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { describeArguments, readPendingExecutionIntent, type BoundOperation, type ExecutionIntent } from "@/lib/cos/execution-intent";
import { ScopeTag } from "@/components/cos/EnvironmentFrame";
import { api } from "@/lib/api";
import {
  readRetainedCapabilityLeases,
  readSessionCapabilityLease,
  type RetainedCapabilityLease,
  readSessionConsequence,
  storeSessionCapabilityLease,
  storeSessionConsequence,
  applyExecuteResponse,
  applyTerminateResponse,
  type SessionCapabilityLease,
  type SessionConsequenceDenial,
  type SessionConsequenceRecord,
  type SessionTargetReadback,
} from "@/lib/cos/lease-session";
import {
  compareReadback,
  pglChainVerifyPath,
  pglProof,
  pglProofLabel,
  pglProofPath,
  targetStateReadbackPath,
  type PglProofLookup,
} from "@/lib/cos/readback";
import type { ProofStatus } from "@/lib/cos/capabilities";

type JsonRecord = Record<string, unknown>;
function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function endpoint(
  method: StageEndpoint["method"],
  path: string,
  baseUrl?: string,
): StageEndpoint {
  return { method, path, classification: "present", response: "CAPPO response", baseUrl };
}

function responseDecision(response: JsonRecord | undefined): string | undefined {
  return asString(response?.decision);
}

function proofFor(
  response: JsonRecord | undefined,
  replayInvariantViolation = false,
  pglLookup?: PglProofLookup,
): ProofStatus {
  if (replayInvariantViolation) return "Degraded";
  if (responseDecision(response) !== "allow") return "Needs proof";
  return pglProof(response?.anchoring, pglLookup);
}

function appendDenial(
  existing: SessionConsequenceRecord | null,
  mountId: string,
  denial: SessionConsequenceDenial,
): SessionConsequenceRecord {
  return {
    mountId,
    response: existing?.response ?? {},
    readback: existing?.readback,
    pglProof: existing?.pglProof,
    recordedAt: existing?.recordedAt ?? new Date().toISOString(),
    denials: [...(existing?.denials ?? []), denial],
  };
}

function newOperationId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `op-${Date.now()}`;
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not returned";
  return typeof value === "string" ? value : JSON.stringify(value);
}

/** CAPPO's execute request for a bound operation; every field comes from the contract. */
function executeBody(
  credentials: { tokenId: string; nonce: string },
  operation: BoundOperation,
  operationId: string,
): JsonRecord {
  return {
    token_id: credentials.tokenId,
    nonce: credentials.nonce,
    action: operation.action,
    target_ref: operation.target_ref,
    resource: operation.resource,
    arguments: operation.arguments,
    operation_id: operationId,
  };
}

function BoundOperationCard({ intent, note }: { intent: ExecutionIntent; note: string }) {
  const op = intent.operation;
  return (
    <div className="rounded-lg border border-cos-accent/30 bg-cos-accent/[0.04] p-3 text-xs">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Bounded operation · contract {intent.contractId} · step {intent.sequence}</div>
      <div className="mt-1 text-cos-text">{intent.clause}</div>
      <div className="mt-2 grid gap-1 font-mono text-cos-text sm:grid-cols-2">
        <div><span className="text-cos-steel">action </span>{op.action}</div>
        <div><span className="text-cos-steel">target </span>{op.target_ref}</div>
        <div><span className="text-cos-steel">resource </span>{op.resource}</div>
        <div><span className="text-cos-steel">arguments </span>{describeArguments(op.arguments)}</div>
      </div>
      <p className="mt-2 text-[10px] text-cos-steel">{note}</p>
    </div>
  );
}

/** A target's own state statement, shown field by field, never interpreted here. */
function StateFields({ state }: { state: JsonRecord | undefined }) {
  if (!state) return <div className="font-mono text-xs text-cos-muted">Not returned</div>;
  return (
    <dl className="grid gap-1 font-mono text-[11px]">
      {Object.entries(state).map(([key, value]) => (
        <div key={key} className="flex gap-2"><dt className="shrink-0 text-cos-steel">{key}</dt><dd className="break-all text-cos-text">{displayValue(value)}</dd></div>
      ))}
    </dl>
  );
}

export default function ExecutePage() {
  const stage = getStage("execute");
  const data = useStageData("execute");
  const cappoBase = stage.endpoints[0]?.baseUrl;
  const [lease, setLease] = useState<SessionCapabilityLease | null>(() => readSessionCapabilityLease());
  const [consequence, setConsequence] = useState<SessionConsequenceRecord | null>(() => {
    const currentLease = readSessionCapabilityLease();
    return readSessionConsequence(currentLease?.mountId);
  });
  const [lastResponse, setLastResponse] = useState<JsonRecord | undefined>(() => {
    const currentLease = readSessionCapabilityLease();
    return readSessionConsequence(currentLease?.mountId)?.response;
  });
  const [busyAction, setBusyAction] = useState<"forbidden_action" | "execute" | "revoke" | "retry" | "readback" | "pgl" | "no_authority" | "retained" | null>(null);
  const [pendingIntent, setPendingIntent] = useState<ExecutionIntent | null>(null);
  const [retained, setRetained] = useState<RetainedCapabilityLease[]>([]);
  // Attempts made while no mount is held: there is no lease to file them under.
  const [noAuthorityAttempts, setNoAuthorityAttempts] = useState<SessionConsequenceDenial[]>([]);
  const [lastLatency, setLastLatency] = useState<number>();
  const [lastStatus, setLastStatus] = useState<number>();
  const [replayInvariantViolation, setReplayInvariantViolation] = useState(false);
  const [operationId, setOperationId] = useState(() => {
    const currentLease = readSessionCapabilityLease();
    const persisted = readSessionConsequence(currentLease?.mountId)?.response?.operation_id;
    return typeof persisted === "string" ? persisted : newOperationId();
  });

  useEffect(() => {
    const syncLease = () => {
      setLease(readSessionCapabilityLease());
      setRetained(readRetainedCapabilityLeases());
      setPendingIntent(readPendingExecutionIntent());
    };
    syncLease();
    window.addEventListener("veklom.capability_lease.changed", syncLease);
    return () => window.removeEventListener("veklom.capability_lease.changed", syncLease);
  }, []);

  useEffect(() => {
    const nextConsequence = readSessionConsequence(lease?.mountId);
    setConsequence(nextConsequence);
    setLastResponse(nextConsequence?.response);
    const persisted = nextConsequence?.response?.operation_id;
    setOperationId(typeof persisted === "string" ? persisted : newOperationId());
    setReplayInvariantViolation(false);
  }, [lease?.mountId]);

  // Execute only carries what the contract bound: no action, target or argument is chosen here.
  const operation = lease?.intent?.operation;
  const targetRef = operation?.target_ref ?? lease?.targetRef;
  const resource = operation?.resource ?? lease?.resource;
  const blockedAction = lease?.grants?.blocked?.[0];
  const retainedOthers = retained.filter((item) => item.mountId !== lease?.mountId);
  const mountIsLive = Boolean(lease && !lease.terminated);
  const hasAttemptedExecute = Boolean(consequence?.response?.operation_id) || Boolean(lastResponse?.operation_id);
  const successfulResponse = useMemo(() => {
    if (lastResponse?.decision === "allow" && asRecord(lastResponse.consequence)) return lastResponse;
    return consequence?.lastAllowedResponse
      ?? (consequence?.response?.decision === "allow" ? consequence.response : undefined);
  }, [consequence?.lastAllowedResponse, consequence?.response, lastResponse]);
  const consequencePayload = asRecord(successfulResponse?.consequence);
  const resultingState = asRecord(consequencePayload?.resulting_state);
  const authority = asRecord(successfulResponse?.authority);
  const anchoring = asRecord(successfulResponse?.anchoring);
  const readback = consequence?.readback as SessionTargetReadback | undefined;
  const readbackState = asRecord(readback?.state);
  const readbackError = asString(readback?.error);
  const readbackProject = asString(readback?.project);
  const readbackProof = compareReadback(resultingState, readback);
  const receiptId = asString(consequencePayload?.receipt_id);
  const executionId = asString(authority?.execution_id) ?? lease?.executionId;
  const lastRevoke = [...(consequence?.denials ?? [])]
    .reverse()
    .find((item) => item.attempt === "revoke");
  const phases: TracePhase[] = [
    { id: "authorize", name: "Authorize", status: lease ? "complete" : "pending", kind: "authority" },
    {
      id: "execute",
      name: "Execute",
      status: busyAction === "execute" ? "current" : successfulResponse ? "complete" : "pending",
      kind: "execution",
    },
    { id: "evidence", name: "Evidence", status: receiptId ? "complete" : "pending", kind: "transport" },
    {
      id: "revoke",
      name: "Revoke",
      status: lease?.terminated ? "complete" : "pending",
      kind: "authority",
    },
    {
      id: "retry",
      name: "Retry",
      status: consequence?.denials.some((item) => item.attempt === "retry") ? "complete" : "pending",
      kind: "execution",
    },
  ];

  async function callCappo<T>(request: StageEndpoint, body?: JsonRecord) {
    const started = performance.now();
    const result = await data.call<T>(request, body);
    setLastLatency(Math.round((performance.now() - started) * 100) / 100);
    setLastStatus(result.record.status);
    return result;
  }

  function persistResponse(
    response: JsonRecord,
    denials = consequence?.denials ?? [],
    persistedReadback = consequence?.readback,
  ) {
    if (!lease) return;
    const record = {
      mountId: lease.mountId,
      response,
      lastAllowedResponse: responseDecision(response) === "allow"
        ? response
        : consequence?.lastAllowedResponse,
      readback: persistedReadback,
      pglProof: consequence?.pglProof,
      denials,
    };
    storeSessionConsequence(record);
    setConsequence(lease ? readSessionConsequence(lease.mountId) : null);
    setLastResponse(response);
  }

  async function attemptBlockedAction() {
    if (!lease || !mountIsLive || !blockedAction) return;
    setBusyAction("forbidden_action");
    const result = await callCappo<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${lease.mountId}/actions`, cappoBase),
      {
        token_id: lease.tokenId,
        nonce: lease.nonce,
        action: blockedAction,
        resource,
      },
    );
    const response = result.data ?? {
      decision: "error",
      reason: `HTTP ${result.record.status ?? "unreachable"}`,
      operation_id: operationId,
    };
    const denial = {
      attempt: "forbidden_action" as const,
      decision: asString(response.decision) ?? "error",
      reason: asString(response.reason) ?? "No reason returned",
      at: new Date().toISOString(),
    };
    const next = appendDenial(consequence, lease.mountId, denial);
    storeSessionConsequence({
      mountId: lease.mountId,
      response: result.data ? lastResponse ?? {} : response,
      lastAllowedResponse: consequence?.lastAllowedResponse,
      readback: consequence?.readback,
      pglProof: consequence?.pglProof,
      denials: next.denials,
    });
    setConsequence(readSessionConsequence(lease.mountId));
    setLastResponse(response);
    setBusyAction(null);
  }

  async function executeBound(attempt: "execute" | "retry") {
    if (!lease || !operation || (attempt === "execute" && !mountIsLive)) return;
    setBusyAction(attempt);
    setReplayInvariantViolation(false);
    const pending = {
      ...(lastResponse ?? consequence?.response ?? {}),
      operation_id: operationId,
      decision: "pending",
    };
    storeSessionConsequence({
      mountId: lease.mountId,
      response: pending,
      lastAllowedResponse: consequence?.lastAllowedResponse,
      readback: consequence?.readback,
      pglProof: consequence?.pglProof,
      denials: consequence?.denials ?? [],
    });
    const result = await callCappo<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${lease.mountId}/execute`, cappoBase),
      executeBody(lease, operation, operationId),
    );
    const response = result.data ?? {
      decision: "error",
      reason: `HTTP ${result.record.status ?? "unreachable"}`,
    };
    const decision = responseDecision(response);
    const nextDenials = [...(consequence?.denials ?? [])];
    if (attempt === "retry" || !result.data) {
      nextDenials.push({
        attempt,
        decision: result.data ? decision ?? "error" : "error",
        reason: asString(response.reason) ?? "No reason returned",
        at: new Date().toISOString(),
      });
    }
    if (attempt === "retry" && decision === "allow") setReplayInvariantViolation(true);
    persistResponse(response, nextDenials, consequence?.readback);
    // Remember the submitted operation_id so the retained credentials can replay it later.
    const nextLease = { ...applyExecuteResponse(lease, response), lastOperationId: operationId };
    storeSessionCapabilityLease(nextLease);
    setLease(nextLease);
    setBusyAction(null);
  }

  /**
   * Submit the contract's operation to CAPPO while holding no mount for it. There is
   * no mount id to name, so the request names none; CAPPO must refuse it.
   */
  async function attemptWithoutAuthority(intent: ExecutionIntent) {
    setBusyAction("no_authority");
    const attemptId = newOperationId();
    const result = await callCappo<JsonRecord>(
      endpoint("POST", "/v1/capability/mounts/no-mount-held/execute", cappoBase),
      executeBody({ tokenId: "none", nonce: "none" }, intent.operation, attemptId),
    );
    const response = result.data ?? { decision: "error", reason: `HTTP ${result.record.status ?? "unreachable"}` };
    setLastResponse(response);
    setNoAuthorityAttempts((list) => [...list, {
      attempt: "no_authority",
      decision: asString(response.decision) ?? "error",
      reason: asString(response.reason) ?? `HTTP ${result.record.status ?? "unreachable"}`,
      at: new Date().toISOString(),
      operationId: attemptId,
    }]);
    if (responseDecision(response) === "allow") setReplayInvariantViolation(true);
    setBusyAction(null);
  }

  /**
   * The machine still holds credentials from an earlier mount. Use them for the
   * operation in front of it now ("retained_token"), for their own original
   * operation again under a new operation id ("retained_own_operation": the
   * authority was consumed, so this tests exactly that), or to replay the exact
   * operation id they once carried ("replay"). All must be refused.
   */
  async function attemptWithRetained(
    item: RetainedCapabilityLease,
    mode: "retained_token" | "retained_own_operation" | "replay",
  ) {
    const op = mode === "retained_token" ? operation : item.intent?.operation;
    const operationIdToSend = mode === "replay" ? item.lastOperationId : newOperationId();
    if (!lease || !op || !operationIdToSend) return;
    setBusyAction("retained");
    const result = await callCappo<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${item.mountId}/execute`, cappoBase),
      executeBody(item, op, operationIdToSend),
    );
    const response = result.data ?? { decision: "error", reason: `HTTP ${result.record.status ?? "unreachable"}` };
    if (responseDecision(response) === "allow") setReplayInvariantViolation(true);
    const current = readSessionConsequence(lease.mountId);
    storeSessionConsequence({
      mountId: lease.mountId,
      response: current?.response ?? lastResponse ?? {},
      lastAllowedResponse: current?.lastAllowedResponse,
      readback: current?.readback,
      pglProof: current?.pglProof,
      denials: [...(current?.denials ?? []), {
        attempt: mode,
        decision: asString(response.decision) ?? "error",
        reason: asString(response.reason) ?? `HTTP ${result.record.status ?? "unreachable"}`,
        at: new Date().toISOString(),
        mountId: item.mountId,
        operationId: operationIdToSend,
      }],
    });
    setConsequence(readSessionConsequence(lease.mountId));
    setLastResponse(response);
    setBusyAction(null);
  }

  async function readTargetState() {
    if (!lease || !targetRef || !resource) return;
    setBusyAction("readback");
    const result = await callCappo<JsonRecord>(
      endpoint(
        "GET",
        targetStateReadbackPath(targetRef, resource, lease.mountId),
        cappoBase,
      ),
    );
    const readbackResponse = result.data ?? {
      error: result.record.error ?? `HTTP ${result.record.status ?? "unreachable"}`,
    };
    const current = readSessionConsequence(lease.mountId);
    storeSessionConsequence({
      mountId: lease.mountId,
      response: current?.response ?? lastResponse ?? {},
      lastAllowedResponse: current?.lastAllowedResponse,
      readback: readbackResponse,
      pglProof: current?.pglProof,
      denials: current?.denials ?? [],
    });
    setConsequence(readSessionConsequence(lease.mountId));
    setBusyAction(null);
  }

  async function verifyPglProof() {
    const eventHash = asString(anchoring?.pgl_event_hash);
    if (!lease || eventHash === undefined) return;
    setBusyAction("pgl");
    const checkedAt = new Date().toISOString();
    try {
      const lookup = await api.get<PglProofLookup>(pglProofPath(eventHash));
      const agentId = asString(anchoring?.pgl_agent_id);
      let chain: PglProofLookup["chain"];
      if (agentId) {
        try {
          chain = await api.get<PglProofLookup["chain"]>(pglChainVerifyPath(agentId));
        } catch (error) {
          chain = {
            error: error instanceof Error ? error.message : "Ledger chain verification failed",
          };
        }
      }
      const current = readSessionConsequence(lease.mountId);
      storeSessionConsequence({
        mountId: lease.mountId,
        response: current?.response ?? lastResponse ?? {},
        lastAllowedResponse: current?.lastAllowedResponse,
        readback: current?.readback,
        pglProof: {
          ...lookup,
          ...(agentId ? { agent_id: agentId, chain } : {}),
          checked_at: checkedAt,
        },
        denials: current?.denials ?? [],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ledger lookup failed";
      const current = readSessionConsequence(lease.mountId);
      storeSessionConsequence({
        mountId: lease.mountId,
        response: current?.response ?? lastResponse ?? {},
        lastAllowedResponse: current?.lastAllowedResponse,
        readback: current?.readback,
        pglProof: { error: message, checked_at: checkedAt },
        denials: current?.denials ?? [],
      });
    }
    setConsequence(readSessionConsequence(lease.mountId));
    setBusyAction(null);
  }

  async function revokeAuthority() {
    if (!lease) return;
    setBusyAction("revoke");
    const result = await callCappo<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${lease.mountId}/terminate`, cappoBase),
      { reason: "explicit_terminate" },
    );
    const response = result.data ?? {
      decision: "error",
      reason: `HTTP ${result.record.status ?? "unreachable"}`,
    };
    const nextLease = result.data
      ? applyTerminateResponse(lease, response)
      : lease;
    if (nextLease !== lease) {
      storeSessionCapabilityLease(nextLease);
      setLease(nextLease);
    }
    const denials = [
      ...(consequence?.denials ?? []),
      {
        attempt: "revoke" as const,
        decision: asString(response.decision) ?? "error",
        reason: asString(response.reason) ?? "No reason returned",
        at: new Date().toISOString(),
      },
    ];
    setLastResponse(response);
    storeSessionConsequence({
      mountId: lease.mountId,
      response,
      lastAllowedResponse: consequence?.lastAllowedResponse,
      readback: consequence?.readback,
      pglProof: consequence?.pglProof,
      denials,
    });
    setConsequence(readSessionConsequence(lease.mountId));
    setBusyAction(null);
  }

  if (!lease) {
    return (
      <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
        <div className="space-y-4">
          <Pillar title="Work" proof="Needs proof">
            {pendingIntent ? (
              <div className="space-y-3">
                <BoundOperationCard intent={pendingIntent} note="No mount is held for this operation. Any attempt now has no authority behind it." />
                <button type="button" onClick={() => void attemptWithoutAuthority(pendingIntent)} disabled={Boolean(busyAction)} className="inline-flex items-center gap-2 rounded-lg border border-cos-warn/40 px-3 py-2 text-xs text-cos-warn disabled:opacity-50">
                  <Ban size={13} /> {busyAction === "no_authority" ? "Attempting…" : "Attempt without authority"}
                </button>
                {noAuthorityAttempts.map((attempt) => (
                  <div key={attempt.operationId ?? attempt.at} className={`rounded-lg border p-3 text-xs ${attempt.decision === "allow" ? "border-cos-danger/60 bg-cos-danger/10" : "border-cos-warn/40 bg-cos-warn/5"}`}>
                    <div className="font-mono uppercase text-cos-text">{attempt.decision === "deny" ? "DENIED" : attempt.decision} · {attempt.reason}</div>
                    <div className="mt-1 font-mono text-[10px] text-cos-steel">operation {attempt.operationId} · {attempt.at}</div>
                    {attempt.decision === "allow" ? <div className="mt-1 text-cos-danger">Invariant violation: allowed without a mount; report this</div> : null}
                  </div>
                ))}
              </div>
            ) : (
              <HonestEmpty
                title="No capability lease held"
                route="POST /v1/capability/mounts/{mount_id}/execute"
                detail="Bind an operation to a contract step in Blueprint, prepare it in Mount, request its single-use grant in Authority, then return here to execute it."
              />
            )}
            <Link href="/os/authority" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent">
              Get a grant in Authority <ArrowRight size={13} />
            </Link>
          </Pillar>
          <Pillar title="Telemetry" proof="Needs proof"><HonestEmpty title="Execution telemetry not observed" route="POST /v1/capability/mounts/{mount_id}/execute" detail="No execution request is issued without a held lease." /></Pillar>
          <Pillar title="Authority" proof="Needs proof"><HonestEmpty title="Execution authority not observed" route="POST /v1/capability/mounts/{mount_id}/execute" detail="The authority layer must return a scoped token and nonce before consequence authority exists." /></Pillar>
        </div>
        <div className="space-y-4">
          <Pillar title="Evidence" proof="Needs proof"><HonestEmpty title="Execution evidence not observed" route="POST /v1/capability/mounts/{mount_id}/execute" detail="No receipt or resulting state has been returned." /></Pillar>
          <Pillar title="Drift" proof="Needs proof"><HonestEmpty title="Execution drift not measured" route="POST /v1/capability/mounts/{mount_id}/execute" detail="No retry or forbidden-action decision is available." /></Pillar>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell stage={stage} proof={proofFor(successfulResponse, replayInvariantViolation, consequence?.pglProof)} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={proofFor(lastResponse, replayInvariantViolation, consequence?.pglProof)}>
          {lease.vlinkHandoff ? (
            <div className="mb-4 rounded-lg border border-cos-accent/30 bg-cos-accent/[0.035] p-3 text-xs text-cos-muted">
              Held by VLink lease {lease.vlinkHandoff.leaseId} — machine may act through VLink; this browser still holds the human token
            </div>
          ) : null}
          <PhaseTrace phases={phases} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-cos-border bg-cos-bg/35 p-3 text-xs">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Package</div>
              <div className="mt-2 break-all font-mono text-cos-text">{displayValue(lease.packageRef)}</div>
              <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Mount</div>
              <div className="mt-2 break-all font-mono text-cos-text">{lease.mountId}</div>
              <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel"><span>Scope</span><ScopeTag project={lease.project} /></div>
              <div className="mt-2 font-mono text-cos-text">{lease.workspace ?? "Not returned"} / {lease.project ?? "Not returned"} / {resource}</div>
            </div>
            <div className="rounded-lg border border-cos-border bg-cos-bg/35 p-3 text-xs">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Granted writes</div>
              <div className="mt-2 font-mono text-cos-text">{lease.grants?.writes?.length ? lease.grants.writes.join(", ") : "Not returned"}</div>
              <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Blocked</div>
              <div className="mt-2 font-mono text-cos-text">{lease.grants?.blocked?.length ? lease.grants.blocked.join(", ") : "Not returned"}</div>
            </div>
          </div>
          <div className="mt-4">
            {lease.intent ? (
              <BoundOperationCard intent={lease.intent} note="Execute submits exactly this operation with this mount's token. The authority layer decides." />
            ) : (
              <HonestEmpty
                title="This mount carries no bound operation"
                route="POST /api/abide/v1/blueprint/compile"
                detail="Bind an operation to a contract step in Blueprint and mount it; Execute never assembles an operation itself."
              />
            )}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={attemptBlockedAction} disabled={Boolean(busyAction) || !mountIsLive || !blockedAction} className="inline-flex items-center gap-2 rounded-lg border border-cos-warn/40 px-3 py-2 text-xs text-cos-warn disabled:opacity-50">
              <Ban size={13} /> Attempt blocked action{blockedAction ? ` (${blockedAction})` : ""}
            </button>
            <button type="button" onClick={() => executeBound("execute")} disabled={Boolean(busyAction) || !mountIsLive || !operation} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-3 py-2 text-xs font-semibold text-cos-bg disabled:opacity-50">
              <SquareTerminal size={13} /> Execute{operation ? ` ${operation.action}` : ""}
            </button>
            <button type="button" onClick={revokeAuthority} disabled={Boolean(busyAction) || !lease} className="inline-flex items-center gap-2 rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-text disabled:opacity-50">
              <ShieldCheck size={13} /> Revoke authority
            </button>
            <button type="button" onClick={() => executeBound("retry")} disabled={Boolean(busyAction) || !operation || !(hasAttemptedExecute || lease.terminated)} className="inline-flex items-center gap-2 rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-text disabled:opacity-50">
              <RotateCcw size={13} /> {hasAttemptedExecute ? "Retry same operation" : "Attempt with this token"}
            </button>
          </div>
          {retainedOthers.length ? (
            <div className="mt-5 rounded-lg border border-cos-border bg-cos-bg/35 p-3 text-xs">
              <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Credentials the machine still holds from earlier mounts</div>
              <ul className="mt-2 space-y-2">
                {retainedOthers.map((item) => (
                  <li key={item.mountId} className="rounded border border-cos-border p-2">
                    <div className="break-all font-mono text-cos-text">{item.mountId}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-cos-steel">
                      {item.intent ? `${item.intent.operation.action} · resource ${item.intent.operation.resource} · ${describeArguments(item.intent.operation.arguments)}` : "no bound operation"}
                      {item.terminatedBy ? ` · ended by ${item.terminatedBy}` : ""}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void attemptWithRetained(item, "retained_token")} disabled={Boolean(busyAction) || !operation} className="rounded border border-cos-warn/40 px-2 py-1 text-[11px] text-cos-warn disabled:opacity-50">
                        Try the current operation with this token
                      </button>
                      <button type="button" onClick={() => void attemptWithRetained(item, "retained_own_operation")} disabled={Boolean(busyAction) || !item.intent} className="rounded border border-cos-warn/40 px-2 py-1 text-[11px] text-cos-warn disabled:opacity-50">
                        Retry its own operation (new id)
                      </button>
                      <button type="button" onClick={() => void attemptWithRetained(item, "replay")} disabled={Boolean(busyAction) || !item.intent || !item.lastOperationId} className="rounded border border-cos-warn/40 px-2 py-1 text-[11px] text-cos-warn disabled:opacity-50">
                        Replay its last operation{item.lastOperationId ? ` (${item.lastOperationId.slice(0, 8)}…)` : ""}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {lastResponse ? <div className={`mt-4 rounded-lg border p-3 text-xs ${responseDecision(lastResponse) === "deny" ? "border-cos-warn/40 bg-cos-warn/5" : "border-cos-border bg-cos-bg/35"}`}><div className="flex items-center gap-2">{responseDecision(lastResponse) === "deny" ? <CircleAlert size={14} className="text-cos-warn" /> : <CheckCircle2 size={14} className="text-cos-verified" />}<span className="font-mono uppercase text-cos-text">{responseDecision(lastResponse) === "deny" ? "DENIED" : displayValue(responseDecision(lastResponse))} · {displayValue(lastResponse.reason)}</span></div></div> : null}
          {replayInvariantViolation ? <div className="mt-3 rounded-lg border border-cos-warn/50 bg-cos-warn/10 p-3 text-xs text-cos-warn"><strong>Degraded</strong> — Replay accepted — invariant violation; report this</div> : null}
        </Pillar>
        <Pillar title="Telemetry" proof={lastResponse ? "Present" : "Needs proof"}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Latency</div><div className="mt-2 font-mono text-xs text-cos-text">{lastLatency === undefined ? "Not returned" : `${lastLatency} ms`}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">HTTP status</div><div className="mt-2 font-mono text-xs text-cos-text">{lastStatus ?? "Not returned"}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchoring</div><div className="mt-2 flex flex-wrap items-center gap-2"><ProofBadge status={pglProof(anchoring, consequence?.pglProof)} /><span className="font-mono text-xs text-cos-text">{pglProofLabel(anchoring, consequence?.pglProof)}</span></div></div>
          </div>
        </Pillar>
        <Pillar title="Authority" proof={successfulResponse ? proofFor(successfulResponse, false, consequence?.pglProof) : "Needs proof"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Execution ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(executionId)}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Nonce consumed</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(authority?.nonce_consumed)}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Expires at</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(lease.expiresAt)}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Mount state</div><div className="mt-2 font-mono text-xs text-cos-text">{lease.terminated ? `terminated (${lease.terminatedBy ?? "unknown"})` : "mounted"}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Last revoke</div><div className="mt-2 font-mono text-xs text-cos-text">{lastRevoke ? `Revoke: ${lastRevoke.decision.toUpperCase()} · ${lastRevoke.reason}` : "Not returned"}</div></div>
          </div>
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={successfulResponse ? proofFor(successfulResponse, replayInvariantViolation, consequence?.pglProof) : "Needs proof"}>
          {lastResponse && targetRef ? <div className="mb-4 rounded-xl border border-cos-accent/25 bg-cos-accent/[0.035] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm text-cos-text">Independent re-read</h3><p className="mt-1 text-xs text-cos-muted">Reads the mounted target state without consuming authority.</p><div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel">{readbackProject ? <ScopeTag project={readbackProject} /> : null}<span>project: {readbackProject ?? "Not returned"}</span></div></div><ProofBadge status={readbackProof} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><div className="mb-2 font-mono text-[9px] uppercase text-cos-steel">Target state now (target&apos;s own statement)</div><StateFields state={readbackState} /></div><div><div className="mb-2 font-mono text-[9px] uppercase text-cos-steel">What execute returned</div><StateFields state={resultingState} /></div></div>{readbackError ? <p className="mt-3 rounded border border-cos-warn/40 bg-cos-warn/5 p-2 font-mono text-xs text-cos-warn">{readbackError}</p> : null}<button type="button" onClick={readTargetState} disabled={Boolean(busyAction)} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50">{busyAction === "readback" ? "Reading…" : "Re-read target state"}</button></div> : null}
          {successfulResponse ? <div className="space-y-3"><div className="flex items-center gap-2"><ProofBadge status={proofFor(successfulResponse, replayInvariantViolation, consequence?.pglProof)} /><span className="font-mono text-xs text-cos-text">Receipt returned by CAPPO</span><ScopeTag project={lease.project} /></div><div className="grid gap-3 sm:grid-cols-2"><div className="sm:col-span-2"><div className="mb-2 font-mono text-[9px] uppercase text-cos-steel">Resulting state returned by the target</div><StateFields state={resultingState} /></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Receipt ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(receiptId)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchor ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.anchor_id)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">PGL agent</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.pgl_agent_id)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchoring status</div><div className="mt-2 flex flex-wrap items-center gap-2"><ProofBadge status={pglProof(anchoring, consequence?.pglProof)} /><span className="font-mono text-xs text-cos-text">{pglProofLabel(anchoring, consequence?.pglProof)}</span><button type="button" onClick={verifyPglProof} disabled={Boolean(busyAction) || typeof anchoring?.pgl_event_hash !== "string"} className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-cos-accent disabled:opacity-50">{busyAction === "pgl" ? "Verifying…" : "Verify in PGL"}</button></div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">PGL event hash</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.pgl_event_hash)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Receipt hash</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.content_hash)}</div></div></div><div className="grid gap-3 sm:grid-cols-2"><div><div className="font-mono text-[9px] uppercase text-cos-steel">Consequence state</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(consequencePayload?.state)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Terminated</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(consequencePayload?.terminated)}</div></div></div><Link href="/os/evidence" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent">Continue to Evidence <ArrowRight size={13} /></Link></div> : <HonestEmpty title="No consequence receipt returned" route="POST /v1/capability/mounts/{mount_id}/execute" detail="The receipt, anchor, and resulting state appear only after CAPPO returns an allowed consequence." />}
        </Pillar>
        <Pillar title="Drift" proof={consequence?.denials.length ? "Present" : "Needs proof"}>
          {consequence?.denials.length ? <div className="space-y-2">{consequence.denials.map((denial, index) => <div key={`${denial.at}-${index}`} className="rounded-lg border border-cos-border bg-cos-bg/35 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><ScopeTag project={lease.project} /><span className="font-mono uppercase text-cos-text">{denial.attempt}</span></span><span className="font-mono text-cos-warn">{denial.decision}</span></div><div className="mt-2 text-cos-muted">{denial.reason}</div>{denial.mountId ? <div className="mt-1 break-all font-mono text-[10px] text-cos-steel">credentials of {denial.mountId}</div> : null}{denial.operationId ? <div className="mt-1 break-all font-mono text-[10px] text-cos-steel">operation {denial.operationId}</div> : null}<div className="mt-2 font-mono text-[10px] text-cos-steel">{denial.at}</div></div>)}</div> : <HonestEmpty title="No denial drift recorded" route="POST /v1/capability/mounts/{mount_id}/actions" detail="Blocked-action and replay decisions appear here when the authority layer returns them." />}
        </Pillar>
      </div>
    </SectionShell>
  );
}
