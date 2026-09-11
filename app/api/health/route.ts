import { NextResponse } from "next/server";

// Note on Edge Runtime: In @opennextjs/cloudflare, the entire Next.js server function
// is compiled to run on Cloudflare Workers edge (workerd with nodejs_compat).
// Next.js 16 deprecated `export const runtime = "edge"` (https://nextjs.org/docs/messages/edge-runtime-deprecated)
// and @opennextjs/cloudflare explicitly requires omitting `runtime = "edge"` from source files
// (@opennextjs/cloudflare/dist/cli/commands/migrate.js:147).
// export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      ok: true,
      service: "veklom-frontend",
      edge: true,
      runtime: "edge",
      timestamp: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "production",
      circuit_breaker: {
        state: "CLOSED",
        failures: 0,
        threshold: 3,
        cooldown_seconds: 30,
      },
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

