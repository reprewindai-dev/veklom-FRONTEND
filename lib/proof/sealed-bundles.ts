import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const SEALED_BUNDLES = [
  {
    file: "bound_evidence_5982badd-7c48-4ea4-bbd8-79ccce295a2c.json",
    label: "Bound evidence A",
    program: "P2-HOST",
  },
  {
    file: "bound_evidence_5737342f-1504-44aa-93f4-3fcd38383c5a.json",
    label: "Bound evidence B",
    program: "P2-HOST",
  },
  {
    file: "mobility_p1_evidence_19579c43.json",
    label: "Mobility P1 evidence",
    program: "VDB-MOBILITY-P1",
  },
] as const;

export type SealedBundleStatus = {
  file: string;
  label: string;
  program: string;
  url: string;
  present: boolean;
  bytes?: number;
  sha256?: string;
};

function bundlePath(file: string) {
  return path.join(process.cwd(), "public", "proofs", file);
}

export async function readSealedBundles(): Promise<SealedBundleStatus[]> {
  return Promise.all(
    SEALED_BUNDLES.map(async ({ file, label, program }) => {
      const base = { file, label, program, url: `/proofs/${file}` };
      try {
        const bytes = await readFile(bundlePath(file));
        return {
          ...base,
          present: true,
          bytes: bytes.byteLength,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        return { ...base, present: false };
      }
    }),
  );
}

export async function readSealedBundlePayloads(
  bundles: SealedBundleStatus[],
): Promise<Array<{ bundle: SealedBundleStatus; payload: unknown }>> {
  return Promise.all(
    bundles.map(async (bundle) => ({
      bundle,
      payload: JSON.parse(await readFile(bundlePath(bundle.file), "utf8")) as unknown,
    })),
  );
}
