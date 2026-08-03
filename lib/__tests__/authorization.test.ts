import { hasBearerAuthorization } from "@/lib/authorization";

describe("authorization boundary", () => {
  it("requires a non-empty bearer token", () => {
    expect(hasBearerAuthorization(null)).toBe(false);
    expect(hasBearerAuthorization("Basic abc")).toBe(false);
    expect(hasBearerAuthorization("Bearer ")).toBe(false);
    expect(hasBearerAuthorization("Bearer signed-token")).toBe(true);
  });
});
