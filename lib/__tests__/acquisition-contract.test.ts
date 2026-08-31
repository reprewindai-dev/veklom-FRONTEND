import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("Veklom universal acquisition contract", () => {
  test("manifest points installed Veklom at the canonical get route and real icons", () => {
    const manifest = JSON.parse(read("public/site.webmanifest"));
    expect(manifest.start_url).toBe("/get?source=installed");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual(
      expect.arrayContaining(["/icon-192.png", "/icon-512.png", "/favicon.svg"]),
    );
    expect(fs.existsSync(path.join(root, "public/icon-192.png"))).toBe(true);
    expect(fs.existsSync(path.join(root, "public/icon-512.png"))).toBe(true);
  });

  test("service worker caches only the acquisition shell, not authority or API responses", () => {
    const worker = read("public/sw.js");
    expect(worker).toContain('"/get"');
    expect(worker).toContain('"/site.webmanifest"');
    expect(worker).not.toContain("/api/");
    expect(worker).not.toContain("capability_lease");
    expect(worker).not.toContain("Authorization");
  });

  test("public acquisition pressure routes through /get", () => {
    const prompt = read("components/acquisition/AcquisitionPrompt.tsx");
    const shell = read("components/shell/HumanAppShell.tsx");
    const homepage = read("app/page.tsx");

    expect(prompt).toContain("const FIRST_DELAY_MS = 700");
    expect(prompt).toContain("const SECOND_DELAY_MS = 30000");
    expect(prompt).toContain("const MAX_DISMISSALS = 3");
    expect(prompt).toContain('href="/get"');
    expect(shell).toContain('href="/get"');
    expect(homepage).toContain('href="/get"');
    expect(homepage).not.toContain('href="/signup"');
  });

  test("QR and get route exist without embedding authority material", () => {
    const getPage = read("app/get/page.tsx");
    const qr = read("public/get-veklom-qr.svg");

    expect(qr.startsWith("<?xml")).toBe(true);
    expect(qr).toContain("<svg");
    expect(getPage).toContain("veklom.com/get");
    expect(getPage).toContain("contains no API key, bearer credential, capability token, or consequence authority");
    expect(getPage).not.toContain("proof_of_possession");
    expect(getPage).not.toContain("capability_lease");
  });
});
