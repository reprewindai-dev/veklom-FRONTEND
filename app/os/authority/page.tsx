"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Ban, CheckCircle2, Clock3, KeyRound, ShieldAlert, SquareTerminal } from "lucide-react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field, FailureNotice } from "@/components/cos/StageParts";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { ScopeTag } from "@/components/cos/EnvironmentFrame";
import { HandToVLink } from "@/components/cos/HandToVLink";
import { VeklomActivityCue, type ActivityCondition } from "@/components/cos/VeklomActivityCue";
import {
  Anchoring,
  asRecord,
  asString,
  asStringList,
  mountCondition,
  mountEndpoint,
  returnedGrants,
  ScopeList,
  TokenDescriptor,
  type JsonRecord,
  type MountResponse,
} from "@/components/cos/MountParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { mountStatusProof } from "@/lib/cos/readback";
import { describeArguments, clearPendingExecutionIntent } from "@/lib/cos/execution-intent";
import { SANDBOX_PROJECT, useSandboxMode } from "@/lib/cos/sandbox";
import {
  clearSessionCapabilityLease,
  clearSessionConsequence,
  readSessionCapabilityLease,
  storeSessionCapabilityLease,
  type SessionCapabilityLease,
} from "@/lib/cos/lease-session";
import { clearMountBinding, mountRequestBody, readMountBinding, type MountBinding } from "@/lib/cos/mount-binding";

function identityCondition(value: Record<string, unknown>): ActivityCondition | undefined {
  if (value.revoked === true) return "failed";
  const lifecycle = asRecord(value.lifecycle);
  const raw = value.status ?? value.state ?? lifecycle?.status ?? lifecycle?.state;
  if (typeof raw !== "string") return undefined;
  const normalized = raw.toLowerCase();
  if (["active", "mounted"].includes(normalized)) return "active";
  if (normalized === "suspended") return "degraded";
  if (["revoked", "expired", "terminated", "failed"].includes(normalized)) return "failed";
  if (["issued", "created", "present"].includes(normalized)) return "present";
  return undefined;
}

function identityRows(payloads: Record<string, unknown>): Record<string, unknown>[] {
  return Object.values(payloads).flatMap((payload) => {
    if (Array.isArray(payload)) return payload.filter((item): item is Record<string, unknown> => Boolean(asRecord(item)));
    const record = asRecord(payload);
    if (!record) return [];
    const nested = Array.isArray(record.identities) ? record.identities : Array.isArray(record.agents) ? record.agents : undefined;
    return nested ? nested.filter((item): item is Record<string, unknown> => Boolean(asRecord(item))) : [record];
  });
}

/**
 * Authority (DESIGN_MODEL): identities, grants and revocation. "Authority does not create
 * permissions; it materializes permissions already approved by governance." Every decision below
 * is returned by the authority layer; the browser never predicts a grant.
 */
