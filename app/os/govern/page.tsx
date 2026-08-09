"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { LockKeyhole, Send, ShieldAlert } from "lucide-react";
import { capabilities } from "@/lib/cos/capabilities";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { ProofBadge } from "@/components/cos/ProofBadge";
import { CopyValue, Field, JsonPanel } from "@/components/cos/StageParts";
const directives = ["ALLOW", "ALLOW_WITH_AUDIT", "NEEDS_APPROVAL", "DENY", "REJECT"];
export default function GovernPage() {
  const stage = getStage("govern"), data = useStageData("govern");
  const [subject, setSubject] = useState(""), [capability, setCapability] = useState(capabilities[0]?.id ?? ""), [directive, setDirective] = useState("NEEDS_APPROVAL"), [request, setRequest] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null), [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);
  const auth = stage.endpoints[0], assess = stage.endpoints[1], quarantine = stage.endpoints[2];
  const quarantineData = data.payloads[`GET ${quarantine.path}`];
  useEffect(() => { void data.call(quarantine); }, [data.call, quarantine]);
  const busy = data.loading || !subject.trim() || !request.trim() || !capability;
  const label = useMemo(() => data.loading ? "Evaluating…" : "Evaluate governance", [data.loading]);
  async function submit(e: FormEvent) { e.preventDefault(); if (busy) return; const body = { agent_id: subject.trim(), capability_id: capability, directive, request: { instruction: request.trim() } }; const a = await data.call<Record<string, unknown>>(auth, body); if (a.data) setResult(a.data); const b = await data.call<Record<string, unknown>>(assess, body); if (b.data) setAssessment(b.data); }
  const proof = result ? data.records[0]?.proof ?? "Needs proof" : "Needs proof";
  return <SectionShell stage={stage} proof={data.stageProof} records={data.records} primaryAction={<button type="submit" form="govern-form" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-cos-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg disabled:opacity-40"><Send size={14} />{label}</button>}>
    <div className="xl:col-span-2"><Pillar title="Work" proof={proof} detail="Authorization is evaluated before execution. Denial and approval requirements are first-class outcomes."><form id="govern-form" onSubmit={submit} className="grid gap-4 md:grid-cols-2">
      <label><span className="cos-label">Transient authority subject</span><input required value={subject} onChange={e => setSubject(e.target.value)} placeholder="Operator-provided subject" className="cos-input" /></label>
      <label><span className="cos-label">Capability</span><select value={capability} onChange={e => setCapability(e.target.value)} className="cos-input font-mono">{capabilities.map(c => <option key={c.id} value={c.id}>{c.name} · {c.id}</option>)}</select></label>
      <label><span className="cos-label">Directive</span><select value={directive} onChange={e => setDirective(e.target.value)} className="cos-input font-mono">{directives.map(d => <option key={d}>{d}</option>)}</select></label>
      <label className="md:col-span-2"><span className="cos-label">Requested action</span><textarea required value={request} onChange={e => setRequest(e.target.value)} rows={3} placeholder="Describe the capability action to evaluate" className="cos-input" /></label>
    </form>{result ? <div className="mt-5 space-y-4 rounded-xl border border-cos-border bg-cos-bg/45 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><ShieldAlert size={18} className={result.decision === "REJECTED" ? "text-cos-warn" : "text-cos-accent"} /><span className="font-mono text-lg tabular-nums text-cos-text">{String(result.decision ?? "Not returned")}</span></div><ProofBadge status={proof} /></div><div className="grid gap-3 sm:grid-cols-2">{["lane", "reason", "authorization_id", "decision_hash", "evidence_hash"].map(k => <Field key={k} label={k} value={result[k]} />)}</div></div> : <HonestEmpty title="No governance decision yet" route={`${auth.method} ${auth.path}`} detail="Submit a capability action with a transient subject. The fail-closed result remains visible even when approval is required." />}</Pillar></div>
    <Pillar title="Telemetry" proof={assessment ? data.records[1]?.proof ?? "Needs proof" : "Needs proof"}><JsonPanel value={assessment} empty={`No assessment returned — ${assess.method} ${assess.path}`} /></Pillar>
    <Pillar title="Authority" proof={result?.authorization_id ? proof : "Needs proof"}><div className="space-y-3"><div className="flex items-start gap-3"><LockKeyhole size={17} className="text-cos-accent" /><p className="text-xs leading-5 text-cos-muted">Execution Identity and EAT fields appear only when a public response returns them. No key material is rendered.</p></div><div className="grid gap-3 sm:grid-cols-2">{["subject","tenant_id","run_id","authority_bundle_hash","policy_hash","pgl_certificate_id","budget","execution_mode","ttl_seconds","audience","nonce","revocation"].map(k => <Field key={k} label={k} value={result?.[k]} />)}</div></div></Pillar>
    <Pillar title="Evidence" proof={result?.decision_hash && result?.evidence_hash ? proof : "Needs proof"}>{result ? <div className="space-y-3"><div><span className="cos-label">Decision hash</span><CopyValue value={String(result.decision_hash ?? "")} /></div><div><span className="cos-label">Evidence hash</span><CopyValue value={String(result.evidence_hash ?? "")} /></div></div> : <HonestEmpty title="No decision evidence yet" route={`${auth.method} ${auth.path}`} detail="A response hash is required before this pillar can claim evidence." />}</Pillar>
    <Pillar title="Drift" proof="Needs proof"><HonestEmpty title="No governance/runtime comparison" route={`${quarantine.method} ${quarantine.path}`} detail={`Quarantine response observed: ${quarantineData ? "returned" : "not returned"}. Approval state and runtime drift require a joined evidence payload.`} /></Pillar>
  </SectionShell>;
}
