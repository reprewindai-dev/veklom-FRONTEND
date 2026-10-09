"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, BarChart2, Database, RefreshCw, Search } from "lucide-react";
import { ProofBadge } from "./ProofBadge";
import { useSandboxMode } from "@/lib/cos/sandbox";
import type { useStageData } from "@/lib/cos/useStageData";
import { formatObservedCount, proofRecordStatus, requestStillCurrent } from "@/lib/cos/vertical-slice-truth";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";

/**
 * Execution-bound lookups restored from the original Capability OS harnesses
 * (rescue/capability-os-before-20260904: components/cos/EvidenceHarness.tsx, MeasureHarness.tsx).
 * Both read only what the backend returns for one execution; unresolved references stay unresolved
 * and a missing record is missing proof, never a pending state.
 */
type StageData = ReturnType<typeof useStageData>;

function initialExecutionId(): string {
  try {
    return readSessionCapabilityLease()?.executionId ?? window.sessionStorage.getItem("veklom_execution_id") ?? "";
  } catch {
    return "";
  }
}

function useExecutionLookup<T extends { execution_id?: string }>(stageData: StageData, suffix: "evidence" | "measurements", response: string) {
  const [executionId, setExecutionId] = useState("");
  const [record, setRecord] = useState<T | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = useRef("");
  const sequenceRef = useRef(0);

  useEffect(() => {
    const id = initialExecutionId();
    current.current = id;
    setExecutionId(id);
  }, []);

  const change = (value: string) => {
    sequenceRef.current += 1;
    current.current = value;
    setExecutionId(value);
    setLoading(false);
    setRecord(null);
    setError(null);
    setMismatch(false);
  };

  async function retrieve() {
    if (!executionId) return;
    const requested = executionId;
    const sequence = ++sequenceRef.current;
    setLoading(true); setError(null); setRecord(null); setMismatch(false);
    try {
      const result = await stageData.call<T>({
        method: "GET",
        path: `/v1/executions/${encodeURIComponent(requested)}/${suffix}`,
        classification: "present",
        response,
      });
      if (!requestStillCurrent(requested, current.current, sequence, sequenceRef.current)) return;
      if (result.record.paymentRequired) {
        setError("The service asked for payment (402) before returning this record. Nothing was returned.");
        return;
      }
      if (!result.data) {
        setError(result.record.status === 404
          ? `Nothing was returned for execution ${requested} (404). Missing evidence is missing proof, not a pending state.`
          : result.record.error ?? "Unavailable");
        return;
      }
      setRecord(result.data);
      setMismatch(result.data.execution_id !== requested);
    } catch (caught) {
      if (requestStillCurrent(requested, current.current, sequence, sequenceRef.current)) {
        setError(caught instanceof Error ? caught.message : "Unavailable");
      }
    } finally {
      if (requestStillCurrent(requested, current.current, sequence, sequenceRef.current)) setLoading(false);
    }
  }

  return { executionId, change, retrieve, record, mismatch, loading, error };
}

function LookupForm({ id, label, value, onChange, onSubmit, loading, action }: { id: string; label: string; value: string; onChange: (value: string) => void; onSubmit: () => void; loading: boolean; action: string }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label htmlFor={id} className="flex-1 text-xs text-cos-muted">{label}<input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder="Execution ID" className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-sm text-cos-text" /></label>
      <button type="submit" disabled={loading || !value} className="inline-flex items-center justify-center gap-2 rounded-lg border border-cos-accent/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent disabled:opacity-50">{loading ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}{loading ? "Looking up…" : action}</button>
    </form>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-cos-border bg-cos-bg/40 p-3"><div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">{label}</div><div className="mt-1 break-all font-mono text-xs text-cos-text">{value}</div></div>;
}

type EvidenceRecord = {
  execution_id: string;
  proof_state: "verified" | "verified_with_unresolved_refs" | "failed" | "unknown";
  verification_reasons?: string[];
  eee?: { envelope_hash?: string; status?: string; capability_id?: string };
  pgl?: { event_id?: string; certificate_id?: string; event_hash?: string; previous_event_hash?: string | null; persisted?: boolean };
};

