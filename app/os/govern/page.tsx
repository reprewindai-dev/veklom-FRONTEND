"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Copy, Download, HelpCircle, KeyRound, Workflow } from "lucide-react";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { Field, FailureNotice } from "@/components/cos/StageParts";
import { GpcCanvas, GpcPropertyPanel } from "@/components/gpc/GpcCanvas";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import { readBoundWorkspaceId } from "@/lib/cos/workspace-session";
import { useCanvasStore } from "@/lib/gpc/stores";
import type { GPCEdge, GPCNode, GPCPipelineGraph } from "@/types/gpc";

type StepKind = "read" | "write" | "blocked" | "uncovered";
type Verdict = "ready_for_mount" | "blocked" | "incomplete" | "empty";

interface PlanStep {
  id: string;
  clause: string;
  kind: StepKind;
  action: string | null;
  package_ref: string | null;
  reason: string;
}

interface SuggestedMount {
  package_ref: string;
  reads: string[];
  writes: string[];
  blocked: string[];
}

interface GovernedPython {
  success: boolean;
  python_code: string;
  code_hash?: string;
  execution_order: string[];
  parallel_levels: string[][];
  warnings: string[];
}

interface CompiledPlan {
  id: string;
  intent: string;
  compiler: string;
  catalog_digest: string;
  steps: PlanStep[];
  suggested_mounts: SuggestedMount[];
  verdict: Verdict;
  proof_hash: string;
  pipeline: GPCPipelineGraph;
  python: GovernedPython;
}

const COMPILE: StageEndpoint = { method: "POST", path: "/api/abide/v1/blueprint/compile", classification: "present", response: "ABIDE plan + pipeline" };
const RECOMPILE: StageEndpoint = { method: "POST", path: "/api/abide/v1/pipeline/compile", classification: "present", response: "ABIDE governed Python" };

const VERDICTS: Record<Verdict, { label: string; tone: string; detail: string }> = {
  ready_for_mount: {
    label: "Every step is covered",
    tone: "border-cos-ok/40 bg-cos-ok/5 text-cos-ok",
    detail: "Each step maps to a capability in the live catalog. Nothing is granted yet: CAPPO issues a single-use permit per action when the pipeline runs.",
  },
  blocked: {
    label: "Blocked step",
    tone: "border-cos-danger/40 bg-cos-danger/5 text-cos-danger",
    detail: "A step asks for an action the catalog blocks. CAPPO denies it even under a mount; the generated code records the denial and stops.",
  },
  incomplete: {
    label: "Gaps in the pipeline",
    tone: "border-cos-warn/40 bg-cos-warn/5 text-cos-warn",
    detail: "Some steps have no capability behind them. The generated code refuses those steps until a capability covers them.",
  },
  empty: { label: "Nothing to govern", tone: "border-cos-border text-cos-muted", detail: "The intent produced no steps." },
};

const KIND: Record<StepKind, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  read: { label: "Read", icon: CheckCircle2, tone: "text-cos-ok" },
  write: { label: "Write", icon: KeyRound, tone: "text-cos-accent" },
  blocked: { label: "Blocked", icon: Ban, tone: "text-cos-danger" },
  uncovered: { label: "No capability", icon: HelpCircle, tone: "text-cos-warn" },
};

const EXAMPLES = [
  "read the counter and then increment the counter",
  "reset the counter",
  "increment the counter, then email the team",
];

function isCompiledPlan(value: unknown): value is CompiledPlan {
  const candidate = value as Partial<CompiledPlan> | undefined;
  return Boolean(candidate && typeof candidate.id === "string" && Array.isArray(candidate.steps) && candidate.pipeline && candidate.python);
}

// What the code depends on: structure, not where nodes sit on the canvas.
function structure(nodes: GPCNode[], edges: GPCEdge[]): string {
  return JSON.stringify([
    nodes.map((n) => [n.id, n.node_type, n.config]),
    edges.map((e) => [e.source_node_id, e.target_node_id]),
  ]);
}

