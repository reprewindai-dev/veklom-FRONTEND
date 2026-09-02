import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(ROOT, relativePath), "utf8");

function pngDimensions(relativePath: string): [number, number] {
  const bytes = fs.readFileSync(path.join(ROOT, relativePath));
  expect(bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}

describe("brand surfaces", () => {
  it("uses the supplied shield and Capability OS lockup in shared OS surfaces", () => {
    const sources = [
      read("components/brand/PremiumPrimitives.tsx"),
      read("components/cos/VeklomLogo.tsx"),
      read("components/Logo.tsx"),
      read("components/ui/SharedUI.tsx"),
    ];

    for (const source of sources) expect(source).toContain("/brand/veklom-shield-512.png");
    expect(sources[1]).toContain("Capability OS");
    expect(sources[1]).not.toContain("M2M Trust Infrastructure");
  });

  it("keeps the existing branded cards scoped to their intended surfaces", () => {
    expect(read("app/layout.tsx")).toContain("/images/veklom-logo-m2m.jpg");
    expect(read("app/os/layout.tsx")).toContain("/og-capability-os.jpg");
  });

  it("publishes shield-derived icon sizes", () => {
    expect(pngDimensions("public/icon-192.png")).toEqual([192, 192]);
    expect(pngDimensions("public/icon-512.png")).toEqual([512, 512]);
    expect(pngDimensions("public/apple-touch-icon.png")).toEqual([180, 180]);
    expect(pngDimensions("public/favicon-32.png")).toEqual([32, 32]);
    expect(pngDimensions("public/favicon-48.png")).toEqual([48, 48]);
    expect(fs.existsSync(path.join(ROOT, "public/favicon.ico"))).toBe(true);
  });
});
