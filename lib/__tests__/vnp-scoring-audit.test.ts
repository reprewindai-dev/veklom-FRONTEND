import { computeLeaderboard, computeVNPScore } from "@/lib/vnp/scoring";
import type { BenchmarkApiEntry } from "@/lib/vnp/types";

const leaderboardEntry: BenchmarkApiEntry = {
  id: "provider-a",
  name: "Provider A",
  p50: 40,
  p95: 80,
  p99: 120,
  successRatePercent: 100,
  measuredFrom: "governed_runs",
  sampleCount: 3,
};

describe("VNP score evidence gates", () => {
  it("does not turn leaderboard metadata into a measured score", () => {
    const score = computeVNPScore(leaderboardEntry);

    expect(score.status).toBe("unmeasured");
    expect(score.grade).toBe("N/A");
    expect(score.composite).toBeNull();
    expect(score.measurementCount).toBe(3);
    expect(score.regions).toEqual([]);
    expect(score.provenance.merkleRoot).toBe("Needs proof");
    expect(score.provenance.nodeOperators).toEqual([]);
  });

  it("does not rank entries without dependency-backed measurement evidence", () => {
    expect(computeLeaderboard([leaderboardEntry])).toEqual([]);
  });
});
