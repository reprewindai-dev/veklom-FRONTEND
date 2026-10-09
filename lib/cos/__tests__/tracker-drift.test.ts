import { driftChecks } from "@/lib/cos/tracker-drift";
import type { SessionCapabilityLease, SessionConsequenceRecord } from "@/lib/cos/lease-session";
import type { ExecutionIntent } from "@/lib/cos/execution-intent";

const intent = {
  contractId: "ctr_1",
  canonicalHash: "h",
  stepId: "s1",
  sequence: 1,
  clause: "set note on record 42",
  operation: { package_ref: "arena.dataset@v1", target_ref: "arena", action: "record.update_note", resource: "42", arguments: {} },
  boundAt: "2026-10-09T00:00:00Z",
} as unknown as ExecutionIntent;

const lease = (overrides: Partial<SessionCapabilityLease> = {}): SessionCapabilityLease => ({
  mountId: "mnt_1",
  tokenId: "tok_1",
  nonce: "n",
  packageRef: "arena.dataset@v1",
  targetRef: "arena",
  workspace: "ws",
  project: "p",
  resource: "42",
  grants: { writes: ["record.update_note"] },
  intent,
  ...overrides,
} as SessionCapabilityLease);

const state = (checks: ReturnType<typeof driftChecks>, link: string) => checks.find((check) => check.link === link)?.state;

describe("tracker drift", () => {
  it("never calls an unmeasured link aligned", () => {
    const checks = driftChecks(null, null, null);
    expect(checks.every((check) => check.state === "Unknown / unmeasured")).toBe(true);
  });

  it("aligns a grant that covers exactly the contract's operation", () => {
    expect(state(driftChecks(lease(), null, null), "Contract ↔ grant")).toBe("Aligned");
  });

  it("reports policy drift when the grant reaches beyond the contract", () => {
    expect(state(driftChecks(lease({ grants: { writes: ["record.update_note", "record.delete"] } }), null, null), "Contract ↔ grant")).toBe("Policy drift");
    expect(state(driftChecks(lease({ resource: "420" }), null, null), "Contract ↔ grant")).toBe("Policy drift");
  });

  it("reports capability drift when the registry no longer serves the bound package or target", () => {
    expect(state(driftChecks(lease(), null, []), "Package ↔ registry")).toBe("Capability drift");
    expect(state(driftChecks(lease(), null, [{ id: "arena.dataset@v1", family: "arena", title: "t", purpose: "p", target_ref: "other" }]), "Package ↔ registry")).toBe("Capability drift");
    expect(state(driftChecks(lease(), null, [{ id: "arena.dataset@v1", family: "arena", title: "t", purpose: "p", target_ref: "arena" }]), "Package ↔ registry")).toBe("Aligned");
  });

  it("reports an unreviewed change when the target differs from the receipt, and stale evidence when unconfirmed", () => {
    const consequence = {
      mountId: "mnt_1",
      response: { consequence: { resulting_state: { value: "approved", version: 2 } }, anchoring: { status: "pending_reconciliation" } },
      readback: { state: { value: "something-else", version: 3 } },
      denials: [],
    } as unknown as SessionConsequenceRecord;
    const checks = driftChecks(lease(), consequence, null);
    expect(state(checks, "Receipt ↔ target")).toBe("Unreviewed change");
    expect(state(checks, "Receipt ↔ ledger")).toBe("Evidence stale");
  });
});