export default function AuthorityPage() {
  const stage = getStage("authority");
  const mountStage = getStage("mount");
  const capiBase = mountStage.endpoints[0]?.baseUrl;
  const cappoBase = mountStage.endpoints[4]?.baseUrl;
  const data = useStageData("authority", { autoGet: true });
  const sandbox = useSandboxMode();
  const [binding, setBinding] = useState<MountBinding | null>(null);
  const [requested, setRequested] = useState<MountBinding | null>(null);
  const [mountResponse, setMountResponse] = useState<MountResponse>();
  const [actionResponse, setActionResponse] = useState<JsonRecord>();
  const [heldLease, setHeldLease] = useState<SessionCapabilityLease | null>(null);
  const [action, setAction] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setBinding(readMountBinding());
    setHeldLease(readSessionCapabilityLease());
  }, []);

  const mount = asRecord(mountResponse?.mount);
  const token = asRecord(mountResponse?.token);
  const mountId = asString(mount?.id) ?? asString(token?.mount_id) ?? heldLease?.mountId;
  const lifecycle = asRecord(mount?.lifecycle);
  const lifecycleState = asString(lifecycle?.state);
  const isLive = lifecycleState === "mounted" && Boolean(token);
  const granted = asRecord(mount?.grants) ?? asRecord(token?.grants);
  const responseScope = asRecord(mount?.execution_scope) ?? asRecord(mount?.scope) ?? asRecord(token?.scope);
  const responseProject = asString(responseScope?.project) ?? heldLease?.project;
  const bindingScopeMismatch = binding ? (sandbox ? binding.project !== SANDBOX_PROJECT : binding.project === SANDBOX_PROJECT) : false;
  const heldLeaseScopeMismatch = heldLease ? (sandbox ? heldLease.project !== SANDBOX_PROJECT : heldLease.project === SANDBOX_PROJECT) : false;
  const holding = Boolean(heldLease && !heldLease.terminated);
  const rows = identityRows(Object.fromEntries(Object.entries(data.payloads).filter(([key]) => key.includes("/api/v1/agents"))));

  async function requestAuthority() {
    if (!binding || bindingScopeMismatch) return;
    setBusy(true);
    setActionResponse(undefined);
    setRequested(binding);
    const result = await data.call<MountResponse>(mountEndpoint("POST", "/v1/capability/mounts", capiBase), mountRequestBody(binding));
    if (result.data) {
      setMountResponse(result.data);
      const returnedMount = asRecord(result.data.mount);
      const returnedToken = asRecord(result.data.token);
      const returnedMountId = asString(returnedMount?.id) ?? asString(returnedToken?.mount_id);
      const tokenId = asString(returnedToken?.token_id);
      const nonce = asString(returnedToken?.nonce);
      if (result.data.decision === "allow" && returnedMountId && tokenId && nonce) {
        const holderCredential = asString(result.data.holder_credential);
        const boundResource = binding.intent?.operation.resource ?? binding.resource;
        const lease: SessionCapabilityLease = {
          mountId: returnedMountId,
          tokenId,
          nonce,
          packageRef: binding.packageRef,
          targetRef: binding.targetRef,
          workspace: binding.workspace,
          project: binding.project,
          resource: boundResource,
          grants: returnedGrants(returnedMount?.grants) ?? returnedGrants(returnedToken?.grants),
          executionId: asString(returnedToken?.execution_id),
          expiresAt: asString(returnedToken?.expires_at),
          ...(holderCredential ? { holderCredential } : {}),
          ...(binding.intent ? { intent: binding.intent } : {}),
        };
        clearSessionConsequence();
        storeSessionCapabilityLease(lease);
        setHeldLease(lease);
        // The intent now travels with the grant; another grant needs a fresh binding.
        if (binding.intent) clearPendingExecutionIntent();
        clearMountBinding();
        setBinding(null);
      }
    }
    setBusy(false);
  }

  async function refreshStatus() {
    if (!mountId) return;
    setBusy(true);
    const result = await data.call<MountResponse>(mountEndpoint("GET", `/v1/capability/mounts/${mountId}`, capiBase));
    if (result.data) setMountResponse(result.data);
    setBusy(false);
  }

  async function evaluateAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mountId || !token || !action) return;
    setBusy(true);
    const resource = requested?.intent?.operation.resource ?? requested?.resource;
    const result = await data.call<JsonRecord>(mountEndpoint("POST", `/v1/capability/mounts/${mountId}/actions`, capiBase), { token_id: token.token_id, nonce: token.nonce, action, resource: resource || undefined });
    if (result.data) setActionResponse(result.data);
    setBusy(false);
  }

  async function revoke() {
    if (!mountId) return;
    setBusy(true);
    const result = await data.call<JsonRecord>(mountEndpoint("POST", `/v1/capability/mounts/${mountId}/terminate`, cappoBase), { reason: "explicit_terminate" });
    if (result.data) {
      const response = result.data as MountResponse;
      const isTerminated = response.decision === "allow" && (response.reason === "terminated" || response.reason === "already_terminated");
      setMountResponse({ ...response, mount: isTerminated && mount ? { ...mount, lifecycle: { ...lifecycle, state: "terminated" } } : mount });
      if (isTerminated) {
        clearSessionCapabilityLease();
        setHeldLease(null);
      }
    }
    setBusy(false);
  }

  const requestedReads = requested?.reads ?? [];
  const requestedWrites = requested?.writes ?? [];
  const requestedResources = (requested?.intent?.operation.resource ?? requested?.resource) ? [String(requested?.intent?.operation.resource ?? requested?.resource)] : [];

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar title="Request a grant" proof={mountResponse ? (mountResponse.decision === "allow" ? "Present" : "Degraded") : binding ? "Manual step" : "Not started"} detail="One bounded, single-use grant for the binding prepared in Mount. The authority layer decides; nothing is predicted here.">
          {binding ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-cos-border bg-cos-bg/35 p-4 sm:grid-cols-2">
                <Field label="Package" value={binding.packageTitle ? `${binding.packageTitle} (${binding.packageRef})` : binding.packageRef} />
                <Field label="Target" value={binding.targetRef ?? "None declared"} />
                <Field label="Workspace" value={binding.workspace} />
                <Field label="Project" value={binding.project} />
                <Field label="Reads requested" value={binding.reads.join(", ") || "None"} />
                <Field label="Writes requested" value={binding.writes.join(", ") || "None"} />
                <Field label="Resource" value={binding.intent?.operation.resource ?? binding.resource ?? "Every resource the granted actions reach"} />
                <Field label="Requested lifetime" value={`${binding.ttlSeconds} s`} />
              </div>
              {binding.intent ? <div className="rounded-lg border border-cos-accent/40 bg-cos-accent/[0.05] p-3 text-xs leading-5 text-cos-muted"><div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Bounded operation from contract {binding.intent.contractId}</div><div className="mt-1 text-cos-text">{binding.intent.clause}</div><div className="mt-1 font-mono text-cos-text">{binding.intent.operation.action} · {binding.intent.operation.target_ref} · resource {binding.intent.operation.resource} · {describeArguments(binding.intent.operation.arguments)}</div></div> : null}
              {bindingScopeMismatch ? <p className="text-xs text-cos-warn">This binding was prepared in {binding.project === SANDBOX_PROJECT ? "sandbox" : "live"} scope. Switch back, or prepare a new binding in Mount.</p> : null}
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={requestAuthority} disabled={busy || bindingScopeMismatch || holding} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg disabled:cursor-not-allowed disabled:opacity-50"><KeyRound size={14} />{busy ? "Requesting…" : "Request grant"}</button>
                <Link href="/os/mount" className="text-xs text-cos-muted underline hover:text-cos-text">Change the binding in Mount</Link>
                {holding ? <span className="text-xs text-cos-warn">You already hold a grant. Use or revoke it before requesting another.</span> : null}
              </div>
            </div>
          ) : !mountResponse ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cos-border bg-cos-bg/35 p-4 text-xs text-cos-muted">
              <span>No binding is waiting. Choose a capability package and its scope in Mount first.</span>
              <Link href="/os/mount" className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 font-semibold uppercase tracking-[0.12em] text-cos-accent">Go to Mount <ArrowRight size={13} /></Link>
            </div>
          ) : null}
          {mountResponse ? (
            <div className="mt-4 space-y-4">
              <div className={`rounded-xl border p-4 ${mountResponse.decision === "allow" ? "border-cos-verified/30 bg-cos-verified/5" : "border-cos-warn/30 bg-cos-warn/5"}`}>
                <div className="flex flex-wrap items-center gap-2">{mountResponse.decision === "allow" ? <CheckCircle2 size={16} className="text-cos-verified" /> : <ShieldAlert size={16} className="text-cos-warn" />}<ScopeTag project={responseProject} /><span className="font-mono text-xs uppercase tracking-[0.14em] text-cos-text">{mountResponse.decision ?? "Not returned"} · {mountResponse.reason ?? "No reason returned"}</span>{mountCondition(lifecycleState) ? <VeklomActivityCue kind="authority" condition={mountCondition(lifecycleState)} startedAt={asString(token?.issued_at) ? new Date(String(token?.issued_at)) : asString(mount?.created_at) ? new Date(String(mount?.created_at)) : undefined} size={18} showCaption={false} /> : null}</div>
                <div className="mt-3"><Anchoring value={mountResponse.anchoring} /></div>
              </div>
              {lifecycleState && lifecycleState !== "mounted" ? <FailureNotice detail={`The mount is ${lifecycleState}. No live grant exists for this state.`} /> : null}
            </div>
          ) : null}
        </Pillar>
      </div>
      <Pillar title="Grant" proof={token && isLive ? mountStatusProof(data.records) : mountResponse ? "Present" : "Not started"}>
        {token && isLive ? <TokenDescriptor token={token} proof={mountStatusProof(data.records)} /> : <HonestEmpty title="No live grant" route="POST /v1/capability/mounts" detail="A grant appears here only when the authority layer returns one. Expired and revoked grants are shown without a descriptor." />}
      </Pillar>
      <Pillar title="Held grant" proof={holding ? "Present" : "Not started"} detail="The grant this browser session holds, its revocation and where it goes next.">
        {heldLease && holding ? (
          <div className="space-y-3">
            <Field label="Mount" value={heldLease.mountId} />
            <Field label="Package" value={heldLease.packageRef ?? "Not returned"} />
            <Field label="Target" value={heldLease.targetRef ?? "Not returned"} />
            <Field label="Expires" value={heldLease.expiresAt ?? "Not returned"} />
            {heldLeaseScopeMismatch ? <p className="text-xs text-cos-warn">This grant is in {heldLease.project ?? "unknown"} scope. Revoke it or switch back.</p> : null}
            {heldLease.holderCredential ? <p className="text-xs text-cos-muted">A machine holder credential was issued. It is held in this browser session only and can never be fetched again.</p> : null}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={refreshStatus} disabled={busy} className="rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-text disabled:opacity-50"><Clock3 size={13} className="mr-2 inline" />Refresh status</button>
              <button type="button" onClick={revoke} disabled={busy} className="rounded-lg border border-cos-warn/40 px-3 py-2 text-xs text-cos-warn disabled:opacity-50"><Ban size={13} className="mr-2 inline" />Revoke grant</button>
              <Link href="/os/execute" className="inline-flex items-center rounded-lg border border-cos-accent/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-accent">Continue to Execute →</Link>
            </div>
            {heldLease.holderCredential || heldLease.vlinkHandoff ? <HandToVLink lease={heldLease} onChange={setHeldLease} /> : null}
          </div>
        ) : <HonestEmpty title="No grant held" route="POST /v1/capability/mounts" detail="Request a grant above. Revoked and used grants are no longer held." />}
      </Pillar>
      <Pillar title="Requested vs granted" proof={mountResponse ? "Present" : "Not started"} detail="What you asked for beside what the authority layer actually granted.">
        {mountResponse && requested ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <ScopeList label="Requested reads" values={requestedReads} /><ScopeList label="Granted reads" values={asStringList(granted?.reads)} />
            <ScopeList label="Requested writes" values={requestedWrites} /><ScopeList label="Granted writes" values={asStringList(granted?.writes)} />
            <ScopeList label="Requested resources" values={requestedResources} /><ScopeList label="Granted resources" values={asStringList(granted?.resources)} />
            <div className="sm:col-span-2 flex items-center gap-2 text-xs text-cos-muted"><Ban size={14} className="text-cos-warn" />Blocked actions: {asStringList(granted?.blocked).length ? asStringList(granted?.blocked).join(", ") : "None returned."}</div>
          </div>
        ) : <HonestEmpty title="Nothing to compare yet" route="POST /v1/capability/mounts" detail="The comparison appears after the authority layer returns a decision for your request." />}
      </Pillar>
      <Pillar title="Check an action" proof={actionResponse ? (actionResponse.decision === "allow" ? "Present" : "Degraded") : "Not started"} detail="Ask whether the live grant would allow one action. Checking consumes nothing.">
        {actionResponse ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2"><ProofBadge status={actionResponse.decision === "allow" ? "Present" : "Degraded"} /><span className="font-mono text-xs uppercase text-cos-text">{String(actionResponse.decision ?? "Not returned")}</span></div>
            <Field label="Action" value={actionResponse.action} />
            <Field label="Reason" value={actionResponse.reason} />
            <Anchoring value={asRecord(actionResponse.anchoring) as MountResponse["anchoring"]} />
            <button type="button" onClick={() => setActionResponse(undefined)} className="text-xs text-cos-muted underline">Check another action</button>
          </div>
        ) : (
          <form onSubmit={evaluateAction} className="space-y-3">
            <label className="block text-xs text-cos-muted">Action<input value={action} onChange={(event) => setAction(event.target.value)} placeholder="contact.read" className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text" required /></label>
            <button type="submit" disabled={busy || !isLive} className="rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50"><SquareTerminal size={13} className="mr-2 inline" />Check against the live grant</button>
          </form>
        )}
      </Pillar>
      <Pillar title="Identities" proof={data.stageProof} detail="Execution identities returned for this workspace.">
        {rows.length ? <div className="space-y-2">{rows.map((row, index) => { const condition = identityCondition(row); const identity = row.execution_id ?? row.agent_id ?? row.certificate_id ?? row.id ?? `identity-${index}`; return <div key={`${String(identity)}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-cos-border bg-cos-bg/35 px-3 py-2"><span className="font-mono text-xs text-cos-text">{String(identity)}</span>{condition ? <VeklomActivityCue kind="authority" condition={condition} size={18} showCaption={false} /> : null}</div>; })}</div> : <HonestEmpty title="No identities returned" route="GET /api/v1/agents" detail="No execution identity has been returned for this workspace." />}
      </Pillar>
    </SectionShell>
  );
}
