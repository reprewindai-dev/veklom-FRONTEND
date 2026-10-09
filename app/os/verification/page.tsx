"use client";

import { FormEvent, useEffect, useState } from "react";
import { BadgeCheck, GitBranch, Link2, ScanSearch } from "lucide-react";
import { api } from "@/lib/api";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field, FailureNotice, JsonPanel } from "@/components/cos/StageParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { readSessionCapabilityLease, readSessionConsequence } from "@/lib/cos/lease-session";
import { pglChainVerifyPath, pglProofPath, type PglProofLookup } from "@/lib/cos/readback";

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/**
 * Verification (navigation map, Capability tools): check evidence yourself rather than trusting a
 * status. Uses the same ledger lookups the recorded runs used. RepoGate (W-13) has no routed
 * endpoint yet, so repository scanning is shown as not started, never simulated.
 */
export default function VerificationPage() {
  const stage = getStage("verification");
  const data = useStageData("verification");
  const [eventHash, setEventHash] = useState("");
  const [agentId, setAgentId] = useState("");
  const [lookup, setLookup] = useState<PglProofLookup>();
  const [lookupError, setLookupError] = useState<string>();
  const [chain, setChain] = useState<unknown>();
  const [chainError, setChainError] = useState<string>();
  const [busy, setBusy] = useState<"event" | "chain" | null>(null);

  useEffect(() => {
    // Pre-fill from the last consequence in this session, if there is one.
    const lease = readSessionCapabilityLease();
    const consequence = lease ? readSessionConsequence(lease.mountId) : null;
    const anchoring = asRecord(asRecord(consequence?.lastAllowedResponse ?? consequence?.response)?.anchoring);
    if (typeof anchoring?.pgl_event_hash === "string") setEventHash(anchoring.pgl_event_hash);
    if (typeof anchoring?.pgl_agent_id === "string") setAgentId(anchoring.pgl_agent_id);
  }, []);

  async function lookupEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hash = eventHash.trim();
    if (!hash) return;
    setBusy("event"); setLookup(undefined); setLookupError(undefined);
    try {
      setLookup(await api.get<PglProofLookup>(pglProofPath(hash)));
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : "The ledger did not return this event.");
    }
    setBusy(null);
  }

  async function verifyChain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = agentId.trim();
    if (!id) return;
    setBusy("chain"); setChain(undefined); setChainError(undefined);
    try {
      setChain(await api.get<unknown>(pglChainVerifyPath(id)));
    } catch (error) {
      setChainError(error instanceof Error ? error.message : "The ledger did not verify this chain.");
    }
    setBusy(null);
  }

  const inputClass = "mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-sm text-cos-text";
  const buttonClass = "inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50";

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
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
      <div className="xl:col-span-2">
        <Pillar title="Repository verification" proof="Not started" detail="Repository, artifact, dependency and provenance scanning (RepoGate) is not connected to this workspace yet.">
          <HonestEmpty title="Not started" route="RepoGate: no routed endpoint" detail="Nothing is scanned or shown here until the repository gate is connected. Any change it approves would still need a single-use grant to take effect." />
          <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-cos-steel"><span className="inline-flex items-center gap-1"><ScanSearch size={12} />scan</span><span className="inline-flex items-center gap-1"><BadgeCheck size={12} />provenance</span><span>appear here once connected</span></div>
        </Pillar>
      </div>
    </SectionShell>
  );
}
