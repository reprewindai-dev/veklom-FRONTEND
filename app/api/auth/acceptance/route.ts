import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip_address = req.headers.get("x-forwarded-for") || req.ip || "127.0.0.1";
    const user_agent = req.headers.get("user-agent") || "unknown";
    
    // Enrich payload
    const payload = {
      ...body,
      ip_address,
      user_agent,
      accepted_at: new Date().toISOString(),
      documents: [
        { document_type: "terms", document_version: "2026-08-28", document_url: "https://veklom.com/terms" },
        { document_type: "privacy", document_version: "2026-08-28", document_url: "https://veklom.com/privacy" },
        { document_type: "acceptable_use", document_version: "2026-08-28", document_url: "https://veklom.com/acceptable-use" },
        { document_type: "github_boundary", document_version: "2026-08-28", document_url: "https://veklom.com/docs" },
        { document_type: "device_flow", document_version: "2026-08-28", document_url: "https://veklom.com/docs" }
      ]
    };

    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8088";
    
    // Send to backend
    const backendRes = await fetch(`${backendUrl}/api/auth/acceptance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!backendRes.ok) {
      throw new Error(`Backend returned ${backendRes.status}`);
    }

    return NextResponse.json({ success: true, recorded: true });
  } catch (error) {
    console.error("Acceptance error", error);
    return NextResponse.json({ success: false, error: "Failed to record acceptance" }, { status: 500 });
  }
}
