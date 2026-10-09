"use client";

import { useCallback, useEffect, useState } from "react";
import { Ban, RefreshCw, ShieldAlert, UserCheck } from "lucide-react";
import type { useStageData } from "@/lib/cos/useStageData";
import type { StageEndpoint } from "@/lib/cos/stages";
import { HonestEmpty } from "./SectionPillars";
import { FailureNotice } from "./StageParts";

/**
 * Govern's approvals queue: requests the authority layer held for human approval.
 * Layout harvested from the Interlink QuarantineCenter (components/interlink/governance); its
 * seeded scenarios are not used. Every row, status and decision comes from the authority layer.
 */
type QuarantineItem = {
  quarantine_id: string;
  reason?: string;
  status?: string;
  approval_required?: boolean;
  approvers_required?: number;
  approvals_received?: string[];
  deadline?: string;
  requester_id?: string;
};

type StageData = ReturnType<typeof useStageData>;

const queueEndpoint: StageEndpoint = { method: "GET", path: "/v1/governance/v2/quarantine", classification: "needs_proof", qualification: "in-memory, not durable", response: "quarantine queue" };

export function QuarantineQueue({ stageData }: { stageData: StageData }) {
  const [items, setItems] = useState<QuarantineItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const { call } = stageData;

  const load = useCallback(async () => {
    setBusy("load");
    setError(null);
    const result = await call<{ items?: QuarantineItem[] }>(queueEndpoint);
    if (result.data && Array.isArray(result.data.items)) setItems(result.data.items);
    else setError(result.record.error ?? "The approvals queue was not returned.");
    setBusy(null);
  }, [call]);

  useEffect(() => { void load(); }, [load]);

  async function deny(id: string) {
    const reason = reasons[id]?.trim();
    if (!reason) return;
    setBusy(id);
    const result = await call<{ status?: string }>(
      { method: "POST", path: `/v1/governance/v2/quarantine/${encodeURIComponent(id)}/deny`, classification: "needs_proof", response: "quarantine status" },
      { reason },
    );
    if (!result.data) setError(result.record.error ?? "The denial was not recorded.");
    await load();
    setBusy(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-cos-muted">Requests held for human approval before they can act. This queue lives in the authority service's memory and resets when it restarts.</p>
        <button type="button" onClick={() => void load()} disabled={busy !== null} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-text disabled:opacity-50"><RefreshCw size={13} className={busy === "load" ? "animate-spin" : ""} />Refresh</button>
      </div>
      {error ? <FailureNotice detail={error} /> : null}
      {items && !items.length ? <HonestEmpty title="Nothing is waiting for approval" route="GET /v1/governance/v2/quarantine" detail="Held requests appear here when the authority layer quarantines them." /> : null}
      {items?.map((item) => (
        <div key={item.quarantine_id} className="rounded-xl border border-cos-warn/30 bg-cos-warn/[0.04] p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-mono text-cos-text"><ShieldAlert size={14} className="text-cos-warn" />{item.quarantine_id}</span>
            <span className="font-mono uppercase tracking-[0.12em] text-cos-steel">{item.status ?? "status not returned"}</span>
          </div>
          <p className="mt-2 leading-5 text-cos-muted">{item.reason ?? "No reason returned."}</p>
          <div className="mt-2 grid gap-1 font-mono text-[10px] text-cos-steel sm:grid-cols-3">
            <span>requester: {item.requester_id ?? "not returned"}</span>
            <span>approvals: {item.approvals_received?.length ?? 0} of {item.approvers_required ?? "?"}</span>
            <span>deadline: {item.deadline ?? "not returned"}</span>
          </div>
          {item.status === "pending" || item.status === "quarantined" || item.approval_required ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input value={reasons[item.quarantine_id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [item.quarantine_id]: event.target.value }))} placeholder="Reason for denying" className="flex-1 rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-xs text-cos-text" />
              <button type="button" onClick={() => void deny(item.quarantine_id)} disabled={busy !== null || !reasons[item.quarantine_id]?.trim()} className="inline-flex items-center gap-1 rounded-lg border border-cos-warn/40 px-3 py-2 text-cos-warn disabled:opacity-50"><Ban size={13} />Deny</button>
              <span title="Approval needs the approver's trust score from the identity service, which is not wired to this page yet. The browser never invents it." className="inline-flex items-center gap-1 rounded-lg border border-dashed border-cos-border px-3 py-2 text-cos-steel"><UserCheck size={13} />Approve: manual step</span>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
