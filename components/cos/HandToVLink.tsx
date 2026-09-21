"use client";

import { useState } from "react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { ProofBadge } from "@/components/cos/ProofBadge";
import {
  clearHolderCredential,
  readSessionCapabilityLease,
  storeSessionCapabilityLease,
  type SessionCapabilityLease,
} from "@/lib/cos/lease-session";
import { buildHandoffRequest } from "@/lib/cos/vlink-handoff";

type JsonRecord = Record<string, unknown>;

type Props = {
  lease: SessionCapabilityLease;
  onChange(lease: SessionCapabilityLease): void;
};

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

async function readResponseBody(response: Response): Promise<{ raw: string; data?: JsonRecord }> {
  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as unknown;
    return { raw, data: asRecord(parsed) };
  } catch {
    return { raw };
  }
}

export function HandToVLink({ lease, onChange }: Props) {
  const [vlinkId, setVlinkId] = useState(lease.vlinkHandoff?.vlinkId ?? "");
  const [grant, setGrant] = useState("");
  const [busy, setBusy] = useState<"handoff" | "refresh" | "revoke" | null>(null);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [lastDecision, setLastDecision] = useState<JsonRecord>();

  const handoff = lease.vlinkHandoff;
  const status = handoff?.status;

  function persist(nextLease: SessionCapabilityLease) {
    storeSessionCapabilityLease(nextLease);
    onChange(nextLease);
  }

  async function handToVLink() {
    setError(undefined);
    setMessage(undefined);
    setLastDecision(undefined);
    if (!lease.expiresAt) {
      setError("mount did not return expires_at");
      return;
    }
    if (!lease.holderCredential) {
      setError("CAPPO holder credential is no longer present in this browser session");
      return;
    }
    if (!vlinkId.trim() || !grant.startsWith("vle_")) {
      setError("Enter a VLink ID and an enrollment grant beginning with vle_");
      return;
    }

    setBusy("handoff");
    try {
      const request = buildHandoffRequest(lease, vlinkId.trim(), grant);
      const response = await fetch(request.url, request.init);
      const result = await readResponseBody(response);
      if (response.status !== 201) {
        throw new Error(result.raw || `HTTP ${response.status}`);
      }
      const returnedLease = asRecord(result.data?.lease);
      const leaseId = asString(returnedLease?.leaseId);
      const returnedStatus = asString(returnedLease?.status);
      if (!leaseId || !returnedStatus) {
        throw new Error(result.raw || "VLink response did not return a lease");
      }
      const nextLease: SessionCapabilityLease = {
        ...lease,
        vlinkHandoff: {
          vlinkId: vlinkId.trim(),
          leaseId,
          status: returnedStatus,
          handedAt: new Date().toISOString(),
        },
      };
      storeSessionCapabilityLease(nextLease);
      clearHolderCredential();
      const clearedLease = readSessionCapabilityLease() ?? (() => {
        const { holderCredential: _holderCredential, ...withoutCredential } = nextLease;
        return withoutCredential;
      })();
      onChange(clearedLease);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(null);
    }
  }

  async function refreshVLinkLease() {
    if (!handoff || !grant.startsWith("vle_")) return;
    setError(undefined);
    setMessage(undefined);
    setBusy("refresh");
    try {
      const response = await fetch(
        `/vlink/connect/api/v1/vlinks/${encodeURIComponent(handoff.vlinkId)}/leases/${encodeURIComponent(handoff.leaseId)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${grant}` },
          cache: "no-store",
        },
      );
      const result = await readResponseBody(response);
      if (!response.ok) throw new Error(result.raw || `HTTP ${response.status}`);
      const returnedLease = asRecord(result.data?.lease);
      const returnedStatus = asString(returnedLease?.status);
      if (!returnedStatus) throw new Error(result.raw || "VLink response did not return a status");
      setLastDecision(asRecord(returnedLease?.lastDecision));
      const nextLease = {
        ...lease,
        vlinkHandoff: { ...handoff, status: returnedStatus },
      };
      persist(nextLease);
      setMessage(`VLink lease ${handoff.leaseId} · status ${returnedStatus}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(null);
    }
  }

  async function revokeViaVLink() {
    if (!handoff || !grant.startsWith("vle_")) return;
    setError(undefined);
    setMessage(undefined);
    setBusy("revoke");
    try {
      const response = await fetch(
        `/vlink/connect/api/v1/vlinks/${encodeURIComponent(handoff.vlinkId)}/leases/${encodeURIComponent(handoff.leaseId)}/revoke`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${grant}`,
          },
          body: JSON.stringify({}),
          cache: "no-store",
        },
      );
      const result = await readResponseBody(response);
      if (!response.ok) throw new Error(result.raw || `HTTP ${response.status}`);
      const returnedLease = asRecord(result.data?.lease);
      const returnedStatus = asString(returnedLease?.status) ?? "terminated";
      const nextLease: SessionCapabilityLease = {
        ...lease,
        terminated: true,
        terminatedBy: "vlink",
        vlinkHandoff: { ...handoff, status: returnedStatus },
      };
      persist(nextLease);
      setMessage(`VLink lease ${handoff.leaseId} · status ${returnedStatus}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Pillar title="Authority" proof={handoff ? "Present" : "Needs proof"}>
      {!lease.holderCredential && !handoff ? (
        <HonestEmpty
          title="No VLink handoff credential"
          route="POST /api/v1/vlinks/{vlink_id}/leases"
          detail="A VLink lease appears only after CAPPO returns a holder credential and VLink seals it."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm text-cos-text">Hand to VLink</h3>
              <p className="mt-1 text-xs text-cos-muted">
                The enrollment grant stays in this input and is never persisted.
              </p>
            </div>
            <ProofBadge status={handoff ? "Present" : "Needs proof"} />
          </div>
          <label className="block text-xs text-cos-muted">
            VLink ID
            <input
              value={vlinkId}
              onChange={(event) => setVlinkId(event.target.value)}
              className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-xs text-cos-text"
              placeholder="vlink_..."
              disabled={Boolean(handoff)}
            />
          </label>
          <label className="block text-xs text-cos-muted">
            Enrollment grant
            <input
              type="password"
              value={grant}
              onChange={(event) => setGrant(event.target.value)}
              className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-xs text-cos-text"
              placeholder="vle_..."
              autoComplete="off"
            />
          </label>
          {!handoff ? (
            <button
              type="button"
              onClick={handToVLink}
              disabled={busy !== null}
              className="rounded-lg bg-cos-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg disabled:opacity-50"
            >
              {busy === "handoff" ? "Handing off…" : "Hand to VLink"}
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refreshVLinkLease}
                disabled={busy !== null || !grant.startsWith("vle_")}
                className="rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50"
              >
                {busy === "refresh" ? "Refreshing…" : "Refresh VLink lease"}
              </button>
              <button
                type="button"
                onClick={revokeViaVLink}
                disabled={busy !== null || !grant.startsWith("vle_")}
                className="rounded-lg border border-cos-warn/40 px-3 py-2 text-xs text-cos-warn disabled:opacity-50"
              >
                {busy === "revoke" ? "Revoking…" : "Revoke via VLink"}
              </button>
            </div>
          )}
          {handoff ? (
            <p className="rounded-lg border border-cos-verified/30 bg-cos-verified/5 p-3 font-mono text-xs text-cos-text">
              Handed to VLink lease {handoff.leaseId} · status {status} · credential cleared from browser
            </p>
          ) : null}
          {lastDecision ? (
            <div className="rounded-lg border border-cos-border bg-cos-bg/35 p-3 text-xs">
              <div className="flex items-center gap-2">
                <ProofBadge status="Present" />
                <span className="font-mono text-cos-text">Last VLink decision</span>
              </div>
              <p className="mt-2 text-cos-muted">
                {asString(lastDecision.action) ?? "Not returned"} · {asString(lastDecision.decision) ?? "Not returned"} · {asString(lastDecision.reason) ?? "Not returned"}
              </p>
            </div>
          ) : null}
          {message ? <p className="text-xs text-cos-verified">{message}</p> : null}
          {error ? <p className="whitespace-pre-wrap break-all rounded-lg border border-cos-warn/40 bg-cos-warn/5 p-3 font-mono text-xs text-cos-warn">{error}</p> : null}
        </div>
      )}
    </Pillar>
  );
}
