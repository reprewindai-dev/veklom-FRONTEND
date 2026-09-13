import { readSealedBundles } from "@/lib/proof/sealed-bundles";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ bundles: await readSealedBundles() });
}
