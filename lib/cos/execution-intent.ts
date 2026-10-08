import { environmentStorageSuffix } from "@/lib/cos/sandbox";

/**
 * The exact operation an ABIDE contract step is bound to. ABIDE takes the target
 * from the package's catalog entry (CAPPO enforces it at execute); the browser
 * never assembles or edits any of these fields, it only carries them.
 */
export type ArgumentValue = string | number | boolean | null;

export type BoundOperation = {
  package_ref: string;
  target_ref: string;
  action: string;
  resource: string;
  arguments: Record<string, ArgumentValue>;
};

/** A bound operation plus the contract it came from: what Mount scopes and Execute submits. */
export type ExecutionIntent = {
  contractId: string;
  canonicalHash: string;
  stepId: string;
  sequence: number;
  clause: string;
  operation: BoundOperation;
  boundAt: string;
};

const PENDING_KEY_BASE = "veklom.execution_intent";

function pendingKey() {
  return `${PENDING_KEY_BASE}${environmentStorageSuffix()}`;
}

function isArgumentValue(value: unknown): value is ArgumentValue {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

export function asBoundOperation(value: unknown): BoundOperation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const op = value as Record<string, unknown>;
  const args = op.arguments;
  if (
    typeof op.package_ref !== "string" || !op.package_ref
    || typeof op.target_ref !== "string" || !op.target_ref
    || typeof op.action !== "string" || !op.action
    || typeof op.resource !== "string" || !op.resource
    || !args || typeof args !== "object" || Array.isArray(args)
    || !Object.values(args as Record<string, unknown>).every(isArgumentValue)
  ) return null;
  return {
    package_ref: op.package_ref,
    target_ref: op.target_ref,
    action: op.action,
    resource: op.resource,
    arguments: { ...(args as Record<string, ArgumentValue>) },
  };
}

export function asExecutionIntent(value: unknown): ExecutionIntent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const intent = value as Record<string, unknown>;
  const operation = asBoundOperation(intent.operation);
  if (
    !operation
    || typeof intent.contractId !== "string"
    || typeof intent.canonicalHash !== "string"
    || typeof intent.stepId !== "string"
    || typeof intent.sequence !== "number"
    || typeof intent.clause !== "string"
    || typeof intent.boundAt !== "string"
  ) return null;
  return {
    contractId: intent.contractId,
    canonicalHash: intent.canonicalHash,
    stepId: intent.stepId,
    sequence: intent.sequence,
    clause: intent.clause,
    operation,
    boundAt: intent.boundAt,
  };
}

/** Blueprint hands the bound operation to Mount through this, never through the URL. */
export function storePendingExecutionIntent(intent: ExecutionIntent) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    sessionStorage.setItem(pendingKey(), JSON.stringify(intent));
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function readPendingExecutionIntent(): ExecutionIntent | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    const raw = sessionStorage.getItem(pendingKey());
    return raw ? asExecutionIntent(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function clearPendingExecutionIntent() {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    sessionStorage.removeItem(pendingKey());
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function describeArguments(args: Record<string, ArgumentValue>): string {
  const keys = Object.keys(args).sort();
  return keys.length ? keys.map((key) => `${key}=${JSON.stringify(args[key])}`).join(", ") : "no arguments";
}
