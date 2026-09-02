import { readEnvironmentIsSandbox } from "@/lib/cos/sandbox";

describe("sandbox environment mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("reads sandbox mode from localStorage", () => {
    window.localStorage.setItem("veklom.environment", "sandbox");
    expect(readEnvironmentIsSandbox()).toBe(true);
  });

  it("does not treat production mode as sandbox", () => {
    window.localStorage.setItem("veklom.environment", "production");
    expect(readEnvironmentIsSandbox()).toBe(false);
  });

  it("defaults to production when unset", () => {
    expect(readEnvironmentIsSandbox()).toBe(false);
  });
});
