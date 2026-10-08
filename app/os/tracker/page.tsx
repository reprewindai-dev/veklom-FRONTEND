"use client";

import { useEffect } from "react";
import Link from "next/link";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { Pillar } from "@/components/cos/SectionPillars";
import { JsonPanel } from "@/components/cos/StageParts";
import { UnknownLink } from "@/components/cos/StageCollection";
import { VeklomActivityCue, type ActivityCondition } from "@/components/cos/VeklomActivityCue";
import { EnvironmentRows, rowsFromPayload } from "@/components/cos/EnvironmentRows";
import { useSandboxMode } from "@/lib/cos/sandbox";

function runCondition(value: Record<string, unknown>): ActivityCondition | undefined {
  const raw = value.status ?? value.state ?? value.outcome;
  if (typeof raw !== "string") return undefined;
  const status = raw.toLowerCase();
  if (["running", "active", "executing", "in_progress"].includes(status)) return "active";
  if (["uncertain", "outcome_uncertain", "unknown"].includes(status)) return "degraded";
  if (["failed", "denied", "revoked", "expired", "cancelled"].includes(status)) return "failed";
  if (["completed", "succeeded", "success", "allow"].includes(status)) return "present";
  return undefined;
}

function runRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)));
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const nested = Array.isArray(record.runs) ? record.runs : Array.isArray(record.items) ? record.items : [];
  return nested.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item)));
}

export default function TrackerPage() {
  const stage = getStage("tracker");
  const data = useStageData("tracker");
  const sources = [
    { path: "/v1/audit/ledger", label: "Evidence", detail: "a ledger entry containing the execution or settlement reference" },
    { path: "/v1/runs", label: "Execution", detail: "a run record with the matching authorization and evidence identifiers" },
  ];
  const links = [
    ["Blueprint ↔ Plan", "a compiled plan payload with the originating blueprint identifier"],
    ["Plan ↔ Authorization", "an authorization response referencing the compiled plan hash"],
    ["Authorization ↔ Execution", "a run record carrying the authorization decision or execution binding"],
    ["Execution ↔ Evidence", "an audit ledger entry carrying the execution identifier"],
    ["Evidence ↔ Settlement", "a settlement receipt linked to the evidence or execution identifier"],
  ];
  useEffect(() => {
    for (const endpoint of stage.endpoints) if (endpoint.method === "GET") void data.call(endpoint);
  }, [data.call, stage.endpoints]);
  const runs = runRows(data.payloads["GET /v1/runs"]);
  const ledgerRows = rowsFromPayload(data.payloads["GET /v1/audit/ledger"]);
  const sandbox = useSandboxMode();

  return (
    <>
      <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
        <div className="xl:col-span-2">
          <Pillar title="Work" proof="Needs proof" detail="A composed tracker refuses to call a link aligned without exact returned evidence.">
            <div className="grid gap-3 sm:grid-cols-2">{links.map(([label, detail]) => <UnknownLink key={label} label={label} detail={detail} />)}</div>
          </Pillar>
        </div>
        <Pillar title="Telemetry" proof="Needs proof">
          {runs.length ? <EnvironmentRows rows={runs} empty="No execution runs in this environment — GET /v1/runs" idOf={(run, index) => String(run.run_id ?? run.id ?? `run-${index}`)} extra={(run) => { const condition = runCondition(run); return condition ? <VeklomActivityCue kind="execution" condition={condition} size={18} showCaption={false} /> : null; }} /> : sandbox ? <p className="text-xs text-cos-muted">No sandbox-scoped execution runs returned — GET /v1/runs</p> : <JsonPanel value={data.payloads["GET /v1/runs"]} empty="No execution runs returned — GET /v1/runs" />}
        </Pillar>
        <Pillar title="Authority" proof="Needs proof"><UnknownLink label="Authorization ↔ Execution" detail="a run record carrying the authorization decision or execution binding" /></Pillar>
        <Pillar title="Evidence" proof="Needs proof">{ledgerRows ? <EnvironmentRows rows={ledgerRows} empty="No ledger entries in this environment — GET /v1/audit/ledger" idOf={(row, index) => String(row.id ?? row.event_id ?? row.entry_hash ?? row.hash ?? `entry-${index}`)} /> : sandbox ? <p className="text-xs text-cos-muted">No sandbox-scoped ledger entries returned — GET /v1/audit/ledger</p> : <JsonPanel value={data.payloads["GET /v1/audit/ledger"]} empty="No ledger returned — GET /v1/audit/ledger" />}</Pillar>
        <Pillar title="Drift" proof="Needs proof"><div className="space-y-3">{sources.map((source) => <UnknownLink key={source.path} label={source.label} detail={source.detail} />)}</div></Pillar>
      </SectionShell>
      <div className="mx-auto max-w-[1500px] px-5 pb-8 lg:px-10"><Link href="/os/computeless" className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel hover:text-cos-accent">Private Cloud ↗</Link></div>
    </>
  );
}
