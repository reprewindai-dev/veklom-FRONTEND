import type { ProofStatus } from "./capabilities";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : undefined;
}

function stateRecord(value: unknown): JsonRecord | undefined {
  const record = asRecord(value);
  return asRecord(record?.state) ?? record;
}

export function targetStateReadbackPath(
  targetRef: string,
  resource: string,
  mountId: string,
): string {
  return `/v1/capability/targets/${encodeURIComponent(targetRef)}/state?resource=${encodeURIComponent(resource)}&mount_id=${encodeURIComponent(mountId)}`;
}

export function compareReadback(
  resultingState: unknown,
  readback: unknown,
): Extract<ProofStatus, "Verified" | "Degraded" | "Needs proof"> {
  const expected = stateRecord(resultingState);
  const observed = stateRecord(readback);
  if (
    !expected
    || !observed
    || typeof expected.value !== "number"
    || typeof expected.version !== "number"
    || typeof observed.value !== "number"
    || typeof observed.version !== "number"
  ) {
    return "Needs proof";
  }
  return expected.value === observed.value && expected.version === observed.version
    ? "Verified"
    : "Degraded";
}

export function anchoringProof(
  anchoring: unknown,
): Extract<ProofStatus, "Verified" | "Degraded" | "Needs proof"> {
  const status = asRecord(anchoring)?.status;
  if (status === "confirmed") return "Verified";
  if (status === "pending_reconciliation") return "Degraded";
  return "Needs proof";
}

export function anchoringLabel(anchoring: unknown): string {
  const status = asRecord(anchoring)?.status;
  if (status === "confirmed") return "PGL persisted";
  if (status === "pending_reconciliation") return "PGL append unconfirmed";
  return "PGL status not confirmed";
}

export function mountStatusProof(
  records: ReadonlyArray<{ method: string; path: string; proof: ProofStatus }>,
): ProofStatus {
  return records.find((record) => (
    record.method === "GET" && record.path.startsWith("/v1/capability/mounts/")
  ))?.proof ?? "Present";
}
