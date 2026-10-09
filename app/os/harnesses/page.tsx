"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Cable, Eye, Server } from "lucide-react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field, FailureNotice, JsonPanel } from "@/components/cos/StageParts";
import type { PackagePayload } from "@/components/cos/MountParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { readSessionCapabilityLease, type SessionCapabilityLease } from "@/lib/cos/lease-session";
import { targetStateReadbackPath } from "@/lib/cos/readback";

/**
 * Harnesses (navigation map): runtime bindings, adapters and provider compatibility. A harness is
 * what a capability package is bound to; binding is not authority.
 */
export default function HarnessesPage() {
  const stage = getStage("harnesses");
  const data = useStageData("harnesses", { autoGet: true });
  const payload = data.payloads["GET /v1/capability/packages"];
  const packages = (Array.isArray(payload) ? payload : []) as PackagePayload[];
  const catalogProof = data.records.find((record) => record.path === "/v1/capability/packages")?.proof ?? "Not started";
  const [lease, setLease] = useState<SessionCapabilityLease | null>(null);
  const [resource, setResource] = useState("");
  const [readback, setReadback] = useState<unknown>();
  const [readbackError, setReadbackError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const held = readSessionCapabilityLease();
    setLease(held);
    if (held?.resource) setResource(held.resource);
  }, []);


  async function readTarget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const res = resource.trim();
    if (!lease || lease.terminated || !lease.targetRef || !res) return;
    setBusy(true);
    setReadback(undefined);
    setReadbackError(undefined);
    const result = await data.call({ method: "GET", path: targetStateReadbackPath(lease.targetRef, res, lease.mountId), classification: "present", response: "independent target state readback (no authority consumed)" });
    if (result.data !== undefined && !result.record.paymentRequired) setReadback(result.data);
    else setReadbackError(result.record.error ?? "The target did not return its state.");
    setBusy(false);
  }

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar title="Bindings" proof={catalogProof} detail="Each package's adapter family, the target it may act on, and its allowed actions, as the registry returned them.">
          {packages.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {packages.map((item) => (
                <div key={item.id} className="rounded-xl border border-cos-border bg-cos-bg/35 p-4 text-xs">
                  <div className="flex items-center gap-2 text-sm text-cos-text"><Cable size={14} className="text-cos-accent" />{item.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-cos-steel">{item.id}</div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Field label="Adapter family" value={item.family} />
                    <Field label="Target" value={item.target_ref ?? "None declared"} />
                    <Field label="Reads" value={item.reads?.join(", ") || "None"} />
                    <Field label="Writes" value={item.writes?.join(", ") || "None"} />
                  </div>
                  {item.blocked?.length ? <div className="mt-2 font-mono text-[10px] text-cos-warn">blocked: {item.blocked.join(", ")}</div> : null}
                </div>
              ))}
            </div>
          ) : <HonestEmpty title="No bindings returned" route="GET /v1/capability/packages" detail="Bindings appear when the registry returns its package catalog." />}
        </Pillar>
      </div>
      <Pillar title="This session's binding" proof={lease && !lease.terminated ? "Present" : "Not started"} detail="The binding behind the grant this browser session holds.">
        {lease && !lease.terminated ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Package" value={lease.packageRef} />
            <Field label="Target" value={lease.targetRef} />
            <Field label="Resource" value={lease.resource ?? "Every resource the grant reaches"} />
            <Field label="Granted writes" value={lease.grants?.writes?.join(", ") || "None returned"} />
          </div>
        ) : <HonestEmpty title="No binding held" route="POST /v1/capability/mounts" detail="Bind a package in Mount and request its grant in Authority." />}
        <Link href="/os/computeless" className="mt-4 inline-flex items-center gap-2 text-xs text-cos-accent hover:underline"><Server size={13} />Owned machines that run governed work are in Private Cloud</Link>
      </Pillar>
      <Pillar title="Read a target" proof={readback !== undefined ? "Present" : readbackError ? "Degraded" : "Not started"} detail="An independent readback of the bound target's own state, scoped to your binding. It consumes no authority and changes nothing.">
        <form onSubmit={readTarget} className="space-y-3">
          <Field label="Target (from your binding)" value={lease?.targetRef ?? "No binding held"} />
          <label className="block text-xs text-cos-muted">Resource
            <input value={resource} onChange={(event) => setResource(event.target.value)} placeholder="resource to read" className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-sm text-cos-text" />
          </label>
          <button type="submit" disabled={busy || !lease || lease.terminated || !lease.targetRef || !resource.trim()} className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50"><Eye size={13} />{busy ? "Reading…" : "Read state"}</button>
        </form>
        <div className="mt-3">{readbackError ? <FailureNotice detail={readbackError} /> : readback !== undefined ? <JsonPanel value={readback} /> : null}</div>
      </Pillar>
    </SectionShell>
  );
}
