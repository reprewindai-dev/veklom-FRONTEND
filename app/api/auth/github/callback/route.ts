import { NextRequest, NextResponse } from "next/server";
import {
  githubOAuthStateMatches,
  parseGitHubOAuthState,
} from "@/lib/github-oauth-state";

const OAUTH_STATE_COOKIE = "veklom_github_oauth_state";

function redirectWithClearedState(url: URL): NextResponse {
  const response = NextResponse.redirect(url);
  response.cookies.set({
    name: OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/api/auth/github",
    maxAge: 0,
  });
  return response;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const rawState = searchParams.get("state");
  const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://veklom.com";

  // Compare the exact opaque state returned by GitHub with the complete state
  // stored in the HttpOnly browser cookie before decoding any field. This binds
  // the nonce and redirect intent together; changing returnTo while preserving
  // the nonce is therefore rejected.
  if (!githubOAuthStateMatches(stateCookie, rawState)) {
    return redirectWithClearedState(
      new URL("/login?error=Invalid+OAuth+state", baseUrl),
    );
  }

  const state = parseGitHubOAuthState(rawState);
  if (!state) {
    return redirectWithClearedState(
      new URL("/login?error=Invalid+OAuth+state", baseUrl),
    );
  }

  const returnTo = state.returnTo;
  const oauthError = searchParams.get("error");
  if (oauthError) {
    console.warn("GitHub OAuth authorization failed");
    return redirectWithClearedState(
      new URL("/login?error=GitHub+authentication+failed", baseUrl),
    );
  }

  if (!code) {
    return redirectWithClearedState(
      new URL("/login?error=GitHub+authentication+failed", baseUrl),
    );
  }

  try {
    const clientId = process.env.GITHUB_AUTH_CLIENT_ID;
    const clientSecret = process.env.GITHUB_AUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("GitHub OAuth server credentials are not configured");
      return redirectWithClearedState(
        new URL("/login?error=Authentication+unavailable", baseUrl),
      );
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
      redirect: "error",
    });

    if (!tokenRes.ok) {
      console.error(`GitHub token exchange failed with status ${tokenRes.status}`);
      return redirectWithClearedState(
        new URL("/login?error=Authentication+failed", baseUrl),
      );
    }

    const tokenData = (await tokenRes.json()) as Record<string, unknown>;
    const accessToken =
      typeof tokenData.access_token === "string" ? tokenData.access_token : null;
    if (!accessToken) {
      console.error("GitHub token exchange returned no access token");
      return redirectWithClearedState(
        new URL("/login?error=Authentication+failed", baseUrl),
      );
    }

    const byosApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.veklom.com";
    const backendRes = await fetch(`${byosApiUrl}/api/v1/auth/github/callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: accessToken }),
      redirect: "error",
    });

    if (!backendRes.ok) {
      console.error(`Backend auth failed with status ${backendRes.status}`);
      return redirectWithClearedState(
        new URL("/login?error=Authentication+failed", baseUrl),
      );
    }

    const authData = (await backendRes.json()) as Record<string, unknown>;
    const jwt =
      typeof authData.access_token === "string"
        ? authData.access_token
        : typeof authData.token === "string"
          ? authData.token
          : null;

    if (!jwt) {
      console.error("Backend auth response returned no session token");
      return redirectWithClearedState(
        new URL("/login?error=Authentication+failed", baseUrl),
      );
    }

    const response = redirectWithClearedState(new URL(returnTo, baseUrl));
    response.cookies.set({
      name: "veklom_session",
      value: jwt,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch {
    console.error("OAuth callback processing failed");
    return redirectWithClearedState(
      new URL("/login?error=Authentication+failed", baseUrl),
    );
  }
}
