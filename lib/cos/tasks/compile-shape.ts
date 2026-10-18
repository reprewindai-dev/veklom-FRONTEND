import { asBoundOperation } from "@/lib/cos/execution-intent";
import type { GPCPipelineGraph } from "@/types/gpc";
import type { PlanVerdict, StepCoverage, WorkspacePlan, WorkspaceStep } from "./task-types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const VERDICTS: ReadonlySet<string> = new Set<PlanVerdict>(["ready_for_mount", "blocked", "incomplete", "empty"]);
const COVERAGE: ReadonlySet<string> = new Set<StepCoverage>(["read", "write", "blocked", "uncovered"]);

function asVerdict(value: unknown): PlanVerdict | undefined {
  return typeof value === "string" && VERDICTS.has(value) ? (value as PlanVerdict) : undefined;
}

function asCoverage(value: unknown): StepCoverage {
  return typeof value === "string" && COVERAGE.has(value) ? (value as StepCoverage) : "uncovered";
}

/**
 * ABIDE's compile route is used by two surfaces today and answers in two shapes:
 * Blueprint's contract (`{ contract: { steps[], canonical_hash, ... }, validation }`) and
 * Govern's plan (`{ id, steps[], verdict, proof_hash, pipeline, ... }`). The Workspace accepts
 * either and normalizes it. It never fills in a field the service did not return.
 */
export function parseCompileResponse(value: unknown): WorkspacePlan | null {
  const record = asRecord(value);
  if (!record) return null;
  const contract = asRecord(record.contract);
  if (contract) return parseContract(contract);
  return parsePlan(record);
}

function parseContract(contract: JsonRecord): WorkspacePlan | null {
  const planId = asString(contract.contract_id);
  const canonicalHash = asString(contract.canonical_hash);
  const verdict = asVerdict(contract.verdict);
  if (!planId || !canonicalHash || !verdict || !Array.isArray(contract.steps)) return null;
  const steps = contract.steps.flatMap((item, index): WorkspaceStep[] => {
    const step = asRecord(item);
    if (!step) return [];
    const stepId = asString(step.step_id) ?? asString(step.id);
    const clause = asString(step.clause);
    if (!stepId || !clause) return [];
    return [{
      stepId,
      sequence: typeof step.sequence === "number" ? step.sequence : index + 1,
      clause,
      coverage: asCoverage(step.coverage ?? step.kind),
      action: asString(step.action) ?? asString(step.capability) ?? null,
      packageRef: asString(step.package_ref) ?? null,
      reason: asString(step.reason) ?? "",
      requiresApproval: step.requires_approval === true,
      bindable: step.bindable === true,
      operation: asBoundOperation(step.operation),
    }];
  });
  return {
    planId,
    canonicalHash,
    intent: asString(contract.intent) ?? "",
    verdict,
    steps,
    catalogDigest: asString(contract.catalog_digest),
    shape: "contract",
  };
}

function parsePlan(plan: JsonRecord): WorkspacePlan | null {
  const planId = asString(plan.id);
  const verdict = asVerdict(plan.verdict);
  if (!planId || !verdict || !Array.isArray(plan.steps)) return null;
  const steps = plan.steps.flatMap((item, index): WorkspaceStep[] => {
    const step = asRecord(item);
    if (!step) return [];
    const stepId = asString(step.id) ?? asString(step.step_id);
    const clause = asString(step.clause);
    if (!stepId || !clause) return [];
    return [{
      stepId,
      sequence: typeof step.sequence === "number" ? step.sequence : index + 1,
      clause,
      coverage: asCoverage(step.kind ?? step.coverage),
      action: asString(step.action) ?? null,
      packageRef: asString(step.package_ref) ?? null,
      reason: asString(step.reason) ?? "",
      requiresApproval: step.requires_approval === true,
      bindable: step.bindable === true,
      operation: asBoundOperation(step.operation),
    }];
  });
  const pipeline = asRecord(plan.pipeline);
  return {
    planId,
    canonicalHash: asString(plan.proof_hash) ?? planId,
    intent: asString(plan.intent) ?? "",
    verdict,
    steps,
    catalogDigest: asString(plan.catalog_digest),
    pipeline: pipeline && Array.isArray(pipeline.nodes) && Array.isArray(pipeline.edges) ? (pipeline as unknown as GPCPipelineGraph) : undefined,
    shape: "plan",
  };
}
