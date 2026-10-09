"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, CheckCircle2, Download, FileCheck2, HelpCircle, KeyRound, Plus, Stamp, Trash2, Workflow } from "lucide-react";
import { SectionShell } from "@/components/cos/SectionShell";
import { HonestEmpty, Pillar } from "@/components/cos/SectionPillars";
import { Field, FailureNotice } from "@/components/cos/StageParts";
import { getStage, type StageEndpoint } from "@/lib/cos/stages";
import { useStageData } from "@/lib/cos/useStageData";
import {
  asBoundOperation,
  describeArguments,
  readPendingExecutionIntent,
  storePendingExecutionIntent,
  type ArgumentValue,
  type BoundOperation,
} from "@/lib/cos/execution-intent";

type Coverage = "read" | "write" | "blocked" | "uncovered";
type Readiness = "PUBLIC_AVAILABLE_TODAY" | "RESTRICTED_ACCESS_EXISTS" | "RESEARCH_STAGE" | "THEORETICAL_ONLY";

interface ContractStep {
  step_id: string;
  sequence: number;
  clause: string;
  capability: string | null;
  package_ref: string | null;
  coverage: Coverage;
  lane: 1 | 2 | 3;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requires_approval: boolean;
  reason: string;
  bindable?: boolean;
  operation?: BoundOperation | null;
}

interface DraftBinding {
  resource: string;
  args: string;
}

interface GatedClaim {
  statement: string;
  requested_label: string;
  readiness: Readiness;
  allowed: boolean;
  effective_label: string;
  guidance: string;
}

interface Contract {
  contract_id: string;
  contract_version: string;
  intent: string;
  plan_id: string;
  plan_proof_hash: string;
  catalog_digest: string;
  verdict: "ready_for_mount" | "blocked" | "incomplete" | "empty";
  steps: ContractStep[];
  claims: GatedClaim[];
  canonical_hash: string;
  grants_authority: false;
  authority: string;
}

interface CompileResult {
  contract: Contract;
  validation: { valid: boolean; errors: string[]; warnings: string[] };
}

interface DraftClaim {
  statement: string;
  requested_label: string;
  readiness: Readiness;
}

interface LedgerEvent {
  event_id?: string;
  event_hash?: string;
  created_at?: string;
}

const COMPILE: StageEndpoint = { method: "POST", path: "/api/abide/v1/blueprint/compile", classification: "present", response: "ABIDE contract" };
const PROJECT: StageEndpoint = { method: "POST", path: "/api/abide/v1/contract/project", classification: "present", response: "ABIDE agent work order" };
const SEAL: StageEndpoint = { method: "POST", path: "/api/pgl/ledger/events", classification: "present", response: "PGL ledger event" };

const READINESS: Array<{ value: Readiness; label: string }> = [
  { value: "PUBLIC_AVAILABLE_TODAY", label: "Available to anyone today" },
  { value: "RESTRICTED_ACCESS_EXISTS", label: "Exists, restricted access" },
  { value: "RESEARCH_STAGE", label: "Research stage" },
  { value: "THEORETICAL_ONLY", label: "Theoretical only" },
];

const VERDICT: Record<Contract["verdict"], { label: string; tone: string; detail: string }> = {
  ready_for_mount: { label: "Contract is complete", tone: "border-cos-ok/40 bg-cos-ok/5 text-cos-ok", detail: "Every step is covered by a capability in the live catalog. It still grants nothing: the authority layer decides each action when it runs." },
  blocked: { label: "Contract hits a blocked action", tone: "border-cos-danger/40 bg-cos-danger/5 text-cos-danger", detail: "A step asks for something the catalog blocks. The authority layer will deny it; change the outcome or the capability." },
  incomplete: { label: "Contract has gaps", tone: "border-cos-warn/40 bg-cos-warn/5 text-cos-warn", detail: "Some steps have no capability behind them. The contract records them so nobody assumes they are covered." },
  empty: { label: "Nothing to contract", tone: "border-cos-border text-cos-muted", detail: "The outcome produced no steps." },
};

