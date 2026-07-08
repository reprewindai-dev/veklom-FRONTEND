import { NextResponse } from "next/server";

const API_BASE = process.env.VBB_BACKEND_URL || process.env.BACKEND_URL || "https://api.veklom.com";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/vnp/metrics`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream metrics unavailable", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
