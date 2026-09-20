"use client";

import { PhaseTrace } from "@/components/cos/PhaseTrace";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { readSessionCapabilityLease, readSessionConsequence } from "@/lib/cos/lease-session";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { ScopeTag } from "@/components/cos/EnvironmentFrame";
import { anchoringLabel, anchoringProof, compareReadback } from "@/lib/cos/readback";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function displayValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not returned";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export default function EvidencePage() {
  const stage = getStage("evidence");
  const data = useStageData("evidence", { autoGet: true });
  const lease = readSessionCapabilityLease();
  const consequence = readSessionConsequence(lease?.mountId);
  const hasEvidence = Object.keys(data.payloads).length > 0;
  const phaseStatus = data.loading ? "current" : hasEvidence ? "complete" : "pending";
  const response = consequence?.lastAllowedResponse ?? consequence?.response;
  const nestedConsequence = asRecord(response?.consequence);
  const authority = asRecord(response?.authority);
  const anchoring = asRecord(response?.anchoring);
  const resultingState = asRecord(nestedConsequence?.resulting_state);
  const readback = consequence?.readback;
  const readbackState = asRecord(readback?.state);
  const readbackError = typeof readback?.error === "string" ? readback.error : undefined;
  const readbackProof = compareReadback(resultingState, readback);
  const responseScope = asRecord(response?.scope);
  const responseProject = typeof responseScope?.project === "string" ? responseScope.project : undefined;

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}><PhaseTrace phases={[
          { id: "ledger", name: "Ledger", status: phaseStatus, kind: "transport" },
          { id: "verify", name: "Verify", status: hasEvidence ? "current" : "pending", kind: "authority" },
          { id: "replay", name: "Replay", status: "pending", kind: "execution" },
        ]} /></Pillar>
        <Pillar title="Telemetry" proof={data.stageProof}><HonestEmpty title="Evidence telemetry is route-backed" route="GET /v1/audit/ledger" detail="Latency and status remain in the route ledger below." /></Pillar>
        <Pillar title="Authority" proof={data.stageProof}><HonestEmpty title="Evidence authority not returned" route="GET /api/v1/ledger/agents/{id}" detail="An execution identity is required for the parameterized ledger view." /></Pillar>
      </div>
      <div className="space-y-4">
        <Pillar title="Evidence" proof={data.stageProof}>
          {consequence ? (
            <div className="rounded-xl border border-cos-border bg-cos-bg/35 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm text-cos-text">Last consequence receipt</h3>
                  <ScopeTag project={lease?.project ?? responseProject} />
                </div>
                <ProofBadge status={anchoringProof(anchoring)} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Receipt ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(nestedConsequence?.receipt_id)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Execution ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(authority?.execution_id)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchor ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.anchor_id)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchoring status</div><div className="mt-2 flex flex-wrap items-center gap-2"><ProofBadge status={anchoringProof(anchoring)} /><span className="font-mono text-xs text-cos-text">{anchoringLabel(anchoring)}</span></div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Receipt hash</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.content_hash)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Terminated</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(nestedConsequence?.terminated)}</div></div>
                <div className="sm:col-span-2"><div className="font-mono text-[9px] uppercase text-cos-steel">Resulting state</div><pre className="mt-2 overflow-x-auto rounded border border-cos-border bg-cos-bg p-3 font-mono text-[10px] text-cos-text">{JSON.stringify(resultingState ?? {}, null, 2)}</pre></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Independent readback</div><div className="mt-2 flex flex-wrap items-center gap-2"><ProofBadge status={readbackProof} /><span className="font-mono text-xs text-cos-text">value {displayValue(readbackState?.value)} · version {displayValue(readbackState?.version)}</span></div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Execute resulting value</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(resultingState?.value)}</div></div>
                {readbackError ? <div className="sm:col-span-2 rounded border border-cos-warn/40 bg-cos-warn/5 p-2 font-mono text-xs text-cos-warn">{readbackError}</div> : null}
                <div className="sm:col-span-2 font-mono text-[10px] text-cos-steel">Denials recorded: {consequence.denials.length}</div>
              </div>
              <p className="mt-4 border-t border-cos-border pt-3 text-[11px] leading-5 text-cos-muted">Receipt as returned by CAPPO at execute time; ledger persistence is verified only via the audit routes below</p>
            </div>
          ) : <HonestEmpty title={hasEvidence ? "Evidence payload observed" : "No evidence payload observed"} route="GET /v1/audit/verify" detail={hasEvidence ? "The response is available to the route-backed data layer." : "No verifier result has been returned."} />}
        </Pillar>
        <Pillar title="Drift" proof={data.stageProof}><HonestEmpty title="Evidence drift not measured" route="GET /v1/audit/verify" detail="No comparison result was returned." /></Pillar>
      </div>
    </SectionShell>
  );
}