/** One execution's signed receipt (execution envelope) and its exact persisted ledger link. */
export function EvidenceLookup({ stageData }: { stageData: StageData }) {
  const sandbox = useSandboxMode();
  const lookup = useExecutionLookup<EvidenceRecord>(stageData, "evidence", "execution-bound receipt and ledger evidence");
  const record = lookup.record;
  const reasons = [...(record?.verification_reasons ?? []), ...(lookup.mismatch ? ["execution_id_mismatch"] : [])];
  const proof = proofRecordStatus({ verified: record?.proof_state === "verified" && !lookup.mismatch, degraded: Boolean(lookup.error) || lookup.mismatch, sandbox });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><p className="text-xs leading-5 text-cos-muted">Retrieve the receipt for one execution and its persisted ledger link.</p><ProofBadge status={proof} /></div>
      <LookupForm id="evidence-execution" label="Execution" value={lookup.executionId} onChange={lookup.change} onSubmit={lookup.retrieve} loading={lookup.loading} action="Retrieve evidence" />
      {lookup.error ? <div className="rounded-lg border border-cos-warn/40 bg-cos-warn/5 p-3 text-xs text-cos-warn">Evidence not verified: {lookup.error}</div> : null}
      {!lookup.error && !record && !lookup.loading ? <div className="flex items-center gap-2 text-xs text-cos-steel"><Database size={14} />No execution evidence loaded.</div> : null}
      {record ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Fact label="Execution" value={record.execution_id} />
            <Fact label="Proof state" value={record.proof_state ?? "unknown"} />
            <Fact label="Receipt status" value={record.eee?.status ?? "unknown"} />
            <Fact label="Capability" value={record.eee?.capability_id ?? "unknown"} />
            <Fact label="Receipt (envelope) hash" value={record.eee?.envelope_hash ?? "missing"} />
            <Fact label="Ledger event" value={record.pgl?.event_id ?? "missing"} />
            <Fact label="Ledger event hash" value={record.pgl?.event_hash ?? "missing"} />
            <Fact label="Previous event hash" value={record.pgl?.previous_event_hash ?? "unresolved"} />
            <Fact label="Certificate" value={record.pgl?.certificate_id ?? "missing"} />
            <Fact label="Persisted" value={record.pgl?.persisted === undefined ? "not returned" : String(record.pgl.persisted)} />
          </div>
          {reasons.length ? <div className="rounded-lg border border-cos-unknown/30 p-3 text-xs text-cos-unknown">Unresolved: {reasons.join(", ")}</div> : null}
          <p className="text-[11px] leading-5 text-cos-steel">The ledger is tamper-evident (hash-chained). Signature verification of ledger entries is not yet proven.</p>
        </div>
      ) : null}
    </div>
  );
}

type Measurement = {
  execution_id: string;
  proof_state: "verified" | "failed" | "unknown" | "degraded";
  vnp_api_did?: string;
  provider?: string;
  resulting_state?: { hash?: string; independently_observed?: boolean };
  observations?: Array<{ probe_id: string; worker_id: string; region: string; latency_ms: number; status_code: number; signature: string }>;
  aggregates?: Array<{ region: string; p50_latency_ms: number; p95_latency_ms: number; p99_latency_ms: number; error_rate_percent: number; uptime_percent: number; throughput_rps: number; measured_at: string }>;
};

/** Signed external observations of the provider used by one governed execution. */
export function MeasurementLookup({ stageData }: { stageData: StageData }) {
  const sandbox = useSandboxMode();
  const lookup = useExecutionLookup<Measurement>(stageData, "measurements", "execution-bound signed measurement");
  const measurement = lookup.record;
  const verified = measurement?.proof_state === "verified" && measurement.resulting_state?.independently_observed === true && !lookup.mismatch;
  const proof = proofRecordStatus({ verified, degraded: Boolean(lookup.error) || lookup.mismatch, sandbox });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3"><p className="text-xs leading-5 text-cos-muted">Signed probes of the provider one execution used. Missing probes are missing proof.</p><ProofBadge status={proof} /></div>
      <LookupForm id="measure-execution" label="Execution" value={lookup.executionId} onChange={lookup.change} onSubmit={lookup.retrieve} loading={lookup.loading} action="Fetch observation" />
      {lookup.error ? <div className="rounded-lg border border-cos-warn/40 bg-cos-warn/5 p-3 text-xs text-cos-warn">Measurement not verified: {lookup.error}</div> : null}
      {!lookup.error && !measurement && !lookup.loading ? <div className="flex items-center gap-2 text-xs text-cos-steel"><Activity size={14} />No signed observation requested yet.</div> : null}
      {measurement ? (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Fact label="Execution" value={measurement.execution_id} />
            <Fact label="Provider" value={measurement.provider ?? "unknown"} />
            <Fact label="Measurement service ID" value={measurement.vnp_api_did ?? "missing"} />
            <Fact label="Signed probes" value={formatObservedCount(measurement.observations)} />
            <Fact label="Observed result state" value={measurement.resulting_state?.hash ?? "missing"} />
          </div>
          {!verified ? <div className="rounded-lg border border-cos-unknown/30 p-3 text-xs text-cos-unknown">Proof state: {lookup.mismatch ? "execution_id_mismatch" : measurement.proof_state ?? "unknown"}. Independent resulting-state proof was not established.</div> : null}
          {(measurement.aggregates ?? []).length ? (
            <div className="grid gap-3 md:grid-cols-3">{(measurement.aggregates ?? []).map((row) => (
              <div key={`${row.region}-${row.measured_at}`} className="rounded-lg border border-cos-border bg-cos-bg/40 p-3 font-mono text-xs text-cos-text">
                <div className="mb-2 flex items-center gap-2 text-cos-accent"><BarChart2 size={13} />{row.region}</div>
                <div>p50 {row.p50_latency_ms} ms · p95 {row.p95_latency_ms} ms · p99 {row.p99_latency_ms} ms</div>
                <div>uptime {row.uptime_percent}% · errors {row.error_rate_percent}%</div>
                <div className="mt-1 text-[10px] text-cos-steel">measured {row.measured_at}</div>
              </div>
            ))}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
