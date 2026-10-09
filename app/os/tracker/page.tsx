"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { Pillar } from "@/components/cos/SectionPillars";
import { JsonPanel } from "@/components/cos/StageParts";
import { VeklomActivityCue, type ActivityCondition } from "@/components/cos/VeklomActivityCue";
import { EnvironmentRows, rowsFromPayload } from "@/components/cos/EnvironmentRows";
import type { PackagePayload } from "@/components/cos/MountParts";
import { useSandboxMode } from "@/lib/cos/sandbox";
import { readSessionCapabilityLease, readSessionConsequence, type SessionCapabilityLease, type SessionConsequenceRecord } from "@/lib/cos/lease-session";
import { driftChecks, type DriftState } from "@/lib/cos/tracker-drift";

/**
 * Tracker (navigation map): continuous truth. It compares links in the chain and reports drift
 * using the blueprint's states. A link is computed only from data actually returned; anything
 * without a feed is "Unknown / unmeasured", never assumed aligned. Tracker never infers state from a
 * single service (API contract map §6).
 */

const driftStyle: Record<DriftState, string> = {
  Aligned: "border-cos-verified/30 bg-cos-verified/10 text-cos-verified",
  "Unreviewed change": "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  "Deployment drift": "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  "Policy drift": "border-cos-danger/30 bg-cos-danger/10 text-cos-danger",
  "Capability drift": "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  "Evidence stale": "border-cos-warn/30 bg-cos-warn/10 text-cos-warn",
  "Unknown / unmeasured": "border-cos-unknown/30 bg-cos-unknown/10 text-cos-unknown",
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

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
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
  const record = asRecord(value);
  if (!record) return [];
  const nested = Array.isArray(record.runs) ? record.runs : Array.isArray(record.items) ? record.items : [];
  return nested.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
}

export default function TrackerPage() {
  const stage = getStage("tracker");
  const data = useStageData("tracker");
  const sandbox = useSandboxMode();
  const [lease, setLease] = useState<SessionCapabilityLease | null>(null);
  const [consequence, setConsequence] = useState<SessionConsequenceRecord | null>(null);
  useEffect(() => {
    for (const endpoint of stage.endpoints) if (endpoint.method === "GET") void data.call(endpoint);
  }, [data.call, stage.endpoints]);
  useEffect(() => {
    const held = readSessionCapabilityLease();
    setLease(held);
    setConsequence(held ? readSessionConsequence(held.mountId) : null);
  }, []);
  const packagesPayload = data.payloads["GET /v1/capability/packages"];
  const packages = Array.isArray(packagesPayload) ? packagesPayload as PackagePayload[] : null;
  const checks = useMemo(() => driftChecks(lease, consequence, packages), [lease, consequence, packages]);
  const measured = checks.filter((check) => check.state !== "Unknown / unmeasured").length;
  const runs = runRows(data.payloads["GET /v1/runs"]);
  const ledgerRows = rowsFromPayload(data.payloads["GET /v1/audit/ledger"]);

  return (
    <>
      <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
        <div className="xl:col-span-2">
          <Pillar title="Drift" proof={measured ? "Present" : "Not started"} detail={`${measured} of ${checks.length} links measured from returned data. Unmeasured links are never shown as aligned.`}>
            <div className="grid gap-3 md:grid-cols-2">
              {checks.map((check) => (
                <div key={check.link} className="rounded-xl border border-cos-border bg-cos-bg/35 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm text-cos-text">{check.link}</span><span className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${driftStyle[check.state]}`}>{check.state}</span></div>
                  <p className="mt-2 text-xs leading-5 text-cos-muted">{check.detail}</p>
                </div>
              ))}
            </div>
          </Pillar>
        </div>
        <Pillar title="Runs" proof={data.records.find((record) => record.path === "/v1/runs")?.proof ?? "Not started"}>
          {runs.length ? <EnvironmentRows rows={runs} empty="No execution runs in this environment — GET /v1/runs" idOf={(run, index) => String(run.run_id ?? run.id ?? `run-${index}`)} extra={(run) => { const condition = runCondition(run); return condition ? <VeklomActivityCue kind="execution" condition={condition} size={18} showCaption={false} /> : null; }} /> : sandbox ? <p className="text-xs text-cos-muted">No sandbox-scoped execution runs returned — GET /v1/runs</p> : <JsonPanel value={data.payloads["GET /v1/runs"]} empty="No execution runs returned — GET /v1/runs" />}
        </Pillar>
        <Pillar title="Ledger" proof={data.records.find((record) => record.path === "/v1/audit/ledger")?.proof ?? "Not started"}>
          {ledgerRows ? <EnvironmentRows rows={ledgerRows} empty="No ledger entries in this environment — GET /v1/audit/ledger" idOf={(row, index) => String(row.id ?? row.event_id ?? row.entry_hash ?? row.hash ?? `entry-${index}`)} /> : sandbox ? <p className="text-xs text-cos-muted">No sandbox-scoped ledger entries returned — GET /v1/audit/ledger</p> : <JsonPanel value={data.payloads["GET /v1/audit/ledger"]} empty="No ledger returned — GET /v1/audit/ledger" />}
        </Pillar>
      </SectionShell>
      <div className="mx-auto max-w-[1500px] px-5 pb-8 lg:px-10"><Link href="/os/computeless" className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel hover:text-cos-accent">Private Cloud ↗</Link></div>
    </>
  );
}
