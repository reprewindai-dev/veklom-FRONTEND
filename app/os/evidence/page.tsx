"use client";

import { DecisionGraph, type DecisionNode } from "@/components/cos/DecisionGraph";
import { EvidenceLookup } from "@/components/cos/ExecutionLookups";
import { JsonPanel } from "@/components/cos/StageParts";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { readSessionCapabilityLease, readSessionConsequence } from "@/lib/cos/lease-session";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { ScopeTag } from "@/components/cos/EnvironmentFrame";
import { compareReadback, pglProof, pglProofLabel } from "@/lib/cos/readback";

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
  const verifyPayload = data.payloads["GET /v1/audit/verify"];
  const verifyRecord = data.records.find((record) => record.method === "GET" && record.path === "/v1/audit/verify");
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
  const readbackProject = typeof readback?.project === "string"
    ? readback.project
    : lease?.project ?? responseProject;

  // Every node is derived from what this session actually received; nothing is assumed.
  const readbackVerdict = consequence ? compareReadback(resultingState, readback) : undefined;
  const anchorStatus = typeof anchoring?.status === "string" ? anchoring.status : undefined;
  const decisionNodes: DecisionNode[] = [
    { id: "identity", label: lease?.workspace ? `Workspace ${lease.workspace}` : "Workspace not returned", status: lease?.workspace ? "approved" : "pending", author: "identity" },
    { id: "grant", label: lease ? `Single-use grant on mount ${lease.mountId}` : "No grant held", status: lease ? "approved" : "pending", author: "authority" },
    ...(consequence?.denials.length ? [{ id: "denials", label: `${consequence.denials.length} attempt(s) refused`, status: "rejected" as const, author: "authority" }] : []),
    { id: "execution", label: nestedConsequence?.receipt_id ? `Executed once · receipt ${String(nestedConsequence.receipt_id)}` : "No allowed execution returned", status: nestedConsequence?.receipt_id ? "approved" : "pending", author: "execute" },
    { id: "evidence", label: anchorStatus ? `Evidence anchoring: ${anchorStatus}` : "Evidence anchoring not returned", status: anchorStatus === "confirmed" ? "approved" : anchorStatus === "pending_reconciliation" ? "bypassed" : "pending", author: "ledger" },
    { id: "readback", label: readbackVerdict === "Verified" ? "Independent readback matches" : readback ? "Independent readback does not confirm the result" : "Independent readback not run", status: readbackVerdict === "Verified" ? "approved" : readback ? "rejected" : "pending", author: "target" },
  ];

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Look up an execution" proof={data.stageProof} detail="Execution search: the receipt and ledger link for one execution, as returned.">
          <EvidenceLookup stageData={data} />
        </Pillar>
        <Pillar title="Decision chain" proof={consequence ? "Present" : "Not started"} detail="Identity → authority → execution → evidence → independent readback, built only from what this session received.">
          {consequence || lease ? <DecisionGraph nodes={decisionNodes} /> : <HonestEmpty title="No governed action in this session" route="POST /v1/capability/mounts/{mount_id}/execute" detail="The chain appears after a grant is used in Execute." />}
        </Pillar>
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
                <ProofBadge status={pglProof(anchoring, consequence.pglProof)} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Receipt ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(nestedConsequence?.receipt_id)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Execution ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(authority?.execution_id)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchor ID</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.anchor_id)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Anchoring status</div><div className="mt-2 flex flex-wrap items-center gap-2"><ProofBadge status={pglProof(anchoring, consequence.pglProof)} /><span className="font-mono text-xs text-cos-text">{pglProofLabel(anchoring, consequence.pglProof)}</span></div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Ledger event hash</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.pgl_event_hash)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Independent PGL lookup</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{consequence.pglProof?.checked_at ? `Checked ${consequence.pglProof.checked_at}` : "Not run"}</div></div>
                {consequence.pglProof?.chain ? <><div><div className="font-mono text-[9px] uppercase text-cos-steel">PGL chain status</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(consequence.pglProof.chain.status)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">PGL chain valid</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(consequence.pglProof.chain.valid)}</div></div></> : null}
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Receipt hash</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(anchoring?.content_hash)}</div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Terminated</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(nestedConsequence?.terminated)}</div></div>
                <div className="sm:col-span-2"><div className="font-mono text-[9px] uppercase text-cos-steel">Resulting state</div><pre className="mt-2 overflow-x-auto rounded border border-cos-border bg-cos-bg p-3 font-mono text-[10px] text-cos-text">{JSON.stringify(resultingState ?? {}, null, 2)}</pre></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Independent readback</div><div className="mt-2 flex flex-wrap items-center gap-2">{readbackProject ? <ScopeTag project={readbackProject} /> : null}<span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel">project: {readbackProject ?? "Not returned"}</span></div><div className="mt-2 flex flex-wrap items-center gap-2"><ProofBadge status={readbackProof} /><span className="font-mono text-xs text-cos-text">value {displayValue(readbackState?.value)} · version {displayValue(readbackState?.version)}</span></div></div>
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Execute resulting value</div><div className="mt-2 font-mono text-xs text-cos-text">{displayValue(resultingState?.value)}</div></div>
                {readbackError ? <div className="sm:col-span-2 rounded border border-cos-warn/40 bg-cos-warn/5 p-2 font-mono text-xs text-cos-warn">{readbackError}</div> : null}
                <div className="sm:col-span-2 font-mono text-[10px] text-cos-steel">Denials recorded: {consequence.denials.length}</div>
              </div>
              <p className="mt-4 border-t border-cos-border pt-3 text-[11px] leading-5 text-cos-muted">Receipt as returned by the authority layer at execute time; ledger persistence is verified only via the audit routes below</p>
            </div>
          ) : <HonestEmpty title={hasEvidence ? "Evidence payload observed" : "No evidence payload observed"} route="GET /v1/audit/verify" detail={hasEvidence ? "The response is available to the route-backed data layer." : "No verifier result has been returned."} />}
        </Pillar>
        <Pillar title="Ledger verification" proof={verifyRecord?.proof ?? "Not started"} detail="The ledger's own verification result, shown exactly as returned.">
          <JsonPanel value={verifyPayload} empty="No ledger verification result has been returned." />
        </Pillar>
      </div>
    </SectionShell>
  );
}
