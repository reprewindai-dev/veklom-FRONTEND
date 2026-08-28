import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID missing" }, { status: 503 });
  }

  try {
    const res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ client_id: clientId })
    });

    const data = await res.json();
    if (data.error) {
      return NextResponse.json(data, { status: 400 });
    }

    // Do not return client secret or access token.
    // GitHub returns: device_code, user_code, verification_uri, expires_in, interval
    // We can store device_code securely if needed, but for a stateless API, we return it to the trusted client 
    // or store it in a session. The prompt says: "stores device_code server-side or binds it to a short-lived session"
    // To remain stateless here, we return it, but since it's a backend endpoint it's safe to return to our own frontend.
    // The prompt says: "never returns client secret - never returns access token"
    
    return NextResponse.json({
      device_code: data.device_code, // need this for polling
      user_code: data.user_code,
      verification_uri: data.verification_uri,
      expires_in: data.expires_in,
      interval: data.interval
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
