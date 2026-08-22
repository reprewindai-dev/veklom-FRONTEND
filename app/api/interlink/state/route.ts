import { NextResponse } from "next/server";
import { CAPI_RUNTIME_URL, capiAuthHeaderValue } from "@/lib/capi-runtime";

async function read(path: string): Promise<{ ok: boolean; data: Record<string, unknown> | null }> {
  const headers = new Headers({ accept: "application/json" });
  const key = capiAuthHeaderValue();
  if (key) headers.set("x-api-key", key);
  try {
    const response = await fetch(`${CAPI_RUNTIME_URL.replace(/\/+$/, "")}${path}`, { headers, cache: "no-store" });
    return { ok: response.ok, data: response.ok ? await response.json() as Record<string, unknown> : null };
  } catch {
    return { ok: false, data: null };
  }
}

export async function GET() {
  const [health, protocol, mcp] = await Promise.all([read("/health"), read("/protocol.json"), read("/api/mcp/servers")]);
  const live = health.ok && health.data?.status === "ok";
  return NextResponse.json({
    live,
    proof: live ? "VERIFIED_LIVE" : "UNVERIFIED",
    source: "capi.veklom.com",
    generated_at: new Date().toISOString(),
    health: health.data,
    protocol: protocol.data,
    openapi_servers: Array.isArray(mcp.data?.openapi_servers) ? mcp.data.openapi_servers : [],
    native_mcp_servers: Array.isArray(mcp.data?.native_mcp_servers) ? mcp.data.native_mcp_servers : [],
    total_tools: typeof mcp.data?.total_tools === "number" ? mcp.data.total_tools : null,
    routes: [
      { path: "/health", available: health.ok },
      { path: "/protocol.json", available: protocol.ok },
      { path: "/api/mcp/servers", available: mcp.ok },
    ],
  }, { headers: { "cache-control": "no-store" } });
}
