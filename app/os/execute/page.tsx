"use client";

import { FormEvent, useState } from "react";
import { Clock3, FileCheck2, Play, ShieldAlert } from "lucide-react";
import { getStage } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { ProofBadge } from "@/components/cos/ProofBadge";

interface ExecutionResult {
  response?: string;
  execution_id?: string;
  run_id?: string;
  latency_ms?: number;
  model?: string;
  provider?: string;
  links?: Record<string, { href?: string; method?: string }>;
}

export default function ExecutePage() {
  const stage = getStage("execute");
  const data = useStageData("execute");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ExecutionResult | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || data.loading) return;
    const response = await data.call<ExecutionResult>(stage.endpoints[0], { prompt: prompt.trim(), execution_mode: "live" });
    if (response.data) setResult(response.data);
  }

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records} primaryAction={<button type="submit" form="execute-form" disabled={!prompt.trim() || data.loading} className="inline-flex items-center gap-2 rounded-xl bg-cos-accent px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-cos-bg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Play size={14} />{data.loading ? "Running…" : "Run governed action"}</button>}>
      <div className="xl:col-span-2">
        <Pillar title="Work" proof={result ? data.records[0].proof : "Needs proof"} detail="Executions are transient: the runtime result is surfaced here and does not create a persistent agent.">
          <form id="execute-form" onSubmit={submit}><label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Capability instruction</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} placeholder="Describe one governed action to run" className="mt-2 w-full resize-y rounded-lg border border-cos-border bg-cos-bg/70 px-3 py-3 text-sm leading-6 text-cos-text outline-none placeholder:text-cos-steel/70 focus:border-cos-accent/60" /></label></form>
          {result ? <div className="mt-6 rounded-xl border border-cos-accent/30 bg-cos-accent/[0.04] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-cos-accent">Transient execution</div><p className="mt-2 break-all font-mono text-xl tabular-nums text-cos-text">{result.execution_id || "Execution ID not returned"}</p></div><ProofBadge status={data.records[0].proof} /></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Run ID</span><p className="mt-1 break-all font-mono text-xs tabular-nums text-cos-text">{result.run_id || "Not returned"}</p></div><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Phase state</span><p className="mt-1 text-sm text-cos-text">{result.response ? "Response returned" : "No response body"}</p></div><div><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Latency</span><p className="mt-1 font-mono text-sm tabular-nums text-cos-text">{result.latency_ms !== undefined ? `${result.latency_ms} ms` : "Not returned"}</p></div></div>{result.response && <div className="mt-5 border-t border-cos-border pt-4"><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Runtime response</span><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-cos-muted">{result.response}</p></div>}</div> : <HonestEmpty title="No transient execution yet" route="POST /v1/exec" detail="The governed runtime requires its security envelope and policy gates. A rejected request remains a visible Degraded route result, not a fabricated run." />}
        </Pillar>
      </div>
      <Pillar title="Telemetry" proof={result ? data.records[0].proof : "Needs proof"}><div className="flex items-start gap-3"><Clock3 size={18} className="text-cos-accent" /><div><p className="text-sm text-cos-text">{result ? "Execution response observed" : "Awaiting a runtime observation"}</p><p className="mt-1 text-xs leading-5 text-cos-muted">No metric is shown until the execution route returns it.</p></div></div></Pillar>
      <Pillar title="Authority" proof="Needs proof"><div className="flex items-start gap-3"><ShieldAlert size={18} className="text-cos-steel" /><div><p className="text-sm text-cos-text">Transient authority only</p><p className="mt-1 text-xs leading-5 text-cos-muted">This workspace does not create or display a persistent agent identity.</p></div></div></Pillar>
      <Pillar title="Evidence" proof={result?.links?.evidence ? "Verified" : "Needs proof"}>{result?.links?.evidence ? <div className="flex items-start gap-3"><FileCheck2 size={18} className="text-cos-verified" /><div><p className="text-sm text-cos-text">Evidence link returned</p><code className="mt-2 block break-all font-mono text-[10px] tabular-nums text-cos-muted">{result.links.evidence.href || "Evidence path not returned"}</code></div></div> : <HonestEmpty title="No execution evidence yet" route="POST /v1/exec" detail="Evidence is only shown when the runtime returns an evidence link or identifier." />}</Pillar>
      <Pillar title="Drift" proof="Needs proof"><HonestEmpty title="Runtime drift is unmeasured" route="GET /v1/audit/verify" detail="Execution completion alone does not establish that approved state matches runtime state." /></Pillar>
    </SectionShell>
  );
}
