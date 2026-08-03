import { NextResponse } from "next/server";

// Server-side reader for the authenticated BYOS uptime window.
// `GET /api/v1/platform/uptime` returns 401 anonymously, so the credential is
// only ever held server-side and NEVER sent to the browser. If no credential is
// configured (or the upstream rejects it) we return an explicit unavailable
// state so the UI can render `Needs proof` instead of fabricating an SLA.

const API_BASE =
  process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";

// Optional server-only credential. Never prefix with NEXT_PUBLIC_.
const UPTIME_TOKEN =
  process.env.VBB_UPTIME_TOKEN || process.env.VBB_SERVICE_TOKEN || "";

const SOURCE = "GET /api/v1/platform/uptime";

export async function GET() {
  if (!UPTIME_TOKEN) {
    return NextResponse.json({
      available: false,
      source: SOURCE,
      reason:
        "Authenticated source (401 anonymously). No server-side credential configured, so no public-safe uptime evidence is available.",
    });
  }

  try {
    const res = await fetch(`${API_BASE.replace(/\/+$/, "")}/api/v1/platform/uptime`, {
      headers: { Authorization: `Bearer ${UPTIME_TOKEN}`, Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        available: false,
        source: SOURCE,
        reason: `Upstream uptime endpoint returned HTTP ${res.status}.`,
      });
    }

    const data = await res.json();
    return NextResponse.json({ available: true, source: SOURCE, data });
  } catch {
    return NextResponse.json({
      available: false,
      source: SOURCE,
      reason: "Upstream uptime request failed (network or upstream error).",
    });
  }
}
