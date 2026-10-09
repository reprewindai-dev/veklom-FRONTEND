"use client";

import type { ReactNode } from "react";
import { projectOfRecord, rowVisibleInEnvironment, useSandboxMode } from "@/lib/cos/sandbox";
import { ScopeTag } from "./EnvironmentFrame";

type Row = Record<string, unknown>;

export function rowsFromPayload(value: unknown, keys: string[] = ["items", "entries", "events", "records", "runs"]): Row[] | undefined {
  const isRow = (item: unknown): item is Row => Boolean(item && typeof item === "object" && !Array.isArray(item));
  if (Array.isArray(value)) return value.filter(isRow);
  if (!isRow(value)) return undefined;
  for (const key of keys) {
    const nested = value[key];
    if (Array.isArray(nested)) return nested.filter(isRow);
  }
  return undefined;
}

/**
 * Environment-segregated evidence/receipt rows. Every row is tagged with the
 * environment derived from CAPPO's returned project; sandbox views show only
 * sandbox-scoped rows and live views never show them.
 */
export function EnvironmentRows({
  rows,
  empty,
  idOf,
  extra,
}: {
  rows: Row[];
  empty: string;
  idOf: (row: Row, index: number) => string;
  extra?: (row: Row) => ReactNode;
}) {
  const sandbox = useSandboxMode();
  const visible = rows.filter((row) => rowVisibleInEnvironment(row, sandbox));
  const hidden = rows.length - visible.length;
  return (
    <div className="space-y-2" data-testid="environment-rows">
      {visible.length ? visible.map((row, index) => (
        <div key={`${idOf(row, index)}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-cos-border bg-cos-bg/35 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2"><ScopeTag project={projectOfRecord(row)} /><span className="truncate font-mono text-xs text-cos-text">{idOf(row, index)}</span></div>
          {extra ? extra(row) : null}
        </div>
      )) : <p className="text-xs text-cos-muted">{empty}</p>}
      {hidden > 0 ? (
        <p className="font-mono text-[10px] text-cos-steel">
          {hidden} {sandbox ? "live or unscoped" : "sandbox"} row{hidden === 1 ? "" : "s"} hidden in this environment{sandbox ? " (the authority layer returned no project=sandbox scope for them)" : ""}.
        </p>
      ) : null}
    </div>
  );
}
