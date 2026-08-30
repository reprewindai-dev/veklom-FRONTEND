import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.CAPPO_BACKEND_URL ?? "http://127.0.0.1:8002";
  const workspaceToken = process.env.CAPPO_WORKSPACE_JWT;
  if (!workspaceToken) {
    return NextResponse.json(
      { error: "CAPPO_WORKSPACE_JWT is not configured on the server" },
      { status: 503 },
    );
  }
  const response = await fetch(`${baseUrl}/api/v1/n8n/executions/latest`, {
    headers: { Authorization: `Bearer ${workspaceToken}` },
    cache: "no-store",
  });
  return NextResponse.json(await response.json(), { status: response.status });
}
