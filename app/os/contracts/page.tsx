"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileCheck2, ShieldAlert } from "lucide-react";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { SectionShell } from "@/components/cos/SectionShell";
import { Field, FailureNotice } from "@/components/cos/StageParts";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { describeArguments, readPendingExecutionIntent, type ExecutionIntent } from "@/lib/cos/execution-intent";
import { readSessionCapabilityLease } from "@/lib/cos/lease-session";

type Projection = { filename?: string; content?: string };

function IntentCard({ title, intent }: { title: string; intent: ExecutionIntent }) {
  return (
    <div className="rounded-xl border border-cos-border bg-cos-bg/35 p-4 text-xs">
      <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">{title}</div>
      <div className="mt-2 text-sm text-cos-text">{intent.clause}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <Field label="Contract" value={intent.contractId} />
        <Field label="Canonical hash" value={intent.canonicalHash} />
        <Field label="Step" value={`${intent.sequence} · ${intent.stepId}`} />
        <Field label="Bound at" value={intent.boundAt} />
      </div>
      <div className="mt-2 font-mono text-[11px] text-cos-text">{intent.operation.action} · {intent.operation.target_ref} · resource {intent.operation.resource} · {describeArguments(intent.operation.arguments)}</div>
    </div>
  );
}

/** Contracts (W-06): compiled intent. A contract is never authority; the compiler refuses a tampered one. */
export default function ContractsPage() {
  const stage = getStage("contracts");
  const data = useStageData("contracts");
  const [pending, setPending] = useState<ExecutionIntent | null>(null);
  const [held, setHeld] = useState<ExecutionIntent | null>(null);
  const [text, setText] = useState("");
  const [parseError, setParseError] = useState<string>();
  const [projection, setProjection] = useState<Projection>();
  const [refusal, setRefusal] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPending(readPendingExecutionIntent());
    setHeld(readSessionCapabilityLease()?.intent ?? null);
  }, []);

  async function check(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setParseError(undefined);
    setProjection(undefined);
    setRefusal(undefined);
    let contract: unknown;
    try {
      contract = JSON.parse(text);
    } catch {
      setParseError("That is not valid JSON. Paste the contract exactly as Blueprint produced it.");
      return;
    }
    setBusy(true);
    const result = await data.call<Projection>(stage.endpoints[0], { contract, format: "agents_md" });
    if (result.data && !result.record.paymentRequired && typeof result.data.content === "string") setProjection(result.data);
    else setRefusal(result.record.error ?? "The compiler did not accept this contract.");
    setBusy(false);
  }

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="xl:col-span-2">
        <Pillar title="Contracts in this session" proof={pending || held ? "Present" : "Not started"} detail="Operations bound to a contract step in Blueprint, before and after a grant was issued for them.">
          {pending || held ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {pending ? <IntentCard title="Bound, waiting for a grant" intent={pending} /> : null}
              {held ? <IntentCard title="Bound, carried by the grant you hold" intent={held} /> : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cos-border bg-cos-bg/35 p-4 text-xs text-cos-muted">
              <span>No contract is bound in this session. Compile your intent into a contract in Blueprint.</span>
              <Link href="/os/blueprint" className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 font-semibold uppercase tracking-[0.12em] text-cos-accent">Go to Blueprint <ArrowRight size={13} /></Link>
            </div>
          )}
        </Pillar>
      </div>
      <div className="xl:col-span-2">
        <Pillar title="Check a contract" proof={projection ? "Present" : refusal ? "Degraded" : "Not started"} detail="The compiler re-derives the contract's canonical hash. An edited contract is refused; an intact one is projected into an agent work order.">
          <form onSubmit={check} className="space-y-3">
            <label className="block text-xs text-cos-muted">Contract JSON
              <textarea value={text} onChange={(event) => setText(event.target.value)} rows={8} spellCheck={false} placeholder='{"contract_id": "...", "steps": [...], "canonical_hash": "..."}' className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg px-3 py-2 font-mono text-xs text-cos-text" />
            </label>
            <button type="submit" disabled={busy || !text.trim()} className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/40 px-3 py-2 text-xs text-cos-accent disabled:opacity-50"><FileCheck2 size={13} />{busy ? "Checking…" : "Check with the compiler"}</button>
          </form>
          <div className="mt-3 space-y-3">
            {parseError ? <FailureNotice detail={parseError} /> : null}
            {refusal ? <div className="flex items-start gap-2 rounded-xl border border-cos-warn/30 bg-cos-warn/5 p-4 text-xs text-cos-muted"><ShieldAlert size={15} className="mt-0.5 text-cos-warn" /><span>Refused: {refusal}</span></div> : null}
            {projection ? (
              <div className="rounded-xl border border-cos-verified/30 bg-cos-verified/5 p-4 text-xs">
                <div className="text-cos-text">Accepted. Projected work order: <code className="font-mono">{projection.filename ?? "AGENTS.md"}</code></div>
                <pre className="mt-3 max-h-72 overflow-auto rounded-lg border border-cos-border bg-cos-bg p-3 font-mono text-[10px] leading-5 text-cos-muted">{projection.content}</pre>
              </div>
            ) : null}
            {!pending && !held && !projection && !refusal && !parseError ? <HonestEmpty title="Nothing checked yet" route="POST /api/abide/v1/contract/project" detail="Paste a contract to check it. Checking grants nothing." /> : null}
          </div>
        </Pillar>
      </div>
    </SectionShell>
  );
}
