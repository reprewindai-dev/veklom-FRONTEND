import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

describe("VNP measurement absence contract", () => {
  it("surfaces missing measurements instead of swallowing a 404", () => {
    const harness = read("components/cos/MeasureHarness.tsx");

    expect(harness).not.toContain("status !== 404");
    expect(harness).toContain("No VNP measurement exists for execution");
  });
});
