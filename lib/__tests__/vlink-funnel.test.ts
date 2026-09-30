import fs from "node:fs";
import path from "node:path";
import { FUNNEL_RETURN_TO, SIGNUP_URL, safeRelativePath } from "../funnel";
import { brandForHost, originFromHost } from "../brandMetadata";

const read = (relative: string) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("VLink front-door funnel", () => {
  it("sends new visitors to signup with a VLink returnTo", () => {
    expect(FUNNEL_RETURN_TO).toBe("/vlink/connect/");
    expect(SIGNUP_URL).toBe("/signup?returnTo=%2Fvlink%2Fconnect%2F");
  });

  it("accepts only same-origin relative returnTo paths", () => {
    expect(safeRelativePath("/os")).toBe("/os");
    expect(safeRelativePath(null)).toBe("/vlink/connect/");
    expect(safeRelativePath("https://evil.example/")).toBe("/vlink/connect/");
    expect(safeRelativePath("//evil.example/")).toBe("/vlink/connect/");
    expect(safeRelativePath("/\\evil.example/")).toBe("/vlink/connect/");
  });

  it("wires the primary CTAs, nav and /get to the signup URL", () => {
    expect(read("app/page.tsx")).toContain("Start free with VLink");
    expect(read("app/page.tsx")).toContain("href={SIGNUP_URL}");
    expect(read("components/shell/HumanAppShell.tsx")).toContain("Start free trial");
    expect(read("app/get/page.tsx")).toContain("router.push(SIGNUP_URL)");
  });

  it("tells email signups to verify instead of signing in", () => {
    const signup = read("app/signup/page.tsx");
    expect(signup).toContain("Check your email to verify your account — the link expires in 30 minutes.");
    expect(signup).not.toContain("Please sign in to continue");
    expect(read("app/verify-email/page.tsx")).toContain("router.replace(destination)");
  });

  it("chooses the share card from the request host", () => {
    expect(brandForHost("veklom.com")).toBe("veklom");
    expect(brandForHost("os.veklom.com")).toBe("capability-os");
    expect(brandForHost("vlink.veklom.com")).toBe("vlink");
    expect(originFromHost("os.veklom.com")).toBe("https://os.veklom.com");
    expect(originFromHost("127.0.0.1:3097")).toBe("https://veklom.com");
    expect(originFromHost("attacker.example")).toBe("https://veklom.com");
    expect(originFromHost(null)).toBe("https://veklom.com");
  });
});
