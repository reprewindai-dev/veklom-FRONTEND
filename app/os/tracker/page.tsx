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

  return (
    <>
      <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
        <div className="xl:col-span-2">
          <Pillar title="Work" proof="Needs proof" detail="A composed tracker refuses to call a link aligned without exact returned evidence.">
            <div className="grid gap-3 sm:grid-cols-2">{links.map(([label, detail]) => <UnknownLink key={label} label={label} detail={detail} />)}</div>
          </Pillar>
        </div>
        <Pillar title="Telemetry" proof="Needs proof">
          {runs.length ? <div className="space-y-2">{runs.map((run, index) => { const condition = runCondition(run); const id = run.run_id ?? run.id ?? `run-${index}`; return <div key={`${String(id)}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-cos-border bg-cos-bg/35 px-3 py-2"><span className="font-mono text-xs text-cos-text">{String(id)}</span>{condition ? <VeklomActivityCue kind="execution" condition={condition} size={18} showCaption={false} /> : null}</div>; })}</div> : <JsonPanel value={data.payloads["GET /v1/runs"]} empty="No execution runs returned — GET /v1/runs" />}
        </Pillar>
        <Pillar title="Authority" proof="Needs proof"><UnknownLink label="Authorization ↔ Execution" detail="a run record carrying the authorization decision or execution binding" /></Pillar>
        <Pillar title="Evidence" proof="Needs proof"><JsonPanel value={data.payloads["GET /v1/audit/ledger"]} empty="No ledger returned — GET /v1/audit/ledger" /></Pillar>
        <Pillar title="Drift" proof="Needs proof"><div className="space-y-3">{sources.map((source) => <UnknownLink key={source.path} label={source.label} detail={source.detail} />)}</div></Pillar>
      </SectionShell>
      <div className="mx-auto max-w-[1500px] px-5 pb-8 lg:px-10"><Link href="/os/computeless" className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel hover:text-cos-accent">Runtime diagnostics ↗</Link></div>
    </>
  );
}
