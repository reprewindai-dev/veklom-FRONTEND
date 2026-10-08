import fs from "node:fs";
import path from "node:path";

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

// Acceptance used to be posted to /api/auth/acceptance, a route no service implemented, so it
// was never recorded. It now travels with the registration, which Identity records atomically.
describe("signup agreement acceptance", () => {
  it("sends every agreement with the registration request", () => {
    const page = read("app/signup/page.tsx");
    expect(page).toContain('const SIGNUP_AGREEMENTS = ["terms", "privacy", "acceptable_use", "github_boundary", "device_flow"]');
    expect(page).toContain("await signup(email, pw, name || undefined, SIGNUP_AGREEMENTS)");
    expect(read("lib/auth-context.tsx")).toContain("accepted_agreements: acceptedAgreements");
  });

  it("no longer posts acceptance separately or tells the person it failed", () => {
    const page = read("app/signup/page.tsx");
    expect(page).not.toContain("/api/auth/acceptance");
    expect(page).not.toContain("could not be recorded");
    expect(fs.existsSync(path.join(process.cwd(), "app/api/auth/acceptance/route.ts"))).toBe(false);
  });
});
