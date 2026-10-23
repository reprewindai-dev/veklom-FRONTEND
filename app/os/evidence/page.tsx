"use client";

import { FormEvent, useEffect, useState } from "react";
import { GitBranch, Link2 } from "lucide-react";
import { api } from "@/lib/api";
import { DecisionGraph, type DecisionNode } from "@/components/cos/DecisionGraph";
import { EvidenceLookup } from "@/components/cos/ExecutionLookups";
import { Field, FailureNotice, JsonPanel } from "@/components/cos/StageParts";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { readSessionCapabilityLease, readSessionConsequence } from "@/lib/cos/lease-session";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { ScopeTag } from "@/components/cos/EnvironmentFrame";
import { compareReadback, pglChainVerifyPath, pglProof, pglProofLabel, pglProofPath, type PglProofLookup } from "@/lib/cos/readback";

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

  // Check the ledger yourself (PGL, W-11): by event hash, and by recomputing an agent's chain.
  const [eventHash, setEventHash] = useState("");
  const [agentId, setAgentId] = useState("");
  const [lookup, setLookup] = useState<PglProofLookup>();
  const [lookupError, setLookupError] = useState<string>();
  const [chain, setChain] = useState<unknown>();
  const [chainError, setChainError] = useState<string>();
  const [busy, setBusy] = useState<"event" | "chain" | null>(null);
  const anchoredEvent = typeof anchoring?.pgl_event_hash === "string" ? anchoring.pgl_event_hash : "";
  const anchoredAgent = typeof anchoring?.pgl_agent_id === "string" ? anchoring.pgl_agent_id : "";
  useEffect(() => {
    if (anchoredEvent) setEventHash((current) => current || anchoredEvent);
    if (anchoredAgent) setAgentId((current) => current || anchoredAgent);
  }, [anchoredEvent, anchoredAgent]);
  async function lookupEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hash = eventHash.trim();
    if (!hash) return;
    setBusy("event"); setLookup(undefined); setLookupError(undefined);
    try { setLookup(await api.get<PglProofLookup>(pglProofPath(hash))); }
    catch (error) { setLookupError(error instanceof Error ? error.message : "The ledger did not return this event."); }
    setBusy(null);
  }
  async function verifyChain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = agentId.trim();
    if (!id) return;
    setBusy("chain"); setChain(undefined); setChainError(undefined);
    try { setChain(await api.get<unknown>(pglChainVerifyPath(id))); }
    catch (error) { setChainError(error instanceof Error ? error.message : "The ledger did not verify this chain."); }
    setBusy(null);
  }
  const inputClass = "mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-sm text-cos-text";
  const buttonClass = "inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50";
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
                <div><div className="font-mono text-[9px] uppercase text-cos-steel">Independent ledger lookup</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{consequence.pglProof?.checked_at ? `Checked ${consequence.pglProof.checked_at}` : "Not run"}</div></div>
                {consequence.pglProof?.chain ? <><div><div className="font-mono text-[9px] uppercase text-cos-steel">Ledger chain status</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(consequence.pglProof.chain.status)}</div></div><div><div className="font-mono text-[9px] uppercase text-cos-steel">Ledger chain valid</div><div className="mt-2 break-all font-mono text-xs text-cos-text">{displayValue(consequence.pglProof.chain.valid)}</div></div></> : null}
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
        <Pillar title="Look up a ledger event" proof={lookup ? (lookup.persisted ? "Present" : "Degraded") : lookupError ? "Degraded" : "Not started"} detail="Is this event really in the ledger? Asked of the ledger itself, by the event's hash.">
          <form onSubmit={lookupEvent} className="space-y-3">
            <label className="block text-xs text-cos-muted">Event hash<input value={eventHash} onChange={(event) => setEventHash(event.target.value)} placeholder="ledger event hash" className={inputClass} /></label>
            <button type="submit" disabled={busy !== null || !eventHash.trim()} className={buttonClass}><Link2 size={13} />{busy === "event" ? "Looking up…" : "Look up"}</button>
          </form>
          <div className="mt-3 space-y-3">
            {lookupError ? <FailureNotice detail={lookupError} /> : null}
            {lookup ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Persisted" value={lookup.persisted === undefined ? undefined : String(lookup.persisted)} />
                <Field label="Status" value={lookup.status} />
                <Field label="Event hash" value={lookup.event_hash} />
                <Field label="Signature verification" value={lookup.cryptographic_verification ?? "Not returned"} />
              </div>
            ) : null}
          </div>
        </Pillar>
        <Pillar title="Verify a hash chain" proof={chain ? "Present" : chainError ? "Degraded" : "Not started"} detail="Recompute an agent's ledger chain. Tamper-evident means a changed entry breaks the chain; it is not a claim of storage finality.">
          <form onSubmit={verifyChain} className="space-y-3">
            <label className="block text-xs text-cos-muted">Agent<input value={agentId} onChange={(event) => setAgentId(event.target.value)} placeholder="ledger agent id" className={inputClass} /></label>
            <button type="submit" disabled={busy !== null || !agentId.trim()} className={buttonClass}><GitBranch size={13} />{busy === "chain" ? "Verifying…" : "Verify chain"}</button>
          </form>
          <div className="mt-3">{chainError ? <FailureNotice detail={chainError} /> : chain ? <JsonPanel value={chain} /> : null}</div>
        </Pillar>
        <Pillar title="Ledger verification" proof={verifyRecord?.proof ?? "Not started"} detail="The ledger's own verification result, shown exactly as returned.">
          <JsonPanel value={verifyPayload} empty="No ledger verification result has been returned." />
        </Pillar>
      </div>
    </SectionShell>
  );
}
