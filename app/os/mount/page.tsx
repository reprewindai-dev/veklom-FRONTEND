"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import {
  Ban,
  Boxes,
  CheckCircle2,
  Clock3,
  KeyRound,
  ShieldAlert,
  SquareTerminal,
} from "lucide-react";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { Field, FailureNotice } from "@/components/cos/StageParts";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { clearSessionCapabilityLease, storeSessionCapabilityLease } from "@/lib/cos/lease-session";

type JsonRecord = Record<string, unknown>;
type PackagePayload = {
  id: string;
  family: string;
  title: string;
  purpose: string;
  reads?: string[];
  writes?: string[];
  blocked?: string[];
};
type MountResponse = {
  decision?: string;
  reason?: string;
  anchoring?: {
    status?: string;
    anchor_id?: string | null;
    detail?: string | null;
  };
  mount?: JsonRecord;
  token?: JsonRecord;
};

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
}
function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}
function asStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
function endpoint(
  method: StageEndpoint["method"],
  path: string,
  baseUrl?: string,
): StageEndpoint {
  return {
    method,
    path,
    classification: "live",
    response: "CAPPO response",
    baseUrl,
  };
}
function listValue(value: string): string[] | undefined {
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return values.length ? values : undefined;
}

function ScopeList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
        {label}
      </div>
      {values.length ? (
        <ul className="mt-2 space-y-1 text-xs text-cos-text">
          {values.map((value) => (
            <li
              key={value}
              className="rounded border border-cos-border bg-cos-bg/40 px-2 py-1 font-mono"
            >
              {value}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-cos-muted">None returned.</p>
      )}
    </div>
  );
}

function Anchoring({ value }: { value?: MountResponse["anchoring"] }) {
  const status = value?.status ?? "not_applicable";
  return (
    <div className="rounded-lg border border-cos-border bg-cos-bg/40 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">
          Anchoring
        </span>
        <span className="font-mono text-xs text-cos-text">{status}</span>
      </div>
      {value?.anchor_id ? (
        <p className="mt-2 break-all font-mono text-[10px] text-cos-muted">
          anchor_id: {value.anchor_id}
        </p>
      ) : null}
      {value?.detail ? (
        <p className="mt-2 text-xs leading-5 text-cos-muted">{value.detail}</p>
      ) : null}
    </div>
  );
}

function TokenDescriptor({
  token,
  proof,
}: {
  token?: JsonRecord;
  proof:
    | "Verified"
    | "Needs proof"
    | "Present"
    | "Degraded"
    | "Not started"
    | "Manual step"
    | "Simulated";
}) {
  if (!token)
    return (
      <HonestEmpty
        title="No token descriptor returned"
        route="POST /v1/capability/mounts"
        detail="The backend did not return a token descriptor for this mount state."
      />
    );
  const scope = asRecord(token.scope);
  const grants = asRecord(token.grants);
  return (
    <div className="space-y-4 rounded-xl border border-cos-accent/25 bg-cos-accent/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <KeyRound size={15} className="text-cos-accent" />
          <h3 className="text-sm font-medium text-cos-text">
            Ephemeral token descriptor
          </h3>
        </div>
        <ProofBadge status={proof} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Token ID" value={token.token_id} />
        <Field label="Mount ID" value={token.mount_id} />
        <Field label="Execution ID" value={token.execution_id} />
        <Field label="Package" value={token.package_ref} />
        <Field label="Issued at" value={token.issued_at} />
        <Field label="Expires at" value={token.expires_at} />
        <Field label="TTL seconds" value={token.ttl_seconds} />
        <Field
          label="Nonce state"
          value={
            token.single_use === true
              ? "single-use; consumption state not returned"
              : "Not returned"
          }
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <ScopeList
          label="Token scope"
          values={[
            asString(scope?.workspace) ? `workspace: ${scope?.workspace}` : "",
            asString(scope?.project) ? `project: ${scope?.project}` : "",
          ].filter(Boolean)}
        />
        <div className="space-y-4">
          <ScopeList
            label="Granted reads"
            values={asStringList(grants?.reads)}
          />
          <ScopeList
            label="Granted writes"
            values={asStringList(grants?.writes)}
          />
          <ScopeList
            label="Blocked actions"
            values={asStringList(grants?.blocked)}
          />
        </div>
      </div>
      <p className="text-[11px] leading-5 text-cos-steel">
        The token secret and nonce value are intentionally not rendered. Only
        descriptor fields returned by CAPPO are shown.
      </p>
    </div>
  );
}

export default function MountPage() {
  const stage = getStage("mount");
  const data = useStageData("mount", { autoGet: true });
  const cappoBase = stage.endpoints[0]?.baseUrl;
  const packagePayload = data.payloads["GET /v1/capability/packages"];
  const packages = (
    Array.isArray(packagePayload) ? packagePayload : []
  ) as PackagePayload[];
  const [packageRef, setPackageRef] = useState("");
  useEffect(() => {
    if (typeof window !== "undefined" && !packageRef) {
      const params = new URLSearchParams(window.location.search);
      const capability = params.get("capability");
      if (capability && packages.some((p) => p.id === capability)) {
        setPackageRef(capability);
      }
    }
  }, [packages, packageRef]);

  const [workspace, setWorkspace] = useState("");
  const [project, setProject] = useState("");
  const [reads, setReads] = useState("");
  const [writes, setWrites] = useState("");
  const [blocked, setBlocked] = useState("");
  const [ttl, setTtl] = useState("300");
  const [action, setAction] = useState("");
  const [requestedScope, setRequestedScope] = useState<JsonRecord>();
  const [mountResponse, setMountResponse] = useState<MountResponse>();
  const [actionResponse, setActionResponse] = useState<JsonRecord>();
  const [busy, setBusy] = useState(false);
  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === packageRef),
    [packageRef, packages],
  );
  const mount = asRecord(mountResponse?.mount);
  const token = asRecord(mountResponse?.token);
  const mountId = asString(mount?.id) ?? asString(token?.mount_id);
  const lifecycle = asRecord(mount?.lifecycle);
  const lifecycleState = asString(lifecycle?.state);
  const isLive = lifecycleState === "mounted" && Boolean(token);
  const granted = asRecord(mount?.grants) ?? asRecord(token?.grants);

  async function requestMount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!packageRef || !workspace || !project) return;
    clearSessionCapabilityLease();
    setBusy(true);
    setActionResponse(undefined);
    setRequestedScope({
      workspace,
      project,
      reads: listValue(reads) ?? [],
      writes: listValue(writes) ?? [],
      blocked: listValue(blocked) ?? [],
      ttl_seconds: Number(ttl),
    });
    const result = await data.call<MountResponse>(
      endpoint("POST", "/v1/capability/mounts", cappoBase),
      {
        package_ref: packageRef,
        execution_scope: { workspace, project },
        requested_action_scope: {
          reads: listValue(reads),
          writes: listValue(writes),
          blocked: listValue(blocked) ?? [],
        },
        ttl_seconds: Number(ttl),
      },
    );
    if (result.data) {
      clearSessionCapabilityLease();
      setMountResponse(result.data);
      const issuedToken = asRecord(result.data.token);
      const issuedMount = asRecord(result.data.mount);
      const issuedMountId = asString(issuedMount?.id) ?? asString(issuedToken?.mount_id);
      const issuedTokenId = asString(issuedToken?.token_id);
      const issuedNonce = asString(issuedToken?.nonce);
      if (result.data.decision === "allow" && issuedMountId && issuedTokenId && issuedNonce) {
        storeSessionCapabilityLease({ mountId: issuedMountId, tokenId: issuedTokenId, nonce: issuedNonce });
      }
    }
    setBusy(false);
  }
  async function refreshStatus() {
    if (!mountId) return;
    setBusy(true);
    const result = await data.call<MountResponse>(
      endpoint("GET", `/v1/capability/mounts/${mountId}`, cappoBase),
    );
    if (result.data) setMountResponse(result.data);
    setBusy(false);
  }
  async function evaluateAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mountId || !token || !action) return;
    setBusy(true);
    const result = await data.call<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${mountId}/actions`, cappoBase),
      { token_id: token.token_id, nonce: token.nonce, action },
    );
    if (result.data) setActionResponse(result.data);
    setBusy(false);
  }
  async function terminate() {
    if (!mountId) return;
    setBusy(true);
    clearSessionCapabilityLease();
    const result = await data.call<JsonRecord>(
      endpoint("POST", `/v1/capability/mounts/${mountId}/terminate`, cappoBase),
      { reason: "explicit_terminate" },
    );
    if (result.data) {
      const response = result.data as MountResponse;
      const isTerminated =
        response.decision === "allow" &&
        (response.reason === "terminated" ||
          response.reason === "already_terminated");
      setMountResponse({
        ...response,
        mount:
          isTerminated && mount
            ? { ...mount, lifecycle: { ...lifecycle, state: "terminated" } }
            : mount,
      });
    }
    setBusy(false);
  }

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar
          title="Work"
          proof={data.records[0]?.proof ?? "Needs proof"}
          detail="Every mount decision below is returned by CAPPO; the browser does not predict grants."
        >
          <form
            onSubmit={requestMount}
            className="space-y-4 rounded-xl border border-cos-border bg-cos-bg/35 p-4"
          >
            <div className="flex items-center gap-2">
              <Boxes size={16} className="text-cos-accent" />
              <h3 className="text-sm font-medium text-cos-text">
                Discover and request a mount
              </h3>
            </div>
            <label className="block text-xs text-cos-muted">
              Capability package
              <select
                value={packageRef}
                onChange={(event) => setPackageRef(event.target.value)}
                className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                required
              >
                <option value="">Select a returned package</option>
                {packages.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id} — {item.title}
                  </option>
                ))}
              </select>
            </label>
            {selectedPackage ? (
              <div className="rounded-lg border border-cos-border bg-cos-surface2/50 p-3 text-xs leading-5 text-cos-muted">
                <strong className="text-cos-text">
                  {selectedPackage.purpose}
                </strong>
                <div className="mt-2">
                  Package blocked actions:{" "}
                  {selectedPackage.blocked?.length
                    ? selectedPackage.blocked.join(", ")
                    : "None returned."}
                </div>
              </div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-cos-muted">
                Workspace
                <input
                  value={workspace}
                  onChange={(event) => setWorkspace(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                  required
                />
              </label>
              <label className="text-xs text-cos-muted">
                Project
                <input
                  value={project}
                  onChange={(event) => setProject(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                  required
                />
              </label>
              <label className="text-xs text-cos-muted">
                Requested reads
                <input
                  value={reads}
                  onChange={(event) => setReads(event.target.value)}
                  placeholder="comma,separated,actions"
                  className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                />
              </label>
              <label className="text-xs text-cos-muted">
                Requested writes
                <input
                  value={writes}
                  onChange={(event) => setWrites(event.target.value)}
                  placeholder="comma,separated,actions"
                  className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                />
              </label>
              <label className="text-xs text-cos-muted">
                Requested blocked actions
                <input
                  value={blocked}
                  onChange={(event) => setBlocked(event.target.value)}
                  placeholder="comma,separated,actions"
                  className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                />
              </label>
              <label className="text-xs text-cos-muted">
                Requested TTL (seconds)
                <input
                  type="number"
                  min="1"
                  value={ttl}
                  onChange={(event) => setTtl(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={busy || !packages.length}
              className="rounded-lg bg-cos-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Requesting…" : "Request mount"}
            </button>
          </form>
          {!packages.length ? (
            <div className="mt-4">
              <HonestEmpty
                title="No capability packages returned"
                route="GET /v1/capability/packages"
                detail="Mount requests stay unavailable until CAPPO returns a package catalog."
              />
            </div>
          ) : null}
          {mountResponse ? (
            <div className="mt-4 space-y-4">
              <div
                className={`rounded-xl border p-4 ${mountResponse.decision === "allow" ? "border-cos-verified/30 bg-cos-verified/5" : "border-cos-warn/30 bg-cos-warn/5"}`}
              >
                <div className="flex items-center gap-2">
                  {mountResponse.decision === "allow" ? (
                    <CheckCircle2 size={16} className="text-cos-verified" />
                  ) : (
                    <ShieldAlert size={16} className="text-cos-warn" />
                  )}
                  <span className="font-mono text-xs uppercase tracking-[0.14em] text-cos-text">
                    {mountResponse.decision ?? "Not returned"} ·{" "}
                    {mountResponse.reason ?? "No reason returned"}
                  </span>
                </div>
                <div className="mt-3">
                  <Anchoring value={mountResponse.anchoring} />
                </div>
              </div>
              {lifecycleState && lifecycleState !== "mounted" ? (
                <FailureNotice
                  detail={`Mount is ${lifecycleState}. CAPPO returned no live token descriptor for this state.`}
                />
              ) : null}
            </div>
          ) : null}
        </Pillar>
      </div>
      <Pillar
        title="Telemetry"
        proof={
          mountResponse
            ? lifecycleState === "mounted"
              ? "Verified"
              : "Present"
            : "Needs proof"
        }
      >
        {mountResponse ? (
          <div className="space-y-3">
            <Field
              label="Mount lifecycle"
              value={lifecycleState ?? mountResponse.reason}
            />
            <Field label="Mount ID" value={mountId} />
            <Field
              label="TTL"
              value={asRecord(mount?.token)?.ttl_seconds ?? token?.ttl_seconds}
            />
            <button
              type="button"
              onClick={refreshStatus}
              disabled={busy || !mountId}
              className="rounded-lg border border-cos-border px-3 py-2 text-xs text-cos-text disabled:opacity-50"
            >
              <Clock3 size={13} className="mr-2 inline" />
              Refresh persisted status
            </button>
          </div>
        ) : (
          <HonestEmpty
            title="No mount telemetry yet"
            route="GET /v1/capability/mounts/{mount_id}"
            detail="A persisted mount response will provide lifecycle and expiry state after a mount is requested."
          />
        )}
      </Pillar>
      <Pillar
        title="Authority"
        proof={
          token && isLive
            ? "Verified"
            : mountResponse
              ? "Present"
              : "Needs proof"
        }
      >
        {token && isLive ? (
          <TokenDescriptor
            token={token}
            proof={
              data.records.find(
                (record) => record.path === "/v1/capability/mounts",
              )?.proof ?? "Needs proof"
            }
          />
        ) : (
          <HonestEmpty
            title="No live token descriptor"
            route="GET /v1/capability/mounts/{mount_id}"
            detail="Expired and terminated mounts are rendered without token descriptors."
          />
        )}
      </Pillar>
      <Pillar
        title="Evidence"
        proof={
          actionResponse
            ? actionResponse.decision === "allow"
              ? "Present"
              : "Degraded"
            : "Needs proof"
        }
      >
        {actionResponse ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ProofBadge
                status={
                  actionResponse.decision === "allow" ? "Present" : "Degraded"
                }
              />
              <span className="font-mono text-xs uppercase text-cos-text">
                {String(actionResponse.decision ?? "Not returned")}
              </span>
            </div>
            <Field label="Action" value={actionResponse.action} />
            <Field label="Reason" value={actionResponse.reason} />
            <Anchoring
              value={
                asRecord(actionResponse.anchoring) as MountResponse["anchoring"]
              }
            />
          </div>
        ) : (
          <form onSubmit={evaluateAction} className="space-y-3">
            <label className="block text-xs text-cos-muted">
              Action to evaluate
              <input
                value={action}
                onChange={(event) => setAction(event.target.value)}
                placeholder="contact.read"
                className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text"
                required
              />
            </label>
            <button
              type="submit"
              disabled={busy || !isLive}
              className="rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50"
            >
              <SquareTerminal size={13} className="mr-2 inline" />
              Evaluate returned token
            </button>
            <p className="text-[11px] leading-5 text-cos-steel">
              CAPPO decides allow or deny. Blocked actions remain visible in the
              Authority pillar and are never predicted here.
            </p>
          </form>
        )}
      </Pillar>
      <Pillar title="Drift" proof={mountResponse ? "Present" : "Needs proof"}>
        {mountResponse ? (
          <div className="space-y-4">
            <ScopeList
              label="Requested reads"
              values={asStringList(requestedScope?.reads)}
            />
            <ScopeList
              label="Granted reads"
              values={asStringList(granted?.reads)}
            />
            <ScopeList
              label="Requested writes"
              values={asStringList(requestedScope?.writes)}
            />
            <ScopeList
              label="Granted writes"
              values={asStringList(granted?.writes)}
            />
            <div className="flex items-center gap-2 text-xs text-cos-muted">
              <Ban size={14} className="text-cos-warn" />
              Blocked actions:{" "}
              {asStringList(granted?.blocked).length
                ? asStringList(granted?.blocked).join(", ")
                : "None returned."}
            </div>
            <button
              type="button"
              onClick={terminate}
              disabled={busy || !mountId || lifecycleState !== "mounted"}
              className="rounded-lg border border-cos-warn/40 px-3 py-2 text-xs text-cos-warn disabled:opacity-50"
            >
              Terminate persisted mount
            </button>
          </div>
        ) : (
          <HonestEmpty
            title="No granted-vs-requested comparison"
            route="POST /v1/capability/mounts"
            detail="The comparison appears only after CAPPO returns the mount decision and granted scope."
          />
        )}
      </Pillar>
    </SectionShell>
  );
}
