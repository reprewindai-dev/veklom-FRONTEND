import { NextResponse } from "next/server";
import { CAPPO_BACKEND_URL } from "@/lib/capi-runtime";
import { publicMachineSpec } from "@/lib/machine-openapi";

export const dynamic = "force-dynamic";

// Serves only the publicly reachable part of the authority layer's API. The full internal
// spec is never forwarded (it lists admin, licence and test routes no public caller can reach).
export async function GET() {
  if (!CAPPO_BACKEND_URL) {
    return NextResponse.json({ error: "authority layer is not configured" }, { status: 503 });
  }
  try {
    const upstream = await fetch(`${CAPPO_BACKEND_URL}/openapi.json`, { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json({ error: "authority layer spec unavailable" }, { status: 502 });
    }
    const spec = (await upstream.json()) as Record<string, unknown>;
    return NextResponse.json(publicMachineSpec(spec), { headers: { "cache-control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "authority layer spec unavailable" }, { status: 502 });
  }
}
