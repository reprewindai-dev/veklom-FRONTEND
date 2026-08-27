import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const OAUTH_STATE_COOKIE = "veklom_github_oauth_state";
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

function safeReturnTo(value: string | null): string {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return "/os";
  }

  try {
    const base = new URL("https://veklom.invalid");
    const resolved = new URL(value, base);
    if (resolved.origin !== base.origin) return "/os";
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return "/os";
  }
}

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
  const returnTo = safeReturnTo(searchParams.get("returnTo"));

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

  const nonce = randomBytes(32).toString("base64url");
  const state = Buffer.from(
    JSON.stringify({ nonce, returnTo }),
    "utf-8",
  ).toString("base64url");

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
