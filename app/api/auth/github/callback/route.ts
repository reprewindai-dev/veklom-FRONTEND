import { NextRequest, NextResponse } from "next/server";

// We use the Next.js API route as a proxy to the core backend to keep
// secrets out of the edge and centralized in BYOS backend, or we process
// the OAuth exchange directly here and set the cookie. For Veklom, the 
// standard pattern is passing the code to BYOS backend and receiving a JWT.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veklom.com";
  
  // Parse state to get returnTo
  let returnTo = "/os";
  if (state) {
    try {
      const decodedState = JSON.parse(Buffer.from(state, "base64url").toString("utf-8"));
      if (decodedState.returnTo && decodedState.returnTo.startsWith("/")) {
        returnTo = decodedState.returnTo;
      }
    } catch (e) {
      console.warn("Failed to parse state param:", e);
    }
  }

  if (error) {
    console.error(`GitHub OAuth error: ${error} - ${errorDescription}`);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, baseUrl));
  }

  if (!code) {
    return NextResponse.redirect(new URL(`/login?error=No+code+provided`, baseUrl));
  }

  try {
    // 1. Exchange code for access token via GitHub API directly
    const clientId = process.env.GITHUB_AUTH_CLIENT_ID;
    const clientSecret = process.env.GITHUB_AUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing GitHub client credentials in environment");
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      throw new Error(`GitHub token exchange failed: ${tokenRes.status}`);
    }

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(`GitHub token error: ${tokenData.error_description}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Pass the GitHub access token to the core backend to handle linking/creation
    // This maintains the boundary: core backend owns the database and issues JWTs.
    const byosApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.veklom.com";
    
    // Using unauthenticated fetch since this is the login flow
    const backendRes = await fetch(`${byosApiUrl}/api/v1/auth/github/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        access_token: accessToken
      }),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      console.error("Backend auth failed:", errText);
      return NextResponse.redirect(new URL(`/login?error=Authentication+failed`, baseUrl));
    }

    const authData = await backendRes.json();
    const jwt = authData.access_token || authData.token;

    if (!jwt) {
      throw new Error("No JWT returned from backend");
    }

    // 3. Set the JWT in a cookie and redirect to the requested page
    const response = NextResponse.redirect(new URL(returnTo, baseUrl));
    
    response.cookies.set({
      name: "veklom_session",
      value: jwt,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (err: any) {
    console.error("OAuth callback processing error:", err);
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(err.message || "Unknown error")}`, baseUrl));
  }
}
