import { NextRequest, NextResponse } from "next/server";

function unavailableResponse() {
  const response = NextResponse.json(
    {
      error: "GitHub sign-in is temporarily unavailable until backend session issuance is configured",
      status: "NOT_VERIFIED",
    },
    { status: 503 },
  );
  response.cookies.delete("github_oauth_state");
  return response;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const installationId = searchParams.get("installation_id");
  if (installationId) {
    return NextResponse.redirect(
      new URL(
        `/os?installation_success=true&installation_id=${encodeURIComponent(installationId)}`,
        req.url,
      ),
    );
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "Missing GitHub OAuth code" }, { status: 400 });
  }

  const cookieState = req.cookies.get("github_oauth_state")?.value;
  if (!state || !cookieState || state !== cookieState) {
    return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
  }

  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    const next = decoded?.next;
    if (
      typeof next !== "string" ||
      !next.startsWith("/") ||
      next.startsWith("//") ||
      next.includes("\\")
    ) {
      return NextResponse.json({ error: "Invalid OAuth return path" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid OAuth state payload" }, { status: 400 });
  }

  // Security boundary: the Portal must not mint local identity/session authority.
  // BYOS is the canonical authentication backend and already exposes the OAuth
  // contract. Until this callback is wired to backend-issued session authority,
  // fail closed rather than creating an unsigned pseudo-session from GitHub data.
  return unavailableResponse();
}