const COVERAGE: Record<Coverage, { label: string; icon: typeof CheckCircle2; tone: string }> = {
  read: { label: "Read", icon: CheckCircle2, tone: "text-cos-ok" },
  write: { label: "Write", icon: KeyRound, tone: "text-cos-accent" },
  blocked: { label: "Blocked", icon: Ban, tone: "text-cos-danger" },
  uncovered: { label: "No capability", icon: HelpCircle, tone: "text-cos-warn" },
};

const LANE = { 1: "Lane 1 · read", 2: "Lane 2 · state", 3: "Lane 3 · external" } as const;

function isCompileResult(value: unknown): value is CompileResult {
  const candidate = value as Partial<CompileResult> | undefined;
  return Boolean(candidate?.contract && Array.isArray(candidate.contract.steps) && candidate.validation);
}

function readRegisteredAgent(): string | null {
  try {
    const raw = localStorage.getItem("veklom.pgl.agent");
    const parsed = raw ? (JSON.parse(raw) as { agent_id?: unknown }) : null;
    return typeof parsed?.agent_id === "string" ? parsed.agent_id : null;
  } catch {
    return null;
  }
}

function saveFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

export default function BlueprintPage() {
  const stage = getStage("blueprint");
  const data = useStageData("blueprint");
  const { call } = data;
  const [intent, setIntent] = useState("");
  const [claims, setClaims] = useState<DraftClaim[]>([]);
  const [result, setResult] = useState<CompileResult>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [seal, setSeal] = useState<LedgerEvent>();
  const [sealError, setSealError] = useState<string>();
  // Operations the user bound to write steps, by step sequence. ABIDE validates them and
  // takes the target from the catalog; nothing here decides what is bindable.
  const [bound, setBound] = useState<Record<number, { resource: string; arguments: Record<string, ArgumentValue> }>>({});
  const [drafts, setDrafts] = useState<Record<number, DraftBinding>>({});
  const [handedStepId, setHandedStepId] = useState<string | null>(null);

  useEffect(() => {
    setAgentId(readRegisteredAgent());
    setHandedStepId(readPendingExecutionIntent()?.stepId ?? null);
  }, []);

  async function runCompile(operations: Record<number, { resource: string; arguments: Record<string, ArgumentValue> }>) {
    if (!intent.trim()) return;
    setBusy(true);
    setError(undefined);
    setSeal(undefined);
    setSealError(undefined);
    const response = await call<CompileResult>(COMPILE, {
      intent: intent.trim(),
      claims: claims.filter((claim) => claim.statement.trim() && claim.requested_label.trim()),
      operations: Object.entries(operations).map(([sequence, op]) => ({ sequence: Number(sequence), ...op })),
    });
    setBusy(false);
    if (!isCompileResult(response.data)) {
      setError(response.record.error || `The blueprint compiler did not return a contract (HTTP ${response.record.status ?? "unreachable"}).`);
      return;
    }
    setBound(operations);
    setResult(response.data);
  }

  async function compile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A new outcome starts unbound: bindings belong to the steps of the contract they were made on.
    await runCompile({});
  }

  async function bindStep(sequence: number) {
    const draft = drafts[sequence];
    if (!draft?.resource.trim()) return;
    let args: unknown = {};
    if (draft.args.trim()) {
      try {
        args = JSON.parse(draft.args);
      } catch {
        setError("Arguments must be a JSON object, e.g. {\"note\": \"approved\"}.");
        return;
      }
    }
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      setError("Arguments must be a JSON object.");
      return;
    }
    await runCompile({ ...bound, [sequence]: { resource: draft.resource.trim(), arguments: args as Record<string, ArgumentValue> } });
  }

  async function unbindStep(sequence: number) {
    const rest = { ...bound };
    delete rest[sequence];
    await runCompile(rest);
  }

  function handOperation(step: ContractStep) {
    const operation = asBoundOperation(step.operation);
    if (!result || !operation) return;
    storePendingExecutionIntent({
      contractId: result.contract.contract_id,
      canonicalHash: result.contract.canonical_hash,
      stepId: step.step_id,
      sequence: step.sequence,
      clause: step.clause,
      operation,
      boundAt: new Date().toISOString(),
    });
    setHandedStepId(step.step_id);
  }

  async function exportAgentFile(format: "agents_md" | "claude_md") {
    if (!result) return;
    const response = await call<{ filename: string; content: string }>(PROJECT, { contract: result.contract, format });
    if (response.data?.content) saveFile(response.data.filename, response.data.content, "text/markdown");
    else setError(response.record.error || "The compiler refused to project this contract.");
  }

  async function sealContract() {
    if (!result || !agentId) return;
    setSealError(undefined);
    const { contract } = result;
    const response = await call<LedgerEvent>(SEAL, {
      agent_id: agentId,
      event_type: "custom",
      actor: "abide",
      summary: `Blueprint contract sealed: ${contract.contract_id}`,
      details: {
        contract_id: contract.contract_id,
        contract_version: contract.contract_version,
        canonical_hash: contract.canonical_hash,
        catalog_digest: contract.catalog_digest,
        plan_proof_hash: contract.plan_proof_hash,
        verdict: contract.verdict,
        grants_authority: false,
      },
    });
    if (response.data?.event_hash) setSeal(response.data);
    else setSealError(response.record.error || "The ledger did not record the seal.");
  }

  const contract = result?.contract;
  const verdict = contract ? VERDICT[contract.verdict] : undefined;

  return (
    <SectionShell stage={stage} proof={data.stageProof} records={data.records}>
      <div className="space-y-4">
        <Pillar title="Work" proof={data.stageProof}>
          <form onSubmit={compile} className="space-y-3">
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">What outcome do you want?</span>
              <textarea value={intent} onChange={(event) => setIntent(event.target.value)} rows={3} maxLength={2000}
                placeholder="e.g. read the counter, increment the counter, then email the team"
                className="mt-2 w-full rounded-lg border border-cos-border bg-cos-bg/60 p-3 text-sm text-cos-text outline-none focus:border-cos-accent" />
            </label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Claims about this plan (optional)</span>
                <button type="button" onClick={() => setClaims((list) => [...list, { statement: "", requested_label: "Production", readiness: "PUBLIC_AVAILABLE_TODAY" }])}
                  className="inline-flex items-center gap-1 rounded-full border border-cos-border px-2.5 py-1 text-[11px] text-cos-muted hover:text-cos-text">
                  <Plus size={12} /> Add claim
                </button>
              </div>
              {claims.map((claim, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-cos-border bg-cos-bg/40 p-2 sm:grid-cols-[1fr_120px_190px_auto]">
                  <input value={claim.statement} onChange={(e) => setClaims((list) => list.map((c, i) => i === index ? { ...c, statement: e.target.value } : c))}
                    placeholder="What are you claiming?" className="rounded border border-cos-border bg-transparent px-2 py-1 text-xs text-cos-text" />
                  <input value={claim.requested_label} onChange={(e) => setClaims((list) => list.map((c, i) => i === index ? { ...c, requested_label: e.target.value } : c))}
                    placeholder="Label" className="rounded border border-cos-border bg-transparent px-2 py-1 text-xs text-cos-text" />
                  <select value={claim.readiness} onChange={(e) => setClaims((list) => list.map((c, i) => i === index ? { ...c, readiness: e.target.value as Readiness } : c))}
                    className="rounded border border-cos-border bg-cos-bg px-2 py-1 text-xs text-cos-text">
                    {READINESS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <button type="button" aria-label="Remove claim" onClick={() => setClaims((list) => list.filter((_, i) => i !== index))} className="text-cos-steel hover:text-cos-danger"><Trash2 size={14} /></button>
                </div>
              ))}
              <p className="text-[11px] leading-4 text-cos-steel">Production or verified labels only stand if the technology is available to anyone today; otherwise the compiler downgrades them.</p>
            </div>

            <button type="submit" disabled={busy || !intent.trim()} className="inline-flex items-center gap-2 rounded-lg bg-cos-accent px-4 py-2 text-sm font-semibold text-cos-bg disabled:opacity-50">
              <FileCheck2 size={15} /> {busy ? "Compiling…" : "Compile contract"}
            </button>
            <p className="text-xs leading-5 text-cos-muted">Veklom compiles your outcome against the capability catalog the registry actually serves. The contract is intent, never authority.</p>
          </form>
          {error ? <div className="mt-3"><FailureNotice detail={error} /></div> : null}
        </Pillar>

        {contract && verdict ? (
          <Pillar title="Authority" proof="Present">
            <div className={`rounded-xl border p-4 ${verdict.tone}`}>
              <div className="font-mono text-xs uppercase tracking-[0.14em]">{verdict.label}</div>
              <p className="mt-1 text-xs leading-5 text-cos-muted">{verdict.detail}</p>
            </div>
            <ol className="mt-4 space-y-2">
              {contract.steps.map((step) => {
                const coverage = COVERAGE[step.coverage];
                const Icon = coverage.icon;
                return (
                  <li key={step.step_id} className="flex items-start gap-3 rounded-lg border border-cos-border bg-cos-bg/40 p-3">
                    <span className="font-mono text-[10px] text-cos-steel">{step.sequence}</span>
                    <Icon size={16} className={`mt-0.5 shrink-0 ${coverage.tone}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-cos-text">{step.clause}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-cos-muted">
                        <span className={coverage.tone}>{coverage.label}</span>
                        {step.capability ? ` · ${step.capability}` : ""}{step.package_ref ? ` · ${step.package_ref}` : ""}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[10px]">
                        <span className="rounded border border-cos-border px-1.5 py-0.5 text-cos-steel">{LANE[step.lane]}</span>
                        <span className="rounded border border-cos-border px-1.5 py-0.5 text-cos-steel">risk {step.risk_level}</span>
                        {step.requires_approval ? <span className="rounded border border-cos-warn/50 px-1.5 py-0.5 text-cos-warn">requires approval</span> : null}
                      </div>
                      {step.operation ? (
                        <div className="mt-2 rounded border border-cos-accent/40 bg-cos-accent/[0.05] p-2 text-[11px]">
                          <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-cos-steel">Bound operation (in the contract hash)</div>
                          <div className="mt-1 font-mono text-cos-text">{step.operation.action} · {step.operation.target_ref} · resource {step.operation.resource} · {describeArguments(step.operation.arguments)}</div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => handOperation(step)} className="rounded border border-cos-accent/50 px-2 py-1 text-cos-accent hover:bg-cos-accent/10">
                              {handedStepId === step.step_id ? "Handed to Mount ✓" : "Use this operation"}
                            </button>
                            {handedStepId === step.step_id ? <Link href="/os/mount" className="text-cos-accent underline">Mount it</Link> : null}
                            <button type="button" onClick={() => void unbindStep(step.sequence)} disabled={busy} className="text-cos-steel hover:text-cos-danger disabled:opacity-50">Unbind</button>
                          </div>
                        </div>
                      ) : step.bindable ? (
                        <div className="mt-2 grid gap-2 rounded border border-cos-border p-2 sm:grid-cols-[120px_1fr_auto]">
                          <input value={drafts[step.sequence]?.resource ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [step.sequence]: { resource: e.target.value, args: d[step.sequence]?.args ?? "" } }))}
                            placeholder="resource" aria-label={`Resource for step ${step.sequence}`} className="rounded border border-cos-border bg-transparent px-2 py-1 font-mono text-xs text-cos-text" />
                          <input value={drafts[step.sequence]?.args ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [step.sequence]: { resource: d[step.sequence]?.resource ?? "", args: e.target.value } }))}
                            placeholder='arguments, JSON: {"field": "value"}' aria-label={`Arguments for step ${step.sequence}`} className="rounded border border-cos-border bg-transparent px-2 py-1 font-mono text-xs text-cos-text" />
                          <button type="button" onClick={() => void bindStep(step.sequence)} disabled={busy || !drafts[step.sequence]?.resource?.trim()} className="rounded border border-cos-accent/50 px-2 py-1 text-[11px] text-cos-accent disabled:opacity-50">Bind exact operation</button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[11px] leading-5 text-cos-steel">{contract.authority}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/os/govern?intent=${encodeURIComponent(contract.intent)}`} className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/50 px-3 py-2 text-xs font-semibold text-cos-accent hover:bg-cos-accent/10">
                <Workflow size={14} /> Build the governed pipeline in Govern
              </Link>
            </div>
          </Pillar>
        ) : null}
      </div>

      <div className="space-y-4">
        {contract && result ? (
          <>
            <Pillar title="Drift" proof={result.validation.valid ? "Present" : "Degraded"}>
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Contract checks</div>
              <div className={`rounded-lg border p-3 text-xs ${result.validation.valid ? "border-cos-ok/40 text-cos-ok" : "border-cos-danger/40 text-cos-danger"}`}>
                {result.validation.valid ? "Valid: hash matches its steps, and every external step requires approval." : result.validation.errors.join("; ")}
              </div>
              {result.validation.warnings.length ? <ul className="mt-2 space-y-1">{result.validation.warnings.map((w) => <li key={w} className="text-[11px] text-cos-warn">{w}</li>)}</ul> : null}
              {contract.claims.length ? (
                <div className="mt-4 space-y-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-cos-steel">Claims after the feasibility gate</div>
                  {contract.claims.map((claim) => (
                    <div key={claim.statement + claim.requested_label} className="rounded-lg border border-cos-border p-3">
                      <div className="text-xs text-cos-text">{claim.statement}</div>
                      <div className={`mt-1 font-mono text-[11px] ${claim.allowed ? "text-cos-ok" : "text-cos-warn"}`}>
                        {claim.allowed ? claim.effective_label : `${claim.requested_label} → ${claim.effective_label}`}
                      </div>
                      <div className="mt-0.5 text-[11px] text-cos-steel">{claim.guidance}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Pillar>

            <Pillar title="Evidence" proof={seal ? "Present" : "Needs proof"}>
              <div className="grid gap-2 sm:grid-cols-2">
                <Field label="Contract ID" value={contract.contract_id} />
                <Field label="Canonical hash" value={contract.canonical_hash} />
                <Field label="Catalog digest" value={contract.catalog_digest} />
                <Field label="Plan proof hash" value={contract.plan_proof_hash} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => saveFile(`${contract.contract_id}.json`, JSON.stringify(contract, null, 2), "application/json")} className="inline-flex items-center gap-1.5 rounded-lg border border-cos-border px-3 py-1.5 text-xs text-cos-text"><Download size={13} /> Contract JSON</button>
                <button type="button" onClick={() => void exportAgentFile("agents_md")} className="inline-flex items-center gap-1.5 rounded-lg border border-cos-border px-3 py-1.5 text-xs text-cos-text"><Download size={13} /> AGENTS.md</button>
                <button type="button" onClick={() => void exportAgentFile("claude_md")} className="inline-flex items-center gap-1.5 rounded-lg border border-cos-border px-3 py-1.5 text-xs text-cos-text"><Download size={13} /> CLAUDE.md</button>
              </div>
              <div className="mt-4 rounded-lg border border-cos-border p-3">
                {seal ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-xs text-cos-ok"><Stamp size={14} /> Sealed in the evidence ledger</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Field label="Ledger event" value={seal.event_id} />
                      <Field label="Event hash" value={seal.event_hash} />
                    </div>
                  </div>
                ) : agentId ? (
                  <button type="button" onClick={() => void sealContract()} className="inline-flex items-center gap-2 rounded-lg border border-cos-accent/50 px-3 py-2 text-xs font-semibold text-cos-accent hover:bg-cos-accent/10">
                    <Stamp size={14} /> Seal this contract in the ledger (agent {agentId})
                  </button>
                ) : (
                  <p className="text-xs text-cos-muted">Register an agent in <Link href="/os/onboarding" className="text-cos-accent underline">onboarding</Link> to seal contracts in the ledger under it.</p>
                )}
                {sealError ? <div className="mt-2"><FailureNotice detail={sealError} /></div> : null}
              </div>
            </Pillar>
          </>
        ) : (
          <Pillar title="Evidence" proof="Needs proof">
            <HonestEmpty title="No contract yet" route="POST /api/abide/v1/blueprint/compile" detail="Compile an outcome to get a bounded contract you can check, export to coding agents, and seal in the ledger." />
          </Pillar>
        )}
      </div>
    </SectionShell>
  );
}
