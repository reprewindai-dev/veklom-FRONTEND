import { arcProven, positionState, ringPositions, type RingPosition } from "@/lib/cos/consequence-ring";

function at(id: RingPosition["id"], observation: RingPosition["observation"]): RingPosition {
  const definition = ringPositions.find((position) => position.id === id)!;
  return { ...definition, observation };
}

describe("consequence ring: signed is not verified", () => {
  it("draws a merely signed payload as SIGNED, never VERIFIED", () => {
    expect(positionState({ kind: "signed", status: 200 })).toBe("SIGNED");
    expect(positionState({ kind: "attested", status: 200 })).toBe("VERIFIED");
    expect(positionState({ kind: "reachable", status: 200 })).toBe("LIVE");
  });

  it("an arc needs VERIFIED at both ends; a SIGNED end cannot close it", () => {
    const verified = at("connection", { kind: "attested", status: 200 });
    const signed = at("evidence", { kind: "signed", status: 200 });
    const alsoVerified = at("evidence", { kind: "attested", status: 200 });
    expect(arcProven(verified, signed)).toBe(false);
    expect(arcProven(signed, verified)).toBe(false);
    expect(arcProven(verified, alsoVerified)).toBe(true);
  });

  it("service-reported 'needs proof' and sign-in walls stay out of the proven states", () => {
    expect(positionState({ kind: "unproven", status: 200 })).toBe("NEEDS PROOF");
    expect(positionState({ kind: "sign-in-required", status: 401 })).toBe("SIGN IN REQUIRED");
  });
});
