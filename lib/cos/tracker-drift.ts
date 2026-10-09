import type { PackagePayload } from "@/components/cos/MountParts";
import type { SessionCapabilityLease, SessionConsequenceRecord } from "@/lib/cos/lease-session";
import { compareReadback } from "@/lib/cos/readback";

/** Tracker drift states (docs/design-brief/02_NAVIGATION_MAP.md). */
export type DriftState = "Aligned" | "Unreviewed change" | "Deployment drift" | "Policy drift" | "Capability drift" | "Evidence stale" | "Unknown / unmeasured";
export type DriftCheck = { link: string; state: DriftState; detail: string };

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/** Every check below is a pure comparison of returned values. Exported for tests. */
export function driftChecks(lease: SessionCapabilityLease | null, consequence: SessionConsequenceRecord | null, packages: PackagePayload[] | null): DriftCheck[] {
  const checks: DriftCheck[] = [];
  const intent = lease?.intent;

  if (!lease || !intent) {
    checks.push({ link: "Contract ↔ grant", state: "Unknown / unmeasured", detail: "No contract-bound grant in this session." });
  } else {
    const writes = lease.grants?.writes;
    const wider = writes ? writes.some((action) => action !== intent.operation.action) : false;
    const resourceMoved = lease.resource !== undefined && lease.resource !== intent.operation.resource;
    checks.push(writes === undefined
      ? { link: "Contract ↔ grant", state: "Unknown / unmeasured", detail: "The grant's writes were not returned." }
      : wider || resourceMoved
        ? { link: "Contract ↔ grant", state: "Policy drift", detail: `The grant reaches beyond the contract's one operation (${intent.operation.action} on ${intent.operation.resource}).` }
        : { link: "Contract ↔ grant", state: "Aligned", detail: `The grant covers exactly ${intent.operation.action} on ${intent.operation.resource}.` });
  }

  if (!lease) {
    checks.push({ link: "Package ↔ registry", state: "Unknown / unmeasured", detail: "No bound package in this session." });
  } else if (!packages) {
    checks.push({ link: "Package ↔ registry", state: "Unknown / unmeasured", detail: "The registry catalog was not returned." });
  } else {
    const entry = packages.find((item) => item.id === lease.packageRef);
    checks.push(!entry
      ? { link: "Package ↔ registry", state: "Capability drift", detail: `${lease.packageRef ?? "The bound package"} is no longer served by the registry.` }
      : lease.targetRef && entry.target_ref && entry.target_ref !== lease.targetRef
        ? { link: "Package ↔ registry", state: "Capability drift", detail: `The registry now binds this package to ${entry.target_ref}, not ${lease.targetRef}.` }
        : { link: "Package ↔ registry", state: "Aligned", detail: "The bound package and its target are unchanged in the registry." });
  }

  const response = asRecord(consequence?.lastAllowedResponse ?? consequence?.response);
  const resultingState = asRecord(asRecord(response?.consequence)?.resulting_state);
  if (!consequence?.readback || !resultingState) {
    checks.push({ link: "Receipt ↔ target", state: "Unknown / unmeasured", detail: "No receipt with an independent readback in this session." });
  } else {
    const verdict = compareReadback(resultingState, consequence.readback);
    checks.push(verdict === "Verified"
      ? { link: "Receipt ↔ target", state: "Aligned", detail: "The target's own state matches the receipt." }
      : verdict === "Degraded"
        ? { link: "Receipt ↔ target", state: "Unreviewed change", detail: "The target's own state differs from what the receipt says happened." }
        : { link: "Receipt ↔ target", state: "Unknown / unmeasured", detail: "The readback did not return comparable state." });
  }

  const anchorStatus = asRecord(response?.anchoring)?.status;
  checks.push(anchorStatus === "confirmed"
    ? { link: "Receipt ↔ ledger", state: "Aligned", detail: "The authority layer reports the receipt persisted in the ledger." }
    : anchorStatus === "pending_reconciliation"
      ? { link: "Receipt ↔ ledger", state: "Evidence stale", detail: "The ledger append is not yet confirmed (pending reconciliation)." }
      : { link: "Receipt ↔ ledger", state: "Unknown / unmeasured", detail: "No ledger anchoring status in this session." });

  checks.push({ link: "Blueprint ↔ repository commit", state: "Unknown / unmeasured", detail: "No repository feed is connected." });
  checks.push({ link: "Repository ↔ image ↔ runtime", state: "Unknown / unmeasured", detail: "No repository-gate or deployment feed is connected." });
  return checks;
}
