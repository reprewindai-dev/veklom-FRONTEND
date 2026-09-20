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
): Extract<ProofStatus, "Live" | "Degraded" | "Needs proof"> {
  const status = asRecord(anchoring)?.status;
  if (status === "confirmed") return "Live";
  if (status === "pending_reconciliation") return "Degraded";
  return "Needs proof";
}

export function anchoringLabel(anchoring: unknown): string {
  const status = asRecord(anchoring)?.status;
  if (status === "confirmed") return "PGL persisted (CAPPO-reported)";
  if (status === "pending_reconciliation") return "PGL append unconfirmed";
  return "PGL status not confirmed";
}

export type PglProofLookup = {
  event_hash?: string;
  persisted?: boolean;
  status?: string;
  cryptographic_verification?: string;
  error?: string;
  checked_at?: string;
  [key: string]: unknown;
};

export function pglProofPath(eventHash: string): string {
  return `/api/pgl/ledger/proof/${encodeURIComponent(eventHash)}`;
}

export function pglProof(
  anchoring: unknown,
  lookup: unknown,
): Extract<ProofStatus, "Verified" | "Live" | "Degraded" | "Needs proof"> {
  const anchoringRecord = asRecord(anchoring);
  if (anchoringRecord?.status !== "confirmed") {
    return anchoringProof(anchoring);
  }
  const lookupRecord = asRecord(lookup);
  if (!lookupRecord) return "Live";
  if (
    lookupRecord.error
    || lookupRecord.persisted !== true
    || typeof anchoringRecord.pgl_event_hash !== "string"
    || lookupRecord.event_hash !== anchoringRecord.pgl_event_hash
  ) {
    return "Degraded";
  }
  return "Verified";
}

export function pglProofLabel(anchoring: unknown, lookup: unknown): string {
  const anchoringRecord = asRecord(anchoring);
  if (anchoringRecord?.status !== "confirmed") {
    return anchoringLabel(anchoring);
  }
  const lookupRecord = asRecord(lookup);
  if (!lookupRecord) return "Independent PGL lookup not run";
  if (typeof lookupRecord.error === "string" && lookupRecord.error) {
    return `Independent PGL lookup mismatch/failed: ${lookupRecord.error}`;
  }
  if (lookupRecord.persisted !== true) {
    return "Independent PGL lookup mismatch/failed: persisted flag was not true";
  }
  if (
    typeof anchoringRecord.pgl_event_hash !== "string"
    || lookupRecord.event_hash !== anchoringRecord.pgl_event_hash
  ) {
    return "Independent PGL lookup mismatch/failed: event hash did not match CAPPO event hash";
  }
  return "PGL hash independently recorded (existence, not chain-verified)";
}

export function mountStatusProof(
  records: ReadonlyArray<{ method: string; path: string; proof: ProofStatus }>,
): ProofStatus {
  return records.find((record) => (
    record.method === "GET" && record.path.startsWith("/v1/capability/mounts/")
  ))?.proof ?? "Present";
}
