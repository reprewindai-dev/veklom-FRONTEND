import { COVENANT_PHASES, sealRailAfterDenial } from "../../components/cos/CovenantTraceRail";
import type { CovenantPhase } from "../../components/cos/CovenantTraceRail";

function rail(states: Array<CovenantPhase["state"]>): CovenantPhase[] {
  return states.map((state, index) => ({
    name: COVENANT_PHASES[index],
    state,
    detail: `detail-${index}`,
  }));
}

describe("Covenant Trace Rail", () => {
  it("carries the nine canonical phases in order", () => {
    expect(COVENANT_PHASES).toEqual([
      "IDENTITY",
      "POLICY",
      "SAFETY",
      "COST",
      "APPROVAL",
      "EXECUTION",
      "EVIDENCE",
      "AUDIT",
      "RESPONSE",
    ]);
  });

  it("marks phases after a denial as unreported, never pending", () => {
    const resolved = sealRailAfterDenial(
      rail(["passed", "denied", "pending", "pending", "pending", "pending", "pending", "pending", "pending"])
    );
    expect(resolved[1].state).toBe("denied");
    expect(resolved.slice(2).every((phase) => phase.state === "unreported")).toBe(true);
  });

  it("drops stale detail from phases that never ran", () => {
    const resolved = sealRailAfterDenial(rail(["passed", "denied", "pending"]));
    expect(resolved[2].detail).toBeUndefined();
  });

  it("preserves a rail with no denial", () => {
    const input = rail(["passed", "passed", "sealed"]);
    expect(sealRailAfterDenial(input)).toEqual(input);
  });

  it("keeps the denial reason on the denied phase", () => {
    const resolved = sealRailAfterDenial(rail(["passed", "denied", "pending"]));
    expect(resolved[1].detail).toBe("detail-1");
  });
});
