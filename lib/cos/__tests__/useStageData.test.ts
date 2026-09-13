import {
  applicableRecords,
  aggregateStageProof,
  recordsForStage,
  type StageCallRecord,
} from "../useStageData";
import type { StageDefinition } from "../stages";

function record(
  path: string,
  proof: StageCallRecord["proof"],
  observation: StageCallRecord["observation"] = { kind: "source-of-truth", status: 200 },
): StageCallRecord {
  return {
    method: "GET",
    path,
    classification: "present",
    proof,
    observation,
  };
}

function stage(endpoints: StageDefinition["endpoints"]): StageDefinition {
  return {
    id: "mount",
    label: "Mount",
    route: "/os/mount",
    purpose: "Test stage",
    owner: "Test owner",
    endpoints,
  };
}

describe("Capability OS stage aggregation", () => {
  it("prioritizes Degraded when a failed record accompanies a verified record", () => {
    expect(aggregateStageProof([
      record("/v1/one", "Verified"),
      record("/v1/two", "Degraded", { kind: "failed", status: 503 }),
    ])).toBe("Degraded");
  });

  it("ignores an uncalled template declaration when the concrete applicable record is verified", () => {
    const definition = stage([
      { method: "GET", path: "/v1/summary", classification: "present", response: "summary" },
      { method: "GET", path: "/v1/mounts/{mount_id}", classification: "present", response: "mount" },
    ]);
    const records = recordsForStage(
      definition,
      {
        "GET /v1/summary": record("/v1/summary", "Verified"),
      },
      {},
      false,
    );

    expect(records.map(({ path }) => path)).toEqual([
      "/v1/summary",
      "/v1/mounts/{mount_id}",
    ]);
    expect(applicableRecords(definition, records)).toHaveLength(1);
    expect(aggregateStageProof(applicableRecords(definition, records))).toBe("Verified");
  });

  it("treats a called template failure as degraded", () => {
    const definition = stage([
      { method: "GET", path: "/v1/summary", classification: "present", response: "summary" },
      { method: "GET", path: "/v1/mounts/{mount_id}", classification: "present", response: "mount" },
    ]);
    const records = recordsForStage(
      definition,
      {
        "GET /v1/summary": record("/v1/summary", "Verified"),
        "GET /v1/mounts/{mount_id}": record(
          "/v1/mounts/{mount_id}",
          "Degraded",
          { kind: "failed", status: 503 },
        ),
      },
      {},
      false,
    );

    expect(aggregateStageProof(applicableRecords(definition, records))).toBe("Degraded");
  });

  it("preserves Simulated over a verified record", () => {
    expect(aggregateStageProof([
      record("/v1/one", "Simulated"),
      record("/v1/two", "Verified"),
    ])).toBe("Simulated");
  });

  it("returns Not started when every applicable record has no route", () => {
    expect(aggregateStageProof([
      record("/v1/one", "Not started", { kind: "no-route" }),
      record("/v1/two", "Not started", { kind: "no-route" }),
    ])).toBe("Not started");
  });

  it("returns Present when a verified record has an uncalled concrete-less sibling", () => {
    const records = [
      record("/v1/summary", "Verified"),
      record("/v1/ledger", "Needs proof", { kind: "not-called" }),
    ];

    expect(aggregateStageProof(records)).toBe("Present");
  });

  it("appends a deduplicated concrete record after declared non-template rows", () => {
    const definition = stage([
      { method: "GET", path: "/v1/mounts", classification: "present", response: "mounts" },
      { method: "GET", path: "/v1/mounts/{mount_id}", classification: "present", response: "mount" },
    ]);
    const records = recordsForStage(
      definition,
      {
        "GET /v1/mounts": record("/v1/mounts", "Present"),
        "GET /v1/mounts/mnt_123": record("/v1/mounts/mnt_123", "Verified"),
      },
      {},
      false,
    );

    expect(records.map(({ path }) => path)).toEqual([
      "/v1/mounts",
      "/v1/mounts/{mount_id}",
      "/v1/mounts/mnt_123",
    ]);
  });
});
