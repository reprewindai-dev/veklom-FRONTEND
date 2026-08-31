import {
  arcProven,
  observationForHeldLease,
  positionState,
  provenTransitionCount,
  ringClosed,
  ringPositions,
  writeBackProven,
  type RingObservation,
  type RingPosition,
} from "@/lib/cos/consequence-ring";

function ring(observations: Partial<Record<string, RingObservation>>): RingPosition[] {
  return ringPositions.map((definition) => ({
    ...definition,
    observation: observations[definition.id] ?? { kind: "unobserved" },
  }));
}

const attested: RingObservation = { kind: "attested", status: 200 };
const reachable: RingObservation = { kind: "reachable", status: 200 };

describe("consequence ring truth states", () => {
  it("never reports a reachable route as verified", () => {
    expect(positionState(reachable)).toBe("LIVE");
    expect(positionState(attested)).toBe("VERIFIED");
  });

  it("separates missing evidence from an unread position", () => {
    expect(positionState({ kind: "not-observable", reason: "x" })).toBe("NEEDS PROOF");
    expect(positionState({ kind: "route-absent" })).toBe("NEEDS PROOF");
    expect(positionState({ kind: "unobserved" })).toBe("UNKNOWN");
  });

  it("reports transport failure as failed and provider failure as degraded", () => {
    expect(positionState({ kind: "failed", status: 404 })).toBe("FAILED");
    expect(positionState({ kind: "failed", status: 503 })).toBe("DEGRADED");
  });
});

describe("the arc rule", () => {
  it("refuses to draw an arc when either side is only reachable", () => {
    const positions = ring({ identity: reachable, connection: attested });
    expect(arcProven(positions[0], positions[1])).toBe(false);
  });

  it("draws an arc only when both positions are attested", () => {
    const positions = ring({ identity: attested, connection: attested });
    expect(arcProven(positions[0], positions[1])).toBe(true);
  });

  it("leaves the ring open for a capability that has never run", () => {
    const positions = ring({});
    expect(ringClosed(positions)).toBe(false);
    expect(provenTransitionCount(positions)).toBe(0);
  });

  it("closes the ring only when every transition is proven", () => {
    const everything = Object.fromEntries(ringPositions.map((position) => [position.id, attested]));
    const positions = ring(everything);
    expect(ringClosed(positions)).toBe(true);
    expect(writeBackProven(positions)).toBe(true);
    expect(provenTransitionCount(positions)).toBe(6);
  });

  it("keeps the ring open when a single position in the middle lacks proof", () => {
    const everything = Object.fromEntries(ringPositions.map((position) => [position.id, attested]));
    const positions = ring({ ...everything, compute: reachable });
    expect(ringClosed(positions)).toBe(false);
    // Both transitions touching compute disappear; the rest survive.
    expect(provenTransitionCount(positions)).toBe(4);
  });
});

describe("authority is only claimed while a lease is live", () => {
  const now = Date.parse("2026-01-01T00:00:00Z");

  it("reports needs proof when no lease was requested", () => {
    expect(positionState(observationForHeldLease(null, now))).toBe("NEEDS PROOF");
  });

  it("reports a held lease as live, never as verified", () => {
    const observation = observationForHeldLease(
      { mountId: "m", tokenId: "t", expiresAt: "2026-01-01T00:05:00Z" },
      now,
    );
    expect(positionState(observation)).toBe("LIVE");
  });

  it("treats an expired lease as no authority at all", () => {
    const observation = observationForHeldLease(
      { mountId: "m", tokenId: "t", expiresAt: "2025-12-31T23:59:00Z" },
      now,
    );
    expect(positionState(observation)).toBe("FAILED");
  });
});

describe("positions that cannot be observed", () => {
  it("never probes authority or execution, because probing them would cause the consequence", () => {
    const unprobeable = ringPositions.filter((position) => position.probe === null).map((position) => position.id);
    expect(unprobeable).toEqual(["authority", "compute"]);
    ringPositions
      .filter((position) => position.probe === null)
      .forEach((position) => expect(position.unobservableReason).toBeTruthy());
  });

  it("keeps aggregate measurement out of attestable routes", () => {
    const measure = ringPositions.find((position) => position.id === "measure");
    expect(measure?.probe?.attestable).toBe(false);
  });
});
