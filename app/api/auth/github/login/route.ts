import { NextRequest, NextResponse } from "next/server";
import { createGitHubOAuthState } from "@/lib/github-oauth-state";

const OAUTH_STATE_COOKIE = "veklom_github_oauth_state";
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

/**
 * GET /api/auth/github/login
 *
 * Starts GitHub OAuth with a short-lived, browser-bound state payload. The
 * caller-supplied return path is constrained to a same-origin application path
 * before the complete state value is stored in an HttpOnly cookie and sent to
 * GitHub. The callback must compare those complete values before parsing state.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const clientId = process.env.GITHUB_AUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "GitHub auth not configured" },
      { status: 503 },
    );
  }

  const callbackUrl =
    process.env.GITHUB_AUTH_CALLBACK_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "https://veklom.com"}/api/auth/github/callback`;

  const state = createGitHubOAuthState(searchParams.get("returnTo"));
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "read:user user:email",
    state,
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`,
  );
  response.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/github",
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
