import fs from "node:fs";
import path from "node:path";
import {
  FUNNEL_RETURN_TO,
  PENDING_RETURN_TO_KEY,
  SIGNUP_URL,
  forgetReturnTo,
  recallReturnTo,
  rememberReturnTo,
  safeRelativePath,
} from "../funnel";
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
    const shell = read("components/shell/HumanAppShell.tsx");
    expect(shell).toContain("Create account");
    // There is no billing or trial; the nav must not promise one.
    expect(shell).not.toContain("Start free trial");
    expect(read("app/get/page.tsx")).toContain("router.push(SIGNUP_URL)");
  });

  it("tells email signups to verify instead of signing in", () => {
    const signup = read("app/signup/page.tsx");
    expect(signup).toContain("Sign-in is refused until the address is verified.");
    expect(signup).not.toContain("Please sign in to continue");
    expect(signup).not.toContain("free trial");
    expect(read("app/verify-email/page.tsx")).toContain("router.replace(destination)");
  });

  it("carries a signup returnTo across the email hop, safely and only for the link's life", () => {
    const at = 1_000_000;
    window.localStorage.clear();
    expect(recallReturnTo(at)).toBeNull();

    rememberReturnTo("/os", at);
    expect(recallReturnTo(at + 60_000)).toBe("/os");
    expect(recallReturnTo(at + 60_000)).toBe("/os"); // a re-run effect still sees it
    expect(recallReturnTo(at + 31 * 60_000)).toBeNull(); // the link has expired
    forgetReturnTo();
    expect(window.localStorage.getItem(PENDING_RETURN_TO_KEY)).toBeNull();

    // The VLink default is never stored; an unsafe value is never stored or returned.
    rememberReturnTo(FUNNEL_RETURN_TO, at);
    expect(window.localStorage.getItem(PENDING_RETURN_TO_KEY)).toBeNull();
    rememberReturnTo("https://evil.example/", at);
    expect(window.localStorage.getItem(PENDING_RETURN_TO_KEY)).toBeNull();
    window.localStorage.setItem(PENDING_RETURN_TO_KEY, JSON.stringify({ path: "//evil.example/", at }));
    expect(recallReturnTo(at)).toBeNull();
    window.localStorage.setItem(PENDING_RETURN_TO_KEY, "not json");
    expect(recallReturnTo(at)).toBeNull();

    const signup = read("app/signup/page.tsx");
    expect(signup).toContain("rememberReturnTo(returnTo)");
    const verify = read("app/verify-email/page.tsx");
    expect(verify).toContain('params.get("returnTo") ?? recallReturnTo()');
    expect(verify).toContain("forgetReturnTo()");
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
