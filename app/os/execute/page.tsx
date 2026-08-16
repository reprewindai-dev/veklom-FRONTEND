"use client";

import { CovenantTraceRail, COVENANT_PHASES, type CovenantPhase } from "@/components/cos/CovenantTraceRail";
import { Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { ExecuteHarness } from "@/components/cos/ExecuteHarness";
import type { TransportOutcome } from "@/lib/cos/outcome";

function stringValue(payload: unknown, keys: string[]): string | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return undefined;
  for (const key of keys) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function axisValue<T extends string>(payload: unknown, keys: string[], values: readonly T[]): T | undefined {
  const value = stringValue(payload, keys)?.toLowerCase();
  return values.find((candidate) => candidate === value);
}

function containsText(payload: unknown, text: string): boolean {
  try {
    return JSON.stringify(payload).includes(text);
  } catch {
    return false;
  }
}

function executeAxes(
  record: ReturnType<typeof useStageData>["records"][number] | undefined,
  payload: unknown,
) {
  const status = record?.status;
  let transport: TransportOutcome =
    typeof status === "number"
      ? status === 402
        ? { kind: "payment-required", status: 402 }
        : status >= 400 && status < 500
          ? { kind: "rejected", status }
          : { kind: "reached", status }
      : { kind: "unreachable" };

  const execution = axisValue(
    payload,
    ["execution", "execution_state", "executionStatus", "execution_status"],
    ["allowed", "denied", "runtime-error", "timeout", "not-run", "unreported"] as const,
  ) ?? (
    record?.error?.includes("CAPPO_GOVERNANCE_DENIED") || containsText(payload, "CAPPO_GOVERNANCE_DENIED")
      ? "denied"
      : "unreported"
  );

  const integrity = axisValue(
    payload,
    ["integrity", "integrity_state", "integrityStatus", "integrity_status"],
    ["verifiable", "self-attested", "tampered", "unsigned", "unreported"] as const,
  ) ?? "unreported";

  if (record?.observation.kind === "not-called") {
    transport = { kind: "not-called" };
  }
  if (record?.observation.kind === "failed" && status === undefined) {
    transport = { kind: "unreachable" };
  }
  return { transport, execution, integrity };
}

function executePhases(axes: ReturnType<typeof executeAxes>): CovenantPhase[] {
  const phases = COVENANT_PHASES.map((name): CovenantPhase => ({
    name,
    state: "unreported",
  }));
  if (axes.transport.kind === "not-called" || axes.transport.kind === "unreachable") return phases;

  const response = phases.find((phase) => phase.name === "RESPONSE");
  if (response) {
    response.state = axes.transport.kind === "rejected" ? "denied" : "passed";
    response.detail = `${axes.transport.kind === "payment-required" ? 402 : axes.transport.status}`;
  }
  const execution = phases.find((phase) => phase.name === "EXECUTION");
  if (execution && axes.execution !== "unreported") {
    execution.state = axes.execution === "denied" ? "denied" : axes.execution === "allowed" ? "passed" : "unreported";
    execution.detail = axes.execution;
  }
  const evidence = phases.find((phase) => phase.name === "EVIDENCE");
  if (evidence && axes.integrity !== "unreported") {
    evidence.state = axes.integrity === "tampered" ? "denied" : axes.integrity === "verifiable" || axes.integrity === "self-attested" ? "sealed" : "unreported";
    evidence.detail = axes.integrity;
  }
  return phases;
}

export default function ExecutePage() {
  const stage = getStage("execute");
  const data = useStageData("execute");
  const record = data.records[0];
  const payload = data.payloads["POST /v1/exec"];
  const axes = executeAxes(record, payload);
  const executeProof = payload === undefined
    ? data.stageProof
    : axes.execution === "allowed" && axes.integrity === "verifiable"
      ? "Verified"
      : data.stageProof === "Degraded"
        ? "Degraded"
        : "Needs proof";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <CovenantTraceRail
            phases={executePhases(axes)}
            requestId={stringValue(payload, ["request_id", "requestId"])}
            verdict={stringValue(payload, ["verdict", "decision"])}
            simulated={false}
          />
        </Pillar>
        
        {/* The actual Execute Harness component */}
        <ExecuteHarness
          onExecute={(body, apiKey) => data.call(stage.endpoints[0], body, {
            headers: apiKey ? { "X-API-Key": apiKey } : undefined,
          })}
          outcome={axes}
          result={payload}
          loading={data.loading}
          proof={executeProof}
        />

      </div>
    </SectionShell>
  );
}
