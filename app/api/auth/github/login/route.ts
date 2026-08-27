import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

/**
 * GET /api/auth/github/login
 *
 * Initiates GitHub OAuth flow using App ID 4129720 (Veklom Capability OS Login).
 * Redirects the user's browser to GitHub's authorization endpoint.
 * The `returnTo` query param is passed through `state` so the callback
 * can redirect the user back to the right page after auth.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") ?? "/os";

  const clientId = process.env.GITHUB_AUTH_CLIENT_ID;
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: "GitHub auth not configured (GITHUB_AUTH_CLIENT_ID missing)" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const callbackUrl =
    process.env.GITHUB_AUTH_CALLBACK_URL ??
    `${process.env.NEXT_PUBLIC_APP_URL ?? "https://veklom.com"}/api/auth/github/callback`;

  // Encode returnTo in state so callback can use it safely
  const state = Buffer.from(JSON.stringify({ returnTo })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: "read:user user:email",
    state,
  });

  redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
