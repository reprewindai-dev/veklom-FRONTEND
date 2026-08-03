import { computeLeaderboard, computeVNPScore } from "@/lib/vnp/scoring";
import type { BenchmarkApiEntry } from "@/lib/vnp/types";

const leaderboardEntry: BenchmarkApiEntry = {
  id: "provider-a",
  name: "Provider A",
  category: "general",
  p50: 40,
  p95: 80,
  p99: 120,
  sla: 99.9,
  drift: 0.1,
  sovereignTier: 1,
  complianceLabels: ["x402"],
  govScore: 90,
  devScore: 90,
  endpointUrl: "https://provider.example",
  throughput: 1000,
  uptime24h: 99.9,
  totalStaked: 1000,
  status: "active",
};

describe("VNP score evidence gates", () => {
  it("does not turn leaderboard metadata into a measured score", () => {
    const score = computeVNPScore(leaderboardEntry);

    expect(score.status).toBe("unmeasured");
    expect(score.grade).toBe("N/A");
    expect(score.measurementCount).toBe(0);
    expect(score.regions).toEqual([]);
    expect(score.provenance.merkleRoot).toBe("Needs proof");
    expect(score.provenance.nodeOperators).toEqual([]);
  });

  it("does not rank entries without dependency-backed measurement evidence", () => {
    expect(computeLeaderboard([leaderboardEntry])).toEqual([]);
  });
});
