import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// LockerPhycer owns the GitHub client secret, callback URL and token exchange,
// so it is the only service that can say whether GitHub sign-in is configured.
export async function GET() {
  const base = process.env.LOCKERPHYCER_URL || "http://lockerphycer-api:8092";
  try {
    const res = await fetch(`${base}/api/v1/auth/github/config-status`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const status = await res.json();
    return NextResponse.json({ configured: !!status.configured, missing: status.missing ?? [] });
  } catch {
    return NextResponse.json({ configured: false, missing: ["lockerphycer-unreachable"] });
  }
}
