"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Ban, CheckCircle2, CircleAlert, RotateCcw, ShieldCheck, SquareTerminal } from "lucide-react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { PhaseTrace, type TracePhase } from "@/components/cos/PhaseTrace";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { targetRefFor } from "@/lib/cos/capability-targets";
import { ScopeTag } from "@/components/cos/EnvironmentFrame";
import {
  readSessionCapabilityLease,
  readSessionConsequence,
  storeSessionCapabilityLease,
  storeSessionConsequence,
  type SessionCapabilityLease,
  type SessionConsequenceDenial,
  type SessionConsequenceRecord,
} from "@/lib/cos/lease-session";
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
): ProofStatus {
  if (replayInvariantViolation) return "Degraded";
  if (responseDecision(response) !== "allow") return "Needs proof";
  const anchoring = asRecord(response?.anchoring);
  return anchoring?.status === "confirmed" ? "Verified" : "Present";
}

function appendDenial(
  existing: SessionConsequenceRecord | null,
  denial: SessionConsequenceDenial,
): SessionConsequenceRecord {
  return {
    response: existing?.response ?? {},
    recordedAt: existing?.recordedAt ?? new Date().toISOString(),
    denials: [...(existing?.denials ?? []), denial],
  };
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not returned";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export default function ExecutePage() {
  const stage = getStage("execute");
  const data = useStageData("execute");
  const cappoBase = stage.endpoints[0]?.baseUrl;
  const [lease, setLease] = useState<SessionCapabilityLease | null>(() => readSessionCapabilityLease());
  const [consequence, setConsequence] = useState<SessionConsequenceRecord | null>(() => readSessionConsequence());
  const [lastResponse, setLastResponse] = useState<JsonRecord | undefined>(() => readSessionConsequence()?.response);
  const [busyAction, setBusyAction] = useState<"forbidden_action" | "execute" | "revoke" | "retry" | null>(null);
  const [lastLatency, setLastLatency] = useState<number>();
  const [lastStatus, setLastStatus] = useState<number>();
  const [replayInvariantViolation, setReplayInvariantViolation] = useState(false);
  const [operationId] = useState(() => {
    const persisted = readSessionConsequence()?.response?.operation_id;
    if (typeof persisted === "string") return persisted;
    return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `op-${Date.now()}`;
  });

  const targetRef = lease?.targetRef ?? (lease?.packageRef ? targetRefFor(lease.packageRef) : undefined);
  const resource = lease?.resource ?? "counter";
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
  const receiptId = asString(consequencePayload?.receipt_id);
  const executionId = asString(authority?.execution_id) ?? lease?.executionId;
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

  function persistResponse(response: JsonRecord, denials = consequence?.denials ?? []) {
    const record = {
      response,
      lastAllowedResponse: responseDecision(response) === "allow"
        ? response
        : consequence?.lastAllowedResponse,
      denials,
    };
    storeSessionConsequence(record);
    setConsequence(readSessionConsequence());
    setLastResponse(response);
  }

  async function attemptBlockedAction() {
    if (!lease || !mountIsLive) return;
    setBusyAction("forbidden_action");
    const result = await callCappo<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${lease.mountId}/actions`, cappoBase),
      {
        token_id: lease.tokenId,
        nonce: lease.nonce,
        action: "counter.reset",
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
    const next = appendDenial(consequence, denial);
    storeSessionConsequence({
      response: result.data ? lastResponse ?? {} : response,
      lastAllowedResponse: consequence?.lastAllowedResponse,
      denials: next.denials,
    });
    setConsequence(readSessionConsequence());
    setLastResponse(response);
    setBusyAction(null);
  }

  async function executeCounter(attempt: "execute" | "retry") {
    if (!lease || (attempt === "execute" && !mountIsLive)) return;
    setBusyAction(attempt);
    setReplayInvariantViolation(false);
    const pending = {
      ...(lastResponse ?? consequence?.response ?? {}),
      operation_id: operationId,
      decision: "pending",
    };
    storeSessionConsequence({
      response: pending,
      lastAllowedResponse: consequence?.lastAllowedResponse,
      denials: consequence?.denials ?? [],
    });
    const result = await callCappo<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${lease.mountId}/execute`, cappoBase),
      {
        token_id: lease.tokenId,
        nonce: lease.nonce,
        action: "counter.increment",
        target_ref: targetRef,
        resource,
        arguments: {},
        operation_id: operationId,
      },
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
    persistResponse(response, nextDenials);
    if (decision === "allow") {
      const nextLease = { ...lease, terminated: true };
      storeSessionCapabilityLease(nextLease);
      setLease(nextLease);
    }
    setBusyAction(null);
  }

  async function revokeAuthority() {
    if (!lease || lease.terminated) return;
    setBusyAction("revoke");
    const result = await callCappo<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${lease.mountId}/terminate`, cappoBase),
      { reason: "explicit_terminate" },
    );
    if (result.data) {
      const nextLease = { ...lease, terminated: true };
      storeSessionCapabilityLease(nextLease);
      setLease(nextLease);
      storeSessionConsequence({
        response: lastResponse ?? consequence?.response ?? { operation_id: operationId, decision: "pending" },
        lastAllowedResponse: consequence?.lastAllowedResponse,
        denials: consequence?.denials ?? [],
      });
      setConsequence(readSessionConsequence());
    }
    setBusyAction(null);
  }

  if (!lease) {
    return (
      <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
        <div className="space-y-4">
          <Pillar title="Work" proof="Needs proof">
            <HonestEmpty
              title="No capability lease held"
              route="POST /v1/capability/mounts/{mount_id}/execute"
              detail="Mount a bounded capability first, then return here to execute it through CAPPO."
            />
            <Link href="/os/mount" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent">
              Go to Mount <ArrowRight size={13} />
            </Link>
          </Pillar>
          <Pillar title="Telemetry" proof="Needs proof"><HonestEmpty title="Execution telemetry not observed" route="POST /v1/capability/mounts/{mount_id}/execute" detail="No execution request is issued without a held lease." /></Pillar>
          <Pillar title="Authority" proof="Needs proof"><HonestEmpty title="Execution authority not observed" route="POST /v1/capability/mounts/{mount_id}/execute" detail="CAPPO must return a scoped token and nonce before consequence authority exists." /></Pillar>
        </div>
        <div className="space-y-4">
          <Pillar title="Evidence" proof="Needs proof"><HonestEmpty title="Execution evidence not observed" route="POST /v1/capability/mounts/{mount_id}/execute" detail="No receipt or resulting state has been returned." /></Pillar>
          <Pillar title="Drift" proof="Needs proof"><HonestEmpty title="Execution drift not measured" route="POST /v1/capability/mounts/{mount_id}/execute" detail="No retry or forbidden-action decision is available." /></Pillar>
        </div>
      </SectionShell>
    );
  }

  return (
    <SectionShell stage={stage} proof={proofFor(successfulResponse, replayInvariantViolation)} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={proofFor(lastResponse, replayInvariantViolation)}>
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
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={attemptBlockedAction} disabled={Boolean(busyAction) || !mountIsLive} className="inline-flex items-center gap-2 rounded-lg border border-cos-warn/40 px-3 py-2 text-xs text-cos-warn disabled:opacity-50">
              <Ban size={13} /> Attempt blocked action (counter.reset)
            </button>
            <button type="button" onClick={() => executeCounter("execute")} disabled={Boolean(busyAction) || !mountIsLive || !targetRef} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-3 py-2 text-xs font-semibold text-cos-bg disabled:opacity-50">
              <SquareTerminal size={13} /> Execute counter.increment
            </button>
            <button type="button" onClick={revokeAuthority} disabled={Boolean(busyAction) || !mountIsLive} className="inline-flex items-center gap-2 rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-text disabled:opacity-50">
              <ShieldCheck size={13} /> Revoke authority
            </button>
            <button type="button" onClick={() => executeCounter("retry")} disabled={Boolean(busyAction) || !(hasAttemptedExecute || lease.terminated)} className="inline-flex items-center gap-2 rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-text disabled:opacity-50">
              <RotateCcw size={13} /> Retry same operation
            </button>
          </div>
          {lastResponse ? <div className={`mt-4 rounded-lg border p-3 text-xs ${responseDecision(lastResponse) === "deny" ? "border-cos-warn/40 bg-cos-warn/5" : "border-cos-border bg-cos-bg/35"}`}><div className="flex items-center gap-2">{responseDecision(lastResponse) === "deny" ? <CircleAlert size={14} className="text-cos-warn" /> : <CheckCircle2 size={14} className="text-cos-verified" />}<span className="font-mono uppercase text-cos-text">{responseDecision(lastResponse) === "deny" ? "DENIED" : displayValue(responseDecision(lastResponse))} · {displayValue(lastResponse.reason)}</span></div></div> : null}
          {replayInvariantViolation ? <div className="mt-3 rounded-lg border border-cos-warn/50 bg-cos-warn/10 p-3 text-xs text-cos-warn"><strong>Degraded</strong> — Replay accepted — invariant violation; report this</div> : null}
        </Pillar>
        <Pillar title="Telemetry" proof={lastResponse ? "Present" : "Needs proof"}>
          <div className="grid gap-3 sm:grid-cols-3">
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Latency</div><div className="mt-2 font-mono text-xs text-cos-text">{lastLatency === undefined ? "Not returned" : `${lastLatency} ms`}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">HTTP status</div><div className="mt-2 font-mono text-xs text-cos-text">{lastStatus ?? "Not returned"}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchoring</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(anchoring?.status)}</div></div>
          </div>
        </Pillar>
        <Pillar title="Authority" proof={successfulResponse ? proofFor(successfulResponse) : "Needs proof"}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Execution ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(executionId)}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Nonce consumed</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(authority?.nonce_consumed)}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Expires at</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(lease.expiresAt)}</div></div>
            <div><div className="font-mono text-[9px] uppercase text-cos-steel">Mount state</div><div className="mt-2 font-mono text-xs text-cos-text">{lease.terminated ? "terminated" : "mounted"}</div></div>
          </div>
        </Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={successfulResponse ? proofFor(successfulResponse, replayInvariantViolation) : "Needs proof"}>
          {successfulResponse ? <div className="space-y-3"><div className="flex items-center gap-2"><ProofBadge status={proofFor(successfulResponse, replayInvariantViolation)} /><span className="font-mono text-xs text-cos-text">Receipt returned by CAPPO</span></div><div className="grid gap-3 sm:grid-cols-2"><div><div className="font-mono text-[9px] uppercase text-cos-steel">Counter value</div><div className="mt-2 text-3xl font-semibold text-cos-text">{displayValue(resultingState?.previous_value)} → {displayValue(resultingState?.value)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Version</div><div className="mt-2 font-mono text-xl text-cos-text">{displayValue(resultingState?.version)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Receipt ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(receiptId)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchor ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.anchor_id)}</div></div></div><div className="grid gap-3 sm:grid-cols-2"><div><div className="font-mono text-[9px] uppercase text-cos-steel">Consequence state</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(consequencePayload?.state)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Terminated</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(consequencePayload?.terminated)}</div></div></div><Link href="/os/evidence" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent">Continue to Evidence <ArrowRight size={13} /></Link></div> : <HonestEmpty title="No consequence receipt returned" route="POST /v1/capability/mounts/{mount_id}/execute" detail="The receipt, anchor, and resulting state appear only after CAPPO returns an allowed consequence." />}
        </Pillar>
        <Pillar title="Drift" proof={consequence?.denials.length ? "Present" : "Needs proof"}>
          {consequence?.denials.length ? <div className="space-y-2">{consequence.denials.map((denial, index) => <div key={`${denial.at}-${index}`} className="rounded-lg border border-cos-border bg-cos-bg/35 p-3 text-xs"><div className="flex items-center justify-between gap-3"><span className="font-mono uppercase text-cos-text">{denial.attempt}</span><span className="font-mono text-cos-warn">{denial.decision}</span></div><div className="mt-2 text-cos-muted">{denial.reason}</div><div className="mt-2 font-mono text-[10px] text-cos-steel">{denial.at}</div></div>)}</div> : <HonestEmpty title="No denial drift recorded" route="POST /v1/capability/mounts/{mount_id}/actions" detail="Blocked-action and replay decisions appear here when CAPPO returns them." />}
        </Pillar>
      </div>
    </SectionShell>
  );
}
