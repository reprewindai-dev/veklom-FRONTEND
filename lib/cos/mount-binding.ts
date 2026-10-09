import { environmentStorageSuffix } from "@/lib/cos/sandbox";
import type { ExecutionIntent } from "@/lib/cos/execution-intent";

/**
 * A prepared mount binding: what Mount hands to Authority (DESIGN_MODEL: Mount discovers, installs
 * and binds; the bounded grant is Govern's decision, materialized in Authority).
 *
 * A binding is a request draft only. It grants nothing and is never sent anywhere until the
 * operator requests authority for it. Stored per tab and per mode (sandbox vs live never mix).
 */
export type MountBinding = {
  packageRef: string;
  packageTitle?: string;
  targetRef?: string;
  workspace: string;
  project: string;
  reads: string[];
  writes: string[];
  blocked: string[];
  /** One resource the mount is bounded to, if any. */
  resource?: string;
  ttlSeconds: number;
  /** The contract-bound operation from Blueprint, when the binding was prepared from one. */
  intent?: ExecutionIntent;
  preparedAt: string;
};

const KEY_BASE = "veklom.mount_binding";
export const MOUNT_BINDING_EVENT = "veklom.mount_binding.changed";

function key(): string {
  return `${KEY_BASE}${environmentStorageSuffix()}`;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parseMountBinding(raw: string | null): MountBinding | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<MountBinding>;
    if (
      typeof value.packageRef !== "string" || !value.packageRef
      || typeof value.workspace !== "string" || !value.workspace
      || typeof value.project !== "string" || !value.project
      || !isStringList(value.reads) || !isStringList(value.writes) || !isStringList(value.blocked)
      || typeof value.ttlSeconds !== "number" || !Number.isFinite(value.ttlSeconds) || value.ttlSeconds <= 0
      || typeof value.preparedAt !== "string"
    ) return null;
    return value as MountBinding;
  } catch {
    return null;
  }
}

export function readMountBinding(): MountBinding | null {
  if (typeof window === "undefined" || !window.sessionStorage) return null;
  try {
    return parseMountBinding(window.sessionStorage.getItem(key()));
  } catch {
    return null;
  }
}

export function storeMountBinding(binding: MountBinding) {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.setItem(key(), JSON.stringify(binding));
  } catch {
    // Storage unavailable: the operator can prepare the binding again.
  }
  window.dispatchEvent(new Event(MOUNT_BINDING_EVENT));
}

export function clearMountBinding() {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(key());
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(MOUNT_BINDING_EVENT));
}

/** The exact request body Authority sends for a binding. Kept identical to the proven mount request. */
export function mountRequestBody(binding: MountBinding) {
  const resources = binding.intent?.operation.resource
    ? [binding.intent.operation.resource]
    : binding.resource ? [binding.resource] : undefined;
  const operation = binding.intent
    ? {
      target_ref: binding.intent.operation.target_ref,
      action: binding.intent.operation.action,
      resource: binding.intent.operation.resource,
      arguments: binding.intent.operation.arguments,
    }
    : undefined;
  const nonEmpty = (values: string[]) => (values.length ? values : undefined);
  return {
    package_ref: binding.packageRef,
    execution_scope: {
      workspace: binding.workspace,
      project: binding.project,
      ...(resources ? { resources } : {}),
      ...(operation ? { operation } : {}),
    },
    requested_action_scope: {
      reads: nonEmpty(binding.reads),
      writes: nonEmpty(binding.writes),
      blocked: binding.blocked,
    },
    ttl_seconds: binding.ttlSeconds,
  };
}
