import { NextRequest, NextResponse } from "next/server";

function safeReturnTo(value: string | null): string {
  if (!value) return "/os";
  if (!value.startsWith("/")) return "/os";
  if (value.startsWith("//") || value.includes("\\")) return "/os";
  return value;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri =
    process.env.GITHUB_CALLBACK_URL ||
    "https://veklom.com/api/auth/github/callback";

  if (!clientId) {
    return NextResponse.json({ error: "GITHUB_CLIENT_ID missing" }, { status: 503 });
  }

  const nonce = crypto.randomUUID();
  const next = safeReturnTo(req.nextUrl.searchParams.get("next"));
  const statePayload = JSON.stringify({ r: nonce, next });
  const encodedState = Buffer.from(statePayload).toString("base64url");

  const githubAuthUrl = new URL("https://github.com/login/oauth/authorize");
  githubAuthUrl.searchParams.set("client_id", clientId);
  githubAuthUrl.searchParams.set("redirect_uri", redirectUri);
  githubAuthUrl.searchParams.set("state", encodedState);

  const response = NextResponse.redirect(githubAuthUrl.toString());
  response.cookies.set({
    name: "github_oauth_state",
    value: encodedState,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return response;
}
