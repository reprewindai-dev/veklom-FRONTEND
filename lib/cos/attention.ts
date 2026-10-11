/**
 * Attention: what needs the human now, derived only from what CAPPO returned.
 *
 * Two sources today:
 *   GET /v1/governance/v2/quarantine — requests held for approval (in-memory in CAPPO, not durable)
 *   GET /v1/runs                     — governed execution runs
 *
 * The rule from the Activity Cue applies here too: nothing in this file invents a state.
 * A value CAPPO did not return maps to nothing, and a source we could not read is reported
 * as unread, never as "nothing needs you".
 */

import type { ActivityCondition } from "@/components/cos/VeklomActivityCue";
import { rowVisibleInEnvironment } from "./sandbox";

/** Ordered by how urgently a human is needed. */
export type AttentionNeed = "needs_you" | "uncertain" | "failed" | "running" | "done";

export const NEED_RANK: Record<AttentionNeed, number> = {
  needs_you: 0,
  uncertain: 1,
  failed: 2,
  running: 3,
  done: 4,
};

export interface AttentionItem {
  id: string;
  source: "approval" | "run";
  need: AttentionNeed;
  condition: ActivityCondition;
  title: string;
  detail: string;
  href: string;
  /** Identifier of the evidence that backs this state, when CAPPO returned one. */
  evidenceRef?: string;
  /** ISO time CAPPO returned for ordering (run creation, approval deadline). */
  at?: string;
}

export type SourceRead = "pending" | "ok" | "unavailable";

export interface AttentionSummary {
  condition: ActivityCondition;
  label: string;
  /** Items that need a human decision or check: approvals waiting and outcomes unknown. */
  count: number;
}

type Row = Record<string, unknown>;

function rows(payload: unknown, key: string): Row[] {
  const isRow = (item: unknown): item is Row => Boolean(item && typeof item === "object" && !Array.isArray(item));
  if (Array.isArray(payload)) return payload.filter(isRow);
  if (isRow(payload) && Array.isArray(payload[key])) return (payload[key] as unknown[]).filter(isRow);
  return [];
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export function attentionAnchor(source: AttentionItem["source"], id: string): string {
  return `${source}-${id.replace(/[^A-Za-z0-9_-]/g, "_")}`;
}

/** Quarantine queue → approval items. Status values are CAPPO's QuarantineStatus. */
export function approvalItems(payload: unknown, sandbox: boolean): AttentionItem[] {
  return rows(payload, "items")
    .filter((row) => rowVisibleInEnvironment(row, sandbox))
    .flatMap((row): AttentionItem[] => {
      const id = text(row.quarantine_id);
      const status = text(row.status)?.toLowerCase();
      if (!id || !status) return [];
      const reason = text(row.reason) ?? "held by governance";
      const received = Array.isArray(row.approvals_received) ? row.approvals_received.length : 0;
      const required = typeof row.approvers_required === "number" ? row.approvers_required : undefined;
      const base = { id, source: "approval" as const, href: `/os/tracker#${attentionAnchor("approval", id)}`, at: text(row.deadline) };
      if (status === "quarantined") {
        const progress = required !== undefined ? ` · ${received} of ${required} approvals` : "";
        return [{ ...base, need: "needs_you", condition: "degraded", title: "Waiting for approval", detail: `${reason}${progress}` }];
      }
      if (status === "denied") return [{ ...base, need: "failed", condition: "failed", title: "Request denied", detail: text(row.resolution_reason) ?? reason }];
      if (status === "approved") return [{ ...base, need: "done", condition: "present", title: "Approved", detail: text(row.resolved_by) ? `approved by ${row.resolved_by}` : reason }];
      if (status === "auto_released") return [{ ...base, need: "done", condition: "present", title: "Released without approval", detail: text(row.resolution_reason) ?? "released automatically; no approval recorded" }];
      return [];
    });
}

/**
 * Runs → execution items. States are CAPPO's RunState (upper case); the lower-case words are
 * the outcome vocabulary other run producers use. ATTESTED is signed by CAPPO but not
 * independently checked here, so it is "present", never "verified".
 */
const RUNNING = new Set(["created", "compiled", "contextualized", "governed", "committed", "ei_minted", "eat_minted", "routed", "executing", "running", "active", "in_progress"]);
const UNCERTAIN = new Set(["uncertain", "outcome_uncertain", "outcome_unknown", "commit_uncertain", "unknown"]);
const FAILED = new Set(["failed", "denied", "revoked", "expired", "cancelled", "aborted"]);
const DONE = new Set(["executed", "attested", "completed", "succeeded", "success", "finalized", "allow"]);

export function runItems(payload: unknown, sandbox: boolean): AttentionItem[] {
  return rows(payload, "runs")
    .filter((row) => rowVisibleInEnvironment(row, sandbox))
    .flatMap((row): AttentionItem[] => {
      const id = text(row.run_id) ?? text(row.id);
      const raw = text(row.state) ?? text(row.status) ?? text(row.outcome);
      if (!id || !raw) return [];
      const state = raw.toLowerCase();
      const identity = row.execution_identity && typeof row.execution_identity === "object" ? row.execution_identity as Row : undefined;
      const evidenceRef = text(row.execution_identity) ?? text(identity?.execution_id) ?? text(row.execution_id);
      const base = { id, source: "run" as const, href: `/os/tracker#${attentionAnchor("run", id)}`, at: text(row.created_at), evidenceRef, detail: `state ${raw}` };
      if (UNCERTAIN.has(state)) return [{ ...base, need: "uncertain", condition: "degraded", title: "Outcome unknown — check before retrying" }];
      if (FAILED.has(state)) return [{ ...base, need: "failed", condition: "failed", title: "Run failed" }];
      if (RUNNING.has(state)) return [{ ...base, need: "running", condition: "active", title: "Running" }];
      if (DONE.has(state)) return [{ ...base, need: "done", condition: "present", title: state === "attested" ? "Finished, signed" : "Finished" }];
      return [];
    });
}

export function rankAttention(items: AttentionItem[]): AttentionItem[] {
  return [...items].sort((a, b) => {
    const rank = NEED_RANK[a.need] - NEED_RANK[b.need];
    if (rank) return rank;
    return (b.at ?? "").localeCompare(a.at ?? "");
  });
}

/**
 * The one glance: the most urgent thing, never better than the evidence. If every source is
 * unreadable the answer is "unknown", not "all clear".
 */
export function summarizeAttention(items: AttentionItem[], reads: SourceRead[]): AttentionSummary {
  const count = items.filter((item) => item.need === "needs_you" || item.need === "uncertain").length;
  const waiting = items.filter((item) => item.need === "needs_you").length;
  const uncertain = items.filter((item) => item.need === "uncertain").length;
  const anyOk = reads.some((read) => read === "ok");
  const anyMissing = reads.some((read) => read !== "ok");
  if (waiting) return { condition: "degraded", label: `${waiting} waiting for your approval`, count };
  if (uncertain) return { condition: "degraded", label: `${uncertain} outcome${uncertain === 1 ? "" : "s"} unknown`, count };
  if (items.some((item) => item.need === "running")) return { condition: "active", label: "Work running", count };
  if (!anyOk) {
    return reads.every((read) => read === "pending")
      ? { condition: "unknown", label: "Checking activity", count }
      : { condition: "unknown", label: "Activity could not be read", count };
  }
  return { condition: "unknown", label: anyMissing ? "Nothing needs you in what could be read" : "Nothing needs you", count };
}
