import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_CALLBACK_URL || "https://veklom.com/api/auth/github/callback";
  
  if (!clientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID missing" }, { status: 503 });
  }

  // Cryptographically random state
  const state = crypto.randomUUID();
  
  // ReturnTo
  const searchParams = req.nextUrl.searchParams;
  const next = searchParams.get("next") || "/os";
  
  const statePayload = JSON.stringify({ r: state, next });
  const encodedState = Buffer.from(statePayload).toString('base64');

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("state", encodedState);
  
  // Scopes (empty for default installation scope, or add specific ones)
  
  const response = NextResponse.redirect(githubAuthUrl.toString());
  
  // Store state in HTTP-only cookie
  response.cookies.set({
    name: "github_oauth_state",
    value: encodedState,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60, // 10 mins
  });

  return response;
}
