import { NextRequest, NextResponse } from "next/server";

const PUBLIC_APP_ORIGIN = "https://veklom.com";

function publicAppUrl(path: string, req: NextRequest): URL {
  const requestUrl = new URL(req.url);
  const forwardedHost = req.headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim().toLowerCase();

  // Next can see its private container address (for example, 0.0.0.0:3002)
  // behind the public ingress. Only accept the known public host; never build
  // an OAuth redirect from an arbitrary Host/forwarded-host value.
  if (forwardedHost === "veklom.com" || forwardedHost === "www.veklom.com") {
    return new URL(path, PUBLIC_APP_ORIGIN);
  }

  // Preserve local development without allowing a private/container address
  // to escape into the browser-facing OAuth redirect.
  if (requestUrl.hostname === "localhost" || requestUrl.hostname === "127.0.0.1") {
    return new URL(path, requestUrl.origin);
  }

  return new URL(path, PUBLIC_APP_ORIGIN);
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const githubError = params.get("error");
  if (githubError) {
    const login = publicAppUrl("/login", req);
    login.searchParams.set("github_error", githubError);
    const description = params.get("error_description");
    if (description) login.searchParams.set("github_error_description", description.slice(0, 240));
    return NextResponse.redirect(login);
  }

  const backendCallback = publicAppUrl("/api/v1/auth/github/callback", req);
  for (const key of ["code", "state", "installation_id", "setup_action"]) {
    const value = params.get(key);
    if (value) backendCallback.searchParams.set(key, value);
  }

  // BYOS validates its own signed OAuth state, exchanges the code, binds the
  // GitHub identity to a Veklom user/workspace, creates the server-side Session,
  // sets HttpOnly access/refresh cookies and performs the final safe redirect.
  return NextResponse.redirect(backendCallback);
}
