import { NextRequest, NextResponse } from "next/server";
import { walletRuntimeConfigFromEnv } from "@/lib/wallet/runtime-config";

export const dynamic = "force-dynamic";

// Public, non-secret wallet configuration (project ids are client-side values by
// design). Read at request time so keys can be set on the container.
export async function GET(req: NextRequest) {
  const config = walletRuntimeConfigFromEnv(
    process.env as Record<string, string | undefined>,
    req.headers.get("cf-ipcountry"),
  );
  return NextResponse.json(config, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
