import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const githubError = params.get("error");
  if (githubError) {
    const login = new URL("/login", req.url);
    login.searchParams.set("github_error", githubError);
    const description = params.get("error_description");
    if (description) login.searchParams.set("github_error_description", description.slice(0, 240));
    return NextResponse.redirect(login);
  }

  const backendCallback = new URL("/api/v1/auth/github/callback", req.url);
  for (const key of ["code", "state", "installation_id", "setup_action"]) {
    const value = params.get(key);
    if (value) backendCallback.searchParams.set(key, value);
  }

  // BYOS validates its own signed OAuth state, exchanges the code, binds the
  // GitHub identity to a Veklom user/workspace, creates the server-side Session,
  // sets HttpOnly access/refresh cookies and performs the final safe redirect.
  return NextResponse.redirect(backendCallback);
}
