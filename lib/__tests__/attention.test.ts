import {
  approvalItems,
  attentionAnchor,
  rankAttention,
  runItems,
  summarizeAttention,
} from "@/lib/cos/attention";

const quarantine = {
  workspace_id: "ws1",
  items: [
    { quarantine_id: "q-wait", status: "quarantined", reason: "prod write", approvers_required: 2, approvals_received: ["a"], deadline: "2026-10-11T20:00:00Z" },
    { quarantine_id: "q-deny", status: "denied", reason: "prod write", resolution_reason: "out of scope" },
    { quarantine_id: "q-auto", status: "auto_released", reason: "low risk" },
    { quarantine_id: "q-odd", status: "something_new" },
  ],
};

const runs = [
  { run_id: "r-exec", state: "EXECUTING", created_at: "2026-10-11T10:00:00Z" },
  { run_id: "r-att", state: "ATTESTED", created_at: "2026-10-11T09:00:00Z", execution_identity: "ei_123" },
  { run_id: "r-fail", state: "FAILED", created_at: "2026-10-11T08:00:00Z" },
  { run_id: "r-unk", status: "outcome_unknown", created_at: "2026-10-11T07:00:00Z" },
  { run_id: "r-sbx", state: "EXECUTING", scope: { project: "sandbox" } },
  { run_id: "r-none" },
];

describe("attention items come only from what CAPPO returned", () => {
  it("maps the quarantine queue and drops unknown statuses", () => {
    const items = approvalItems(quarantine, false);
    expect(items.map((item) => [item.id, item.need, item.condition])).toEqual([
      ["q-wait", "needs_you", "degraded"],
      ["q-deny", "failed", "failed"],
      ["q-auto", "done", "present"],
    ]);
    expect(items[0].detail).toContain("1 of 2 approvals");
    expect(items[0].href).toBe(`/os/tracker#${attentionAnchor("approval", "q-wait")}`);
  });

  it("maps CAPPO run states; a signed run is present, never verified", () => {
    const items = runItems(runs, false);
    const byId = Object.fromEntries(items.map((item) => [item.id, item]));
    expect(byId["r-exec"].condition).toBe("active");
    expect(byId["r-att"].condition).toBe("present");
    expect(byId["r-att"].evidenceRef).toBe("ei_123");
    expect(byId["r-fail"].condition).toBe("failed");
    expect(byId["r-unk"].need).toBe("uncertain");
    expect(byId["r-none"]).toBeUndefined();
    expect(items.some((item) => item.condition === "verified")).toBe(false);
  });

  it("keeps live and sandbox apart", () => {
    expect(runItems(runs, false).map((item) => item.id)).not.toContain("r-sbx");
    expect(runItems(runs, true).map((item) => item.id)).toEqual(["r-sbx"]);
  });

  it("ranks what needs the human first", () => {
    const ranked = rankAttention([...runItems(runs, false), ...approvalItems(quarantine, false)]);
    expect(ranked.slice(0, 3).map((item) => item.id)).toEqual(["q-wait", "r-unk", "r-fail"]);
  });
});

describe("the one glance never claims more than was read", () => {
  it("approvals waiting outrank everything", () => {
    const items = rankAttention([...runItems(runs, false), ...approvalItems(quarantine, false)]);
    expect(summarizeAttention(items, ["ok", "ok"])).toEqual({ condition: "degraded", label: "1 waiting for your approval", count: 2 });
  });

  it("an unreadable source is never 'all clear'", () => {
    expect(summarizeAttention([], ["unavailable", "unavailable"]).label).toBe("Activity could not be read");
    expect(summarizeAttention([], ["pending", "pending"]).label).toBe("Checking activity");
    expect(summarizeAttention([], ["ok", "unavailable"]).label).toBe("Nothing needs you in what could be read");
    expect(summarizeAttention([], ["ok", "ok"])).toEqual({ condition: "unknown", label: "Nothing needs you", count: 0 });
  });
});