function mountHref(mount: SuggestedMount, workspace: string | null): string {
  const params = new URLSearchParams({ package: mount.package_ref, project: "sandbox" });
  if (mount.reads.length) params.set("reads", mount.reads.join(","));
  if (mount.writes.length) params.set("writes", mount.writes.join(","));
  if (mount.blocked.length) params.set("blocked", mount.blocked.join(","));
  if (workspace) params.set("workspace", workspace);
  return `/os/mount?${params.toString()}`;
}

export default function GovernPage() {
  const stage = getStage("govern");
  const data = useStageData("govern");
  const { call } = data;
  const [intent, setIntent] = useState("");
  const [plan, setPlan] = useState<CompiledPlan>();
  const [python, setPython] = useState<GovernedPython>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [workspace, setWorkspace] = useState<string | null>(null);
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const compiledStructure = useRef<string | null>(null);

  const compile = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    setError(undefined);
    const result = await call<CompiledPlan>(COMPILE, { intent: text.trim() });
    setBusy(false);
    if (!isCompiledPlan(result.data)) {
      setError(result.record.error || `ABIDE did not return a pipeline (HTTP ${result.record.status ?? "unreachable"}).`);
      return;
    }
    setPlan(result.data);
    setPython(result.data.python);
    compiledStructure.current = structure(result.data.pipeline.nodes, result.data.pipeline.edges);
    useCanvasStore.getState().loadGraph(result.data.pipeline);
  }, [call]);

  // A Blueprint can hand its intent over: /os/govern?intent=...
  useEffect(() => {
    setWorkspace(readBoundWorkspaceId());
    const handed = new URLSearchParams(window.location.search).get("intent")?.trim();
    if (handed) {
      setIntent(handed);
      void compile(handed);
    }
  }, [compile]);

  // Editing the canvas recompiles the Python straight away (debounced).
  useEffect(() => {
    if (!plan) return;
    const current = structure(nodes, edges);
    if (current === compiledStructure.current) return;
    const timer = window.setTimeout(async () => {
      compiledStructure.current = current;
      const result = await call<GovernedPython>(RECOMPILE, { graph: useCanvasStore.getState().exportGraph() });
      if (result.data && typeof result.data.python_code === "string") setPython(result.data);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [call, edges, nodes, plan]);

  const verdict = plan ? VERDICTS[plan.verdict] : undefined;
  const fileName = useMemo(() => `veklom-pipeline-${plan?.id ?? "draft"}.py`, [plan?.id]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void compile(intent);
  }

  function download() {
    if (!python?.python_code) return;
    const url = URL.createObjectURL(new Blob([python.python_code], { type: "text/x-python" }));
    Object.assign(document.createElement("a"), { href: url, download: fileName }).click();
    URL.revokeObjectURL(url);
  }

  async function copy() {
    if (!python?.python_code) return;
    await navigator.clipboard.writeText(python.python_code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">What should the pipeline do?</span>
              <textarea
                value={intent}
                onChange={(event) => setIntent(event.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="e.g. read the counter and then increment the counter"
                className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg/60 p-3 text-sm text-cos-text outline-none focus:border-cos-accent"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" disabled={busy || !intent.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-4 py-2 text-sm font-semibold text-cos-bg disabled:opacity-50">
                <Workflow size={15} /> {busy ? "Building…" : "Build governed pipeline"}
              </button>
              {EXAMPLES.map((example) => (
                <button key={example} type="button" onClick={() => setIntent(example)} className="rounded-full border border-cos-border px-3 py-1 text-xs text-cos-muted hover:text-cos-text">
                  {example}
                </button>
              ))}
            </div>
            <p className="text-xs leading-5 text-cos-muted">
              ABIDE maps each step to the capability catalog cAPI actually serves. Building a pipeline grants nothing; every step still needs its own permit when it runs.
            </p>
          </form>
          {error ? <div className="mt-3"><FailureNotice detail={error} /></div> : null}
          {plan ? (
            <div className="mt-4 flex overflow-hidden rounded-xl border border-cos-border">
              <div className="min-w-0 flex-1">
                <GpcCanvas heightClassName="h-[440px]" executeLabel="Mount pipeline" onCompile={() => void compile(intent)} onExecute={() => {
                  const first = plan.suggested_mounts[0];
                  if (first) window.location.href = mountHref(first, workspace);
                }} />
              </div>
              <GpcPropertyPanel />
            </div>
          ) : (
            <div className="mt-4"><HonestEmpty title="No pipeline yet" route="POST /api/abide/v1/blueprint/compile" detail="Build one from an intent. Rewire or remove steps on the canvas and the governed Python recompiles." /></div>
          )}
        </Pillar>

        {plan && verdict ? (
          <Pillar title="Authority" proof="Present">
            <div className={`rounded-xl border p-4 ${verdict.tone}`}>
              <div className="font-mono text-xs uppercase tracking-[0.14em]">{verdict.label}</div>
              <p className="mt-1 text-xs leading-5 text-cos-muted">{verdict.detail}</p>
            </div>
            <ol className="mt-4 space-y-2">
              {plan.steps.map((step, index) => {
                const kind = KIND[step.kind];
                const Icon = kind.icon;
                return (
                  <li key={step.id} className="flex items-start gap-3 rounded-lg border border-cos-border bg-cos-bg/40 p-3">
                    <span className="font-mono text-[10px] text-cos-steel">{index + 1}</span>
                    <Icon size={16} className={`mt-0.5 shrink-0 ${kind.tone}`} />
                    <div className="min-w-0">
                      <div className="text-sm text-cos-text">{step.clause}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-cos-muted">
                        <span className={kind.tone}>{kind.label}</span>
                        {step.action ? ` · ${step.action}` : ""}{step.package_ref ? ` · ${step.package_ref}` : ""}
                      </div>
                      <div className="mt-0.5 text-[11px] text-cos-steel">{step.reason}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
            {plan.suggested_mounts.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {plan.suggested_mounts.map((mount) => (
                  <Link key={mount.package_ref} href={mountHref(mount, workspace)} className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/50 px-3 py-2 text-xs font-semibold text-cos-accent hover:bg-cos-accent/10">
                    <KeyRound size={14} /> Mount {mount.package_ref} with exactly this scope
                  </Link>
                ))}
              </div>
            ) : null}
          </Pillar>
        ) : null}
      </div>

      <div className="space-y-4">
        <Pillar title="Evidence" proof={python?.success ? "Present" : "Needs proof"}>
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Governed Python</div>
          {python?.python_code ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 rounded-lg border border-cos-border px-3 py-1.5 text-xs text-cos-text"><Copy size={13} /> {copied ? "Copied" : "Copy"}</button>
                <button type="button" onClick={download} className="inline-flex items-center gap-1.5 rounded-lg border border-cos-border px-3 py-1.5 text-xs text-cos-text"><Download size={13} /> {fileName}</button>
              </div>
              <p className="font-mono text-[10px] leading-4 text-cos-steel">
                {python.parallel_levels.length} stage{python.parallel_levels.length === 1 ? "" : "s"} · every step mounts only its own action, asks CAPPO, runs your code only on ALLOW, then terminates
              </p>
              {python.warnings.length ? <ul className="space-y-1">{python.warnings.map((warning) => <li key={warning} className="text-[11px] text-cos-warn">{warning}</li>)}</ul> : null}
              <pre className="max-h-[560px] overflow-auto rounded-xl border border-cos-border bg-black/40 p-4 font-mono text-[11px] leading-5 text-cos-text">{python.python_code}</pre>
            </div>
          ) : python && !python.success ? (
            <FailureNotice detail={python.warnings.join("; ") || "The pipeline could not be compiled."} />
          ) : (
            <HonestEmpty title="No code yet" route="POST /api/abide/v1/pipeline/compile" detail="The pipeline compiles to Python the moment it exists." />
          )}
        </Pillar>

        {plan ? (
          <Pillar title="Drift" proof="Present">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Reproducibility</div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Plan ID" value={plan.id} />
              <Field label="Proof hash" value={plan.proof_hash} />
              <Field label="Catalog digest" value={plan.catalog_digest} />
              <Field label="Code hash" value={python?.code_hash} />
              <Field label="Compiler" value={plan.compiler} />
              <Field label="Grants authority" value="No: permits are issued per action at run time" />
            </div>
            <p className="mt-3 text-[11px] leading-5 text-cos-steel">The same intent against the same catalog always produces the same plan ID and proof hash, so anyone can rebuild it and check.</p>
          </Pillar>
        ) : null}
      </div>
    </SectionShell>
  );
}
