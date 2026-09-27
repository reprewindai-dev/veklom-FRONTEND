import { NextRequest, NextResponse } from "next/server";
import { safePublicOrigin } from "@/lib/auth-origin";

function safeReturnTo(value: string | null): string {
  if (!value) return "/os";
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return "/os";
  return value;
}

export async function GET(req: NextRequest) {
  // BYOS is the canonical authentication backend. It owns OAuth state signing,
  // GitHub token exchange, user/workspace binding and session issuance.
  // The frontend only provides a stable same-origin entry point.
  const next = safeReturnTo(req.nextUrl.searchParams.get("next"));
  const backendLogin = new URL("/api/v1/auth/github/login", safePublicOrigin(req.headers));
  backendLogin.searchParams.set("next", next);
  return NextResponse.redirect(backendLogin);
}
