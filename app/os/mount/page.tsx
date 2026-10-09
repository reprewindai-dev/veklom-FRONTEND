"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Boxes, Cable, CheckCircle2, LockKeyhole } from "lucide-react";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { Field } from "@/components/cos/StageParts";
import { useAuth } from "@/lib/auth-context";
import { readSessionCapabilityLease, type SessionCapabilityLease } from "@/lib/cos/lease-session";
import { describeArguments, readPendingExecutionIntent, type ExecutionIntent } from "@/lib/cos/execution-intent";
import { SANDBOX_PROJECT, useSandboxMode } from "@/lib/cos/sandbox";
import { readBoundWorkspaceId } from "@/lib/cos/workspace-session";
import { readMountBinding, storeMountBinding, type MountBinding } from "@/lib/cos/mount-binding";
import { listValue, ScopeList, type PackagePayload } from "@/components/cos/MountParts";

const inputClass = "mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 text-sm text-cos-text read-only:cursor-not-allowed read-only:opacity-70";

/**
 * Mount (DESIGN_MODEL): discovery, install, contracts and harness. Mount binds a capability package
 * to a target and a requested scope. It grants nothing: Authority requests the single-use grant.
 */
export default function MountPage() {
  const stage = getStage("mount");
  const router = useRouter();
  const data = useStageData("mount", { autoGet: true });
  const { me } = useAuth();
  const sandbox = useSandboxMode();
  const packagePayload = data.payloads["GET /v1/capability/packages"];
  const packages = (Array.isArray(packagePayload) ? packagePayload : []) as PackagePayload[];
  const [packageRef, setPackageRef] = useState("");
  // Never assume a workspace: it is prefilled from the onboarding link
  // (?workspace=), the session profile, or the workspace bound during onboarding.
  const [workspace, setWorkspace] = useState("");
  const [project, setProject] = useState("");
  const [reads, setReads] = useState("");
  const [writes, setWrites] = useState("");
  const [blocked, setBlocked] = useState("");
  const [resource, setResource] = useState("");
  const [ttl, setTtl] = useState("300");
  const [heldLease] = useState<SessionCapabilityLease | null>(() => readSessionCapabilityLease());
  const [prepared, setPrepared] = useState<MountBinding | null>(null);
  // The contract-bound operation Blueprint handed over, if any. It applies only to its own package.
  const [pendingIntent, setPendingIntent] = useState<ExecutionIntent | null>(null);
  const selectedPackage = useMemo(() => packages.find((item) => item.id === packageRef), [packageRef, packages]);
  const activeIntent = pendingIntent && pendingIntent.operation.package_ref === packageRef ? pendingIntent : null;
  // The target is never invented here: it comes from the contract or the package's catalog entry.
  const targetRef = activeIntent?.operation.target_ref ?? selectedPackage?.target_ref ?? undefined;

  useEffect(() => { setPrepared(readMountBinding()); }, []);

  // Live mode: reuse the project of the last binding or held grant, so a returning user does not
  // retype it. Never carries the sandbox project into live mode (sandbox forces its own below).
  useEffect(() => {
    if (sandbox) return;
    const last = readMountBinding()?.project ?? readSessionCapabilityLease()?.project;
    // Runs before the sandbox effect below, so a leftover sandbox value counts as empty here.
    if (last && last !== SANDBOX_PROJECT) setProject((current) => (current && current !== SANDBOX_PROJECT ? current : last));
  }, [sandbox]);

  useEffect(() => {
    if (!selectedPackage) return;
    if (activeIntent) {
      // Request exactly the bound operation: its one write, on its one resource.
      setReads("");
      setWrites(activeIntent.operation.action);
      setResource(activeIntent.operation.resource);
    } else {
      setReads(selectedPackage.reads?.join(",") ?? "");
      setWrites(selectedPackage.writes?.join(",") ?? "");
    }
    setBlocked(selectedPackage.blocked?.join(",") ?? "");
  }, [selectedPackage, activeIntent]);

  useEffect(() => {
    const intent = readPendingExecutionIntent();
    if (!intent) return;
    setPendingIntent(intent);
    setPackageRef(intent.operation.package_ref);
  }, []);

  useEffect(() => {
    setProject((current) => {
      if (sandbox) return SANDBOX_PROJECT;
      return current === SANDBOX_PROJECT ? "" : current;
    });
  }, [sandbox]);

  useEffect(() => {
    if (workspace) return;
    const linked = new URLSearchParams(window.location.search).get("workspace")?.trim();
    const profileWorkspace = typeof me?.workspace_id === "string" ? me.workspace_id : null;
    const prefill = linked || profileWorkspace || readBoundWorkspaceId();
    if (prefill) setWorkspace(prefill);
  }, [me?.workspace_id, workspace]);

  // Blueprint and Govern hand a plan's scope over as query parameters. They only pre-fill the
  // form; the authority layer still decides what is granted.
  useEffect(() => {
    // A contract-bound operation is narrower than any query-string scope; it wins.
    if (readPendingExecutionIntent()) return;
    const params = new URLSearchParams(window.location.search);
    const take = (key: string, set: (value: string) => void) => {
      const value = params.get(key)?.trim();
      if (value) set(value);
    };
    take("package", setPackageRef);
    // A linked "sandbox" scope must never be carried into a live-mode mount, and live mode never
    // inherits it; sandbox mode always forces the sandbox project (see the effect above).
    take("project", (value) => setProject(sandbox ? SANDBOX_PROJECT : value === SANDBOX_PROJECT ? "" : value));
    take("reads", setReads);
    take("writes", setWrites);
    take("blocked", setBlocked);
  }, []);

  function prepareBinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!packageRef || !workspace || !project) return;
    const binding: MountBinding = {
      packageRef,
      packageTitle: selectedPackage?.title,
      targetRef,
      workspace,
      project,
      reads: listValue(reads),
      writes: listValue(writes),
      blocked: listValue(blocked),
      // A bound operation mounts exactly its one resource; otherwise a typed resource bounds the mount.
      resource: activeIntent?.operation.resource ?? (resource.trim() || undefined),
      ttlSeconds: Number(ttl),
      ...(activeIntent ? { intent: activeIntent } : {}),
      preparedAt: new Date().toISOString(),
    };
    storeMountBinding(binding);
    setPrepared(binding);
    router.push("/os/authority");
  }

  return <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
    <div className="xl:col-span-2 space-y-4">
      <Pillar title="Discover" proof={data.records[0]?.proof ?? "Needs proof"} detail="Capability packages returned by the live registry. Discovery is not authority.">
        {packages.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {packages.map((item) => {
              const active = item.id === packageRef;
              return (
                <button type="button" key={item.id} onClick={() => setPackageRef(item.id)} aria-pressed={active} className={`rounded-xl border p-4 text-left transition ${active ? "border-cos-accent/60 bg-cos-accent/[0.06]" : "border-cos-border bg-cos-bg/35 hover:border-cos-accent/40"}`}>
                  <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-cos-text">{item.title}</span>{active ? <CheckCircle2 size={15} className="text-cos-accent" /> : null}</div>
                  <div className="mt-1 font-mono text-[10px] text-cos-steel">{item.id} · {item.family}</div>
                  <p className="mt-2 text-xs leading-5 text-cos-muted">{item.purpose}</p>
                  <div className="mt-2 font-mono text-[10px] text-cos-steel">target: {item.target_ref ?? "none declared"}</div>
                </button>
              );
            })}
          </div>
        ) : <HonestEmpty title="No capability packages returned" route="GET /v1/capability/packages" detail="Nothing can be mounted until the registry returns a package catalog." />}
      </Pillar>
      {heldLease && !heldLease.terminated ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cos-accent/25 bg-cos-accent/[0.035] p-3 text-xs text-cos-muted">
          <span>You hold a grant on mount <code className="font-mono text-cos-text">{heldLease.mountId}</code> ({heldLease.packageRef ?? "package not returned"}).</span>
          <span className="flex gap-2"><Link href="/os/authority" className="rounded border border-cos-border px-3 py-2 text-cos-text">Manage it in Authority</Link><Link href="/os/execute" className="rounded border border-cos-accent/40 px-3 py-2 text-cos-accent">Continue to Execute →</Link></span>
        </div>
      ) : null}
    </div>
    <Pillar title="Bind" proof={selectedPackage ? "Present" : "Not started"} detail="Choose the scope you will ask for. Binding grants nothing; Authority decides.">
      <form onSubmit={prepareBinding} className="space-y-4">
        <label className="block text-xs text-cos-muted">Capability package<select value={packageRef} onChange={(event) => setPackageRef(event.target.value)} className={inputClass} required><option value="">Select a returned package</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.id} — {item.title}</option>)}</select></label>
        {activeIntent ? <div className="rounded-lg border border-cos-accent/40 bg-cos-accent/[0.05] p-3 text-xs leading-5 text-cos-muted"><div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Bounded operation from contract {activeIntent.contractId}</div><div className="mt-1 text-cos-text">{activeIntent.clause}</div><div className="mt-1 font-mono text-cos-text">{activeIntent.operation.action} · {activeIntent.operation.target_ref} · resource {activeIntent.operation.resource} · {describeArguments(activeIntent.operation.arguments)}</div><div className="mt-1 text-[10px] text-cos-steel">The grant will be requested for exactly this operation.</div></div> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-cos-muted">Workspace<input value={workspace} onChange={(event) => setWorkspace(event.target.value)} className={inputClass} required /><span className="mt-1 block text-[10px] text-cos-steel">Must equal the workspace of your signed-in session</span></label>
          <label className="text-xs text-cos-muted">Project<input value={project} onChange={(event) => setProject(event.target.value)} readOnly={sandbox} className={inputClass} required /><span className="mt-1 block text-[10px] text-cos-steel">{sandbox ? "Sandbox scope is fixed to project=sandbox" : "A name that groups this work, for example contracts. Any name works; the grant is limited to it."}</span></label>
          <label className="text-xs text-cos-muted">Reads to request<input value={reads} onChange={(event) => setReads(event.target.value)} placeholder="comma,separated,actions" className={inputClass} /></label>
          <label className="text-xs text-cos-muted">Writes to request<input value={writes} onChange={(event) => setWrites(event.target.value)} placeholder="comma,separated,actions" className={inputClass} /></label>
          <label className="text-xs text-cos-muted">Blocked actions<input value={blocked} onChange={(event) => setBlocked(event.target.value)} placeholder="comma,separated,actions" className={inputClass} /></label>
          <label className="text-xs text-cos-muted">Resource bound<input value={resource} onChange={(event) => setResource(event.target.value)} readOnly={Boolean(activeIntent)} placeholder="optional: limit the mount to one resource" className={inputClass} /><span className="mt-1 block text-[10px] text-cos-steel">{activeIntent ? "Fixed by the contract's bound operation" : "Empty means every resource the granted actions reach"}</span></label>
          <label className="text-xs text-cos-muted">Requested lifetime (seconds)<input type="number" min="1" value={ttl} onChange={(event) => setTtl(event.target.value)} className={inputClass} required /></label>
        </div>
        <button type="submit" disabled={!packages.length || !packageRef} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg disabled:cursor-not-allowed disabled:opacity-50"><LockKeyhole size={14} />Bind and request authority <ArrowRight size={14} /></button>
      </form>
      {prepared && !heldLease ? <p className="mt-3 text-xs text-cos-muted">A binding for <code className="font-mono text-cos-text">{prepared.packageRef}</code> is waiting in <Link href="/os/authority" className="text-cos-accent underline">Authority</Link>.</p> : null}
    </Pillar>
    <Pillar title="Harness" proof={selectedPackage ? "Present" : "Not started"} detail="What the selected package binds to, as returned by the registry.">
      {selectedPackage ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-cos-text"><Cable size={15} className="text-cos-accent" />{selectedPackage.title}</div>
          <Field label="Package" value={selectedPackage.id} />
          <Field label="Family" value={selectedPackage.family} />
          <Field label="Target it may act on" value={targetRef ?? "None declared"} />
          <ScopeList label="Package reads" values={selectedPackage.reads ?? []} />
          <ScopeList label="Package writes" values={selectedPackage.writes ?? []} />
          <ScopeList label="Package blocked actions" values={selectedPackage.blocked ?? []} />
        </div>
      ) : <HonestEmpty title="No package selected" route="GET /v1/capability/packages" detail="Select a package to see the target and actions it binds." />}
    </Pillar>
  </SectionShell>;
}
