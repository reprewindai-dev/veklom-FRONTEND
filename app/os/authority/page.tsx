"use client";

import { useMemo, useState } from "react";
import { AlertList } from "@/components/cos/AlertList";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field } from "@/components/cos/StageParts";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.map(asRecord).filter((item): item is JsonRecord => Boolean(item))
    : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function endpoint(method: StageEndpoint["method"], path: string): StageEndpoint {
  return { method, path, classification: "live", response: "CAPPO authority response" };
}

export default function AuthorityPage() {
  const stage = getStage("authority");
  const data = useStageData("authority", { autoGet: true });
  const [revocation, setRevocation] = useState<JsonRecord>();
  const [revoking, setRevoking] = useState(false);

  const agents = useMemo(
    () => asArray(data.payloads["GET /api/v1/agents"]),
    [data.payloads],
  );
  const runs = useMemo(
    () => asArray(data.payloads["GET /v1/runs"]),
    [data.payloads],
  );

  const latestRun = runs[0];
  const identityEvidence = agents[0];
  const executionIdentity = asString(latestRun?.execution_identity);
  const runId = asString(latestRun?.run_id);
  const workspaceId = asString(latestRun?.workspace_id);
  const governanceDecision = asString(latestRun?.governance_decision);
  const state = asString(latestRun?.state);
  const riskTier = asString(latestRun?.risk_tier);
  const pglIdentity = asString(latestRun?.pgl_identity);
  const agentId = asString(identityEvidence?.agent_id);
  const certificateId = asString(identityEvidence?.certificate_id);

  async function revokeExecutionIdentity() {
    if (!executionIdentity) return;
    setRevoking(true);
    try {
      const result = await data.call<JsonRecord>(
        endpoint("POST", `/v1/identities/${encodeURIComponent(executionIdentity)}/revoke`),
        { reason: "operator_requested_from_capability_os" },
      );
      if (result.data) setRevocation(result.data);
    } finally {
      setRevoking(false);
    }
  }

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={latestRun ? data.stageProof : "Needs proof"}>
          {latestRun ? (
            <div className="space-y-3 rounded-xl border border-cos-border bg-cos-bg/35 p-4">
              <Field label="Run ID" value={runId} />
              <Field label="Workspace" value={workspaceId} />
              <Field label="Run state" value={state} />
              <Field label="PGL identity" value={pglIdentity} />
            </div>
          ) : (
            <HonestEmpty title="No governed run returned" route="GET /v1/runs" detail="Authority becomes inspectable here when CAPPO returns a governed run for the authenticated workspace." />
          )}
        </Pillar>

        <Pillar title="Telemetry" proof={data.stageProof}>
          <AlertList alerts={[]} />
        </Pillar>

        <Pillar title="Authority" proof={executionIdentity ? data.stageProof : "Needs proof"}>
          {executionIdentity ? (
            <div className="space-y-3 rounded-xl border border-cos-accent/25 bg-cos-accent/[0.035] p-4">
              <Field label="Execution identity" value={executionIdentity} />
              <Field label="Governance decision" value={governanceDecision} />
              <Field label="Risk tier" value={riskTier} />
              <Field label="Scope" value={latestRun?.scope} />
              <Field label="Execution authority token" value={latestRun?.eat ? "Returned by CAPPO" : "Not returned"} />
            </div>
          ) : (
            <HonestEmpty title="No execution authority returned" route="GET /v1/runs" detail="The page no longer treats a PGL agent certificate as consequence authority. It waits for CAPPO to return an execution identity and authority fields." />
          )}
        </Pillar>
      </div>

      <div className="space-y-4">
        <Pillar title="Evidence" proof={revocation ? data.stageProof : executionIdentity ? "Present" : "Needs proof"}>
          {revocation ? (
            <div className="space-y-3 rounded-xl border border-cos-verified/30 bg-cos-verified/5 p-4">
              <Field label="Execution identity" value={revocation.execution_id} />
              <Field label="Revoked" value={revocation.revoked} />
              <Field label="Revoked at" value={revocation.revoked_at} />
            </div>
          ) : executionIdentity ? (
            <div className="space-y-3 rounded-xl border border-cos-border bg-cos-bg/35 p-4">
              <p className="text-xs leading-5 text-cos-muted">CAPPO returned an execution identity. Revocation is now a concrete, parameterized control rather than a dead placeholder.</p>
              <button
                type="button"
                onClick={revokeExecutionIdentity}
                disabled={revoking}
                className="rounded-lg border border-cos-warn/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-warn disabled:opacity-50"
              >
                {revoking ? "Revoking…" : "Revoke execution authority"}
              </button>
            </div>
          ) : (
            <HonestEmpty title="Revocation evidence not observed" route="POST /v1/identities/{execution_id}/revoke" detail="CAPPO has not returned an execution identity for the authenticated workspace." />
          )}
        </Pillar>

        <Pillar title="Drift" proof={latestRun ? "Present" : "Needs proof"}>
          {latestRun ? (
            <div className="space-y-3 rounded-xl border border-cos-border bg-cos-bg/35 p-4">
              <Field label="Observed runs" value={runs.length} />
              <Field label="Latest run" value={runId} />
              <Field label="Latest execution identity" value={executionIdentity} />
              <Field label="Identity evidence agent" value={agentId} />
              <Field label="Identity evidence certificate" value={certificateId} />
              <p className="text-[11px] leading-5 text-cos-steel">These are observed authority inputs only. This panel does not claim authority drift unless a backend drift signal is returned.</p>
            </div>
          ) : (
            <HonestEmpty title="Drift not measured" route="GET /v1/runs" detail="No CAPPO run authority snapshot was returned." />
          )}
        </Pillar>
      </div>
    </SectionShell>
  );
}
