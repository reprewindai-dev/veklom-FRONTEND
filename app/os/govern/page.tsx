"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, LockKeyhole, Send, ShieldAlert } from "lucide-react";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { ProofBadge } from "@/components/cos/ProofBadge";

type Decision = "APPROVED" | "NEEDS_APPROVAL" | "REJECTED";
interface AuthorizationResult {
  decision?: Decision | string;
  authorization_id?: string;
  lane?: string;
  decision_hash?: string;
  reason?: string;
  evidence_hash?: string;
}

function display(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "Not returned";
}

export default function GovernPage() {
  const stage = getStage("govern");
  const data = useStageData("govern");
  const [principal, setPrincipal] = useState("");
  const [capability, setCapability] = useState("capability");
  const [directive, setDirective] = useState("evaluate");
  const [request, setRequest] = useState("");
  const [result, setResult] = useState<AuthorizationResult | null>(null);
  const [assessResult, setAssessResult] = useState<Record<string, unknown> | null>(null);
  const quarantine = data.payloads["GET /api/v1/governance/quarantine"] as { items?: unknown[] } | undefined;
  const authorizeEndpoint = stage.endpoints[0];
  const assessEndpoint = stage.endpoints[1];

  useEffect(() => {
    void data.call(stage.endpoints[2]);
  }, [data.call, stage.endpoints]);

  const decision = result?.decision;
  const decisionStatus = decision === "APPROVED" || decision === "NEEDS_APPROVAL" || decision === "REJECTED" ? decision : null;
  const authorityProof = result?.authorization_id ? "Verified" : "Needs proof";
  const evidenceProof = result?.decision_hash && result.evidence_hash ? "Verified" : "Needs proof";
  const telemetryProof = assessResult ? "Verified" : "Needs proof";
  const primaryDisabled = !principal.trim() || !request.trim() || data.loading;
  const actionLabel = useMemo(() => data.loading ? "Evaluating…" : "Evaluate governance", [data.loading]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (primaryDisabled) return;
    const body = {
      agent_id: principal.trim(),
      capability_id: capability.trim() || "capability",
      directive: directive.trim() || undefined,
      request: { instruction: request.trim() },
    };
    const authorization = await data.call<AuthorizationResult>(authorizeEndpoint, body);
    if (authorization.data) setResult(authorization.data);
    const assessment = await data.call<Record<string, unknown>>(assessEndpoint, body);
    if (assessment.data) setAssessResult(assessment.data);
  }

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records} primaryAction={<button type="submit" form="govern-form" disabled={primaryDisabled} className="inline-flex items-center gap-2 rounded-xl bg-cos-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Send size={14} />{actionLabel}</button>}>
      <div className="xl:col-span-2">
        <Pillar title="Work" proof={result ? data.records[0].proof : "Needs proof"} detail="A denial is an expected governance result, not a transport error.">
          <form id="govern-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Authority subject</span><input value={principal} onChange={(event) => setPrincipal(event.target.value)} placeholder="Provide the transient requester identity" className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg/70 px-3 py-3 text-sm text-cos-text outline-none placeholder:text-cos-steel/70 focus:border-cos-accent/60" /></label>
            <label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Capability</span><input value={capability} onChange={(event) => setCapability(event.target.value)} className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg/70 px-3 py-3 font-mono text-sm tabular-nums text-cos-text outline-none focus:border-cos-accent/60" /></label>
            <label className="block md:col-span-2"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Directive</span><input value={directive} onChange={(event) => setDirective(event.target.value)} className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg/70 px-3 py-3 font-mono text-sm tabular-nums text-cos-text outline-none focus:border-cos-accent/60" /></label>
            <label className="block md:col-span-2"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Requested action</span><textarea value={request} onChange={(event) => setRequest(event.target.value)} rows={3} placeholder="Describe the capability action to evaluate" className="mt-2 w-full resize-y rounded-lg border border-cos-border bg-cos-bg/70 px-3 py-3 text-sm leading-6 text-cos-text outline-none placeholder:text-cos-steel/70 focus:border-cos-accent/60" /></label>
          </form>
          {result ? <div className="mt-6 rounded-xl border border-cos-border bg-cos-bg/50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ShieldAlert size={18} className={decisionStatus === "REJECTED" ? "text-cos-warn" : "text-cos-accent"} /><span className="font-mono text-lg tabular-nums text-cos-text">{display(result.decision)}</span></div><ProofBadge status={data.records[0].proof} /></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Lane</span><p className="mt-1 text-sm text-cos-text">{display(result.lane)}</p></div><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Reason</span><p className="mt-1 text-sm leading-5 text-cos-muted">{display(result.reason)}</p></div><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Authorization ID</span><p className="mt-1 break-all font-mono text-xs tabular-nums text-cos-text">{display(result.authorization_id)}</p></div><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Decision hash</span><p className="mt-1 break-all font-mono text-xs tabular-nums text-cos-text">{display(result.decision_hash)}</p></div></div></div> : <HonestEmpty title="No governance decision yet" route="POST /api/v1/execution/authorize" detail="Submit a capability action with a transient authority subject. The default-deny result remains visible even when approval is required." />}
        </Pillar>
      </div>
      <Pillar title="Telemetry" proof={telemetryProof} detail="Assessment output is treated as source-of-truth only after the route returns it."><div className="flex items-center gap-3">{assessResult ? <CheckCircle2 size={18} className="text-cos-verified" /> : <ShieldAlert size={18} className="text-cos-steel" />}<div><p className="text-sm text-cos-text">{assessResult ? "Assessment returned" : "No assessment observed"}</p><p className="mt-1 font-mono text-[10px] tabular-nums text-cos-muted">{assessResult ? `${Object.keys(assessResult).length} response fields` : "POST /api/v1/governance/assess"}</p></div></div></Pillar>
      <Pillar title="Authority" proof={authorityProof}><div className="flex items-start gap-3"><LockKeyhole size={18} className="text-cos-accent" /><div><p className="text-sm text-cos-text">{result ? "Decision authority recorded" : "Authority context required"}</p><p className="mt-1 text-xs leading-5 text-cos-muted">{result ? `Lane: ${display(result.lane)}` : "No raw key material is shown. Supply the transient requester identity to evaluate."}</p></div></div></Pillar>
      <Pillar title="Evidence" proof={evidenceProof}><div className="space-y-3">{result?.decision_hash ? <><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Decision hash</span><p className="mt-1 break-all font-mono text-xs tabular-nums text-cos-text">{result.decision_hash}</p></div><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Evidence hash</span><p className="mt-1 break-all font-mono text-xs tabular-nums text-cos-text">{display(result.evidence_hash)}</p></div></> : <HonestEmpty title="No decision evidence yet" route="POST /api/v1/execution/authorize" detail="A response hash is required before this pillar can claim evidence." />}</div></Pillar>
      <Pillar title="Drift" proof="Needs proof"><HonestEmpty title="No drift comparison registered" route="GET /api/v1/governance/quarantine" detail={`Quarantine observations: ${quarantine?.items?.length ?? "not returned"}. Approved state versus runtime drift needs a dedicated comparison payload.`} /></Pillar>
    </SectionShell>
  );
}
