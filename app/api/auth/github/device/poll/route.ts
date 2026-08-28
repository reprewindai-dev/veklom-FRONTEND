import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID missing" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const device_code = body.device_code;
    
    if (!device_code) {
      return NextResponse.json({ error: "device_code required" }, { status: 400 });
    }

    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code"
      })
    });

    const data = await res.json();

    if (data.error) {
      const errType = data.error;
      let status = 400;
      
      if (errType === "authorization_pending") {
        status = 202;
      } else if (errType === "slow_down") {
        status = 429;
      } else if (errType === "access_denied") {
        status = 403;
      } else if (errType === "expired_token" || errType === "incorrect_device_code") {
        status = 400;
      }

      return NextResponse.json({ error: errType, error_description: data.error_description }, { status });
    }

    // Success - we have the token
    const accessToken = data.access_token;
    
    // Fetch user
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/json",
        "User-Agent": "Veklom-M2M-App"
      }
    });

    let githubUsername = "unknown";
    if (userRes.ok) {
      const userData = await userRes.json();
      githubUsername = userData.login;
    }

    return NextResponse.json({
      success: true,
      message: "Linked to Veklom workspace once approved",
      github_username: githubUsername,
      session_granted: true
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
