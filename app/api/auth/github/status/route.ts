import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;

  const configured = !!(clientId && clientSecret && callbackUrl);
  const missing: string[] = [];
  if (!clientId) missing.push("GITHUB_CLIENT_ID");
  if (!clientSecret) missing.push("GITHUB_CLIENT_SECRET");
  if (!callbackUrl) missing.push("GITHUB_CALLBACK_URL");

  return NextResponse.json({ configured, missing });
}
