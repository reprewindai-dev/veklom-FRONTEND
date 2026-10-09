"use client";

import { KeyRound } from "lucide-react";
import type { StageEndpoint } from "@/lib/cos/stages";
import type { ProofStatus } from "@/lib/cos/capabilities";
import type { SessionCapabilityLeaseGrants } from "@/lib/cos/lease-session";
import type { ActivityCondition } from "@/components/cos/VeklomActivityCue";
import { HonestEmpty } from "@/components/cos/SectionPillars";
import { Field } from "@/components/cos/StageParts";
import { ProofBadge } from "@/components/cos/ProofBadge";

/** Shared pieces of the mount → grant flow (Mount prepares, Authority issues and holds). */
export type JsonRecord = Record<string, unknown>;

export type PackagePayload = {
  id: string;
  family: string;
  title: string;
  purpose: string;
  reads?: string[];
  writes?: string[];
  blocked?: string[];
  target_ref?: string | null;
};

export type MountResponse = {
  decision?: string;
  reason?: string;
  anchoring?: { status?: string; anchor_id?: string | null; detail?: string | null };
  mount?: JsonRecord;
  token?: JsonRecord;
  holder_credential?: string;
};

export function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;
}
export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
export function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
export function mountEndpoint(method: StageEndpoint["method"], path: string, baseUrl?: string): StageEndpoint {
  return { method, path, classification: "present", response: "authority response", baseUrl };
}
export function listValue(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function returnedGrants(value: unknown): SessionCapabilityLeaseGrants | undefined {
  const source = asRecord(value);
  if (!source) return undefined;
  const grants: SessionCapabilityLeaseGrants = {};
  for (const key of ["reads", "writes", "blocked"] as const) {
    if (Array.isArray(source[key])) grants[key] = asStringList(source[key]);
  }
  return Object.keys(grants).length ? grants : undefined;
}

export function mountCondition(state: string | undefined): ActivityCondition | undefined {
  if (!state) return undefined;
  const normalized = state.toLowerCase();
  if (["mounted", "active"].includes(normalized)) return "active";
  if (["terminated", "expired", "revoked", "suspended", "failed"].includes(normalized)) return "failed";
  if (["issued", "created"].includes(normalized)) return "present";
  return undefined;
}

export function ScopeList({ label, values }: { label: string; values: string[] }) {
  return <div><div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">{label}</div>{values.length ? <ul className="mt-2 space-y-1 text-xs text-cos-text">{values.map((value) => <li key={value} className="rounded border border-cos-border bg-cos-bg/40 px-2 py-1 font-mono">{value}</li>)}</ul> : <p className="mt-2 text-xs text-cos-muted">None returned.</p>}</div>;
}

export function Anchoring({ value }: { value?: MountResponse["anchoring"] }) {
  const status = value?.status ?? "not_applicable";
  return <div className="rounded-lg border border-cos-border bg-cos-bg/40 p-3"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Evidence anchoring</span><span className="font-mono text-xs text-cos-text">{status}</span></div>{value?.anchor_id ? <p className="mt-2 break-all font-mono text-[10px] text-cos-muted">anchor_id: {value.anchor_id}</p> : null}{value?.detail ? <p className="mt-2 text-xs leading-5 text-cos-muted">{value.detail}</p> : null}</div>;
}

export function TokenDescriptor({ token, proof }: { token?: JsonRecord; proof: ProofStatus }) {
  if (!token) return <HonestEmpty title="No grant descriptor returned" route="POST /v1/capability/mounts" detail="The authority layer did not return a grant descriptor for this state." />;
  const scope = asRecord(token.scope);
  const grants = asRecord(token.grants);
  return <div className="space-y-4 rounded-xl border border-cos-accent/25 bg-cos-accent/[0.035] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><KeyRound size={15} className="text-cos-accent" /><h3 className="text-sm font-medium text-cos-text">Single-use grant</h3></div><ProofBadge status={proof} /></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Grant (token) ID" value={token.token_id} /><Field label="Mount ID" value={token.mount_id} /><Field label="Execution ID" value={token.execution_id} /><Field label="Package" value={token.package_ref} /><Field label="Issued at" value={token.issued_at} /><Field label="Expires at" value={token.expires_at} /><Field label="TTL seconds" value={token.ttl_seconds} /><Field label="Use" value={token.single_use === true ? "single-use; consumption state not returned" : "Not returned"} /></div><div className="grid gap-4 sm:grid-cols-2"><ScopeList label="Grant scope" values={[asString(scope?.workspace) ? `workspace: ${scope?.workspace}` : "", asString(scope?.project) ? `project: ${scope?.project}` : ""].filter(Boolean)} /><div className="space-y-4"><ScopeList label="Granted reads" values={asStringList(grants?.reads)} /><ScopeList label="Granted writes" values={asStringList(grants?.writes)} /><ScopeList label="Blocked actions" values={asStringList(grants?.blocked)} /></div></div><p className="text-[11px] leading-5 text-cos-steel">The grant secret and nonce are never shown. Only descriptor fields returned by the authority layer appear here.</p></div>;
}
