import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  SEALED_BUNDLES,
  readSealedBundlePayloads,
  type SealedBundleStatus,
} from "../sealed-bundles";

describe("sealed bundle payload parsing", () => {
  it("isolates a truncated bundle from valid sibling bundles", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "veklom-sealed-bundles-"));
    const proofsDir = path.join(tempDir, "public", "proofs");
    const originalCwd = process.cwd;
    process.cwd = () => tempDir;

    try {
      await mkdir(proofsDir, { recursive: true });
      await Promise.all([
        writeFile(path.join(proofsDir, SEALED_BUNDLES[0].file), '{"truncated":', "utf8"),
        writeFile(path.join(proofsDir, SEALED_BUNDLES[1].file), '{"valid":true}', "utf8"),
        writeFile(path.join(proofsDir, SEALED_BUNDLES[2].file), '{"steps":[]}', "utf8"),
      ]);

      const bundles: SealedBundleStatus[] = await Promise.all(
        SEALED_BUNDLES.map(async ({ file, label, program }) => {
          const bytes = await readFile(path.join(proofsDir, file));
          return {
            file,
            label,
            program,
            url: `/proofs/${file}`,
            present: true,
            bytes: bytes.byteLength,
          };
        }),
      );
      const parsed = await readSealedBundlePayloads(bundles);

      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toMatchObject({ valid: false, error: "Bundle present but not valid JSON" });
      expect(parsed[1]).toMatchObject({ valid: true, payload: { valid: true } });
      expect(parsed[2]).toMatchObject({ valid: true, payload: { steps: [] } });
    } finally {
      process.cwd = originalCwd;
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
