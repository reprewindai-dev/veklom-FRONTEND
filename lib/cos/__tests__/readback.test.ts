import {
  anchoringLabel,
  anchoringProof,
  compareReadback,
  mountStatusProof,
  pglChainVerifyPath,
  pglProof,
  pglProofLabel,
  pglProofPath,
  targetStateReadbackPath,
} from "../readback";

describe("Capability OS readback and anchoring proof", () => {
  const resultingState = { resource: "counter", value: 1, version: 1 };

  it("requires proof before an independent readback runs", () => {
    expect(compareReadback(resultingState, undefined)).toBe("Needs proof");
  });

  it("verifies matching readback value and version", () => {
    expect(compareReadback(resultingState, {
      state: { resource: "counter", value: 1, version: 1 },
    })).toBe("Verified");
  });

  it("degrades when the readback value or version differs", () => {
    expect(compareReadback(resultingState, {
      state: { resource: "counter", value: 2, version: 1 },
    })).toBe("Degraded");
    expect(compareReadback(resultingState, {
      state: { resource: "counter", value: 1, version: 2 },
    })).toBe("Degraded");
  });

  it.each([
    ["confirmed", "Live", "PGL persisted (CAPPO-reported)"],
    ["pending_reconciliation", "Degraded", "PGL append unconfirmed"],
    ["not_applicable", "Needs proof", "PGL status not confirmed"],
    ["unconfirmed", "Needs proof", "PGL status not confirmed"],
  ] as const)("maps %s anchoring honestly", (status, proof, label) => {
    expect(anchoringProof({ status })).toBe(proof);
    expect(anchoringLabel({ status })).toBe(label);
  });

  it("requires proof when anchoring is missing", () => {
    expect(anchoringProof(undefined)).toBe("Needs proof");
    expect(anchoringLabel(undefined)).toBe("PGL status not confirmed");
  });

  it("keeps CAPPO-reported confirmation Live until independently looked up", () => {
    const anchoring = { status: "confirmed", pgl_event_hash: "pgl_abc" };
    expect(pglProof(anchoring, undefined)).toBe("Live");
    expect(pglProofLabel(anchoring, undefined)).toBe("Independent PGL lookup not run");
  });

  it("keeps a matching persisted hash Live until the agent chain is verified", () => {
    const anchoring = { status: "confirmed", pgl_event_hash: "pgl_abc" };
    const lookup = {
      event_hash: "pgl_abc",
      persisted: true,
      status: "RECORDED_HASH_MATCH",
      cryptographic_verification: "NOT_VERIFIED",
    };
    expect(pglProof(anchoring, lookup)).toBe("Live");
    expect(pglProofLabel(anchoring, lookup)).toBe(
      "PGL hash independently recorded (chain not verified)",
    );
    expect(pglProof(anchoring, { ...lookup, event_hash: "pgl_other" })).toBe("Degraded");
    expect(pglProofLabel(anchoring, { ...lookup, event_hash: "pgl_other" })).toContain(
      "event hash did not match",
    );
  });

  it("verifies a matching persisted hash with a valid agent chain", () => {
    const anchoring = { status: "confirmed", pgl_event_hash: "pgl_abc" };
    const lookup = {
      event_hash: "pgl_abc",
      persisted: true,
      chain: { status: "verified", valid: true },
    };
    expect(pglProof(anchoring, lookup)).toBe("Verified");
    expect(pglProofLabel(anchoring, lookup)).toBe(
      "PGL hash recorded and agent chain verified",
    );
  });

  it("degrades when the PGL agent chain is blocked", () => {
    const anchoring = { status: "confirmed", pgl_event_hash: "pgl_abc" };
    const lookup = {
      event_hash: "pgl_abc",
      persisted: true,
      chain: { status: "blocked", valid: false },
    };
    expect(pglProof(anchoring, lookup)).toBe("Degraded");
    expect(pglProofLabel(anchoring, lookup)).toBe(
      "PGL chain verification failed: blocked",
    );
  });

  it("degrades when the PGL agent chain reports an error", () => {
    const anchoring = { status: "confirmed", pgl_event_hash: "pgl_abc" };
    const lookup = {
      event_hash: "pgl_abc",
      persisted: true,
      chain: { error: "HTTP 502" },
    };
    expect(pglProof(anchoring, lookup)).toBe("Degraded");
    expect(pglProofLabel(anchoring, lookup)).toBe(
      "PGL chain verification failed: HTTP 502",
    );
  });

  it("degrades when the independent PGL lookup reports an error", () => {
    const anchoring = { status: "confirmed", pgl_event_hash: "pgl_abc" };
    expect(pglProof(anchoring, { error: "HTTP 404" })).toBe("Degraded");
    expect(pglProofLabel(anchoring, { error: "HTTP 404" })).toBe(
      "Independent PGL lookup mismatch/failed: HTTP 404",
    );
  });

  it("falls back to anchoring proof for pending or absent anchoring", () => {
    expect(pglProof({ status: "pending_reconciliation" }, undefined)).toBe("Degraded");
    expect(pglProof(undefined, undefined)).toBe("Needs proof");
  });

  it("uses the persisted mount GET proof and falls back to Present", () => {
    expect(mountStatusProof([
      { method: "GET", path: "/v1/capability/mounts/mnt_1", proof: "Verified" },
    ])).toBe("Verified");
    expect(mountStatusProof([])).toBe("Present");
  });

  it("scopes target readback by mount_id rather than client project", () => {
    const path = targetStateReadbackPath("counter/target", "counter value", "mnt/1");
    expect(path).toBe(
      "/v1/capability/targets/counter%2Ftarget/state?resource=counter%20value&mount_id=mnt%2F1",
    );
    expect(path).not.toContain("project=");
  });

  it("encodes public PGL proof lookup paths", () => {
    expect(pglProofPath("event/hash")).toBe("/api/pgl/ledger/proof/event%2Fhash");
  });

  it("encodes PGL agent chain verification paths", () => {
    expect(pglChainVerifyPath("agent/cappo")).toBe(
      "/api/pgl/ledger/agents/agent%2Fcappo/verify",
    );
  });
});
