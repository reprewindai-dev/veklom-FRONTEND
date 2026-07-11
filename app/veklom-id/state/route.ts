import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BYOS_API_BASE = process.env.BYOS_API_BASE_URL || "https://api.veklom.com";
const VEKLOM_ID_BASE = process.env.VEKLOM_ID_BASE_URL || "https://id.veklom.com";

type ProbeState = "verified" | "needs_proof" | "error";

interface ProbeResult {
  route: string;
  state: ProbeState;
  status: number;
  detail?: string;
  count?: number;
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function safeJson(value: string): any {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeError(data: any): string | undefined {
  if (!data) return undefined;
  if (typeof data === "string") return data.slice(0, 180);
  return String(data.detail || data.message || data.error || data.reason || "").slice(0, 180) || undefined;
}

async function probe(base: string, route = "", init?: RequestInit): Promise<ProbeResult> {
  const url = `${trimSlash(base)}${route}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json,text/html", ...(init?.headers || {}) },
      cache: "no-store",
      ...init,
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
      return {
        route: route || url,
        state: res.status === 401 || res.status === 403 ? "needs_proof" : "error",
        status: res.status,
        detail: normalizeError(data) || res.statusText,
      };
    }
    return {
      route: route || url,
      state: "verified",
      status: res.status,
      count: Array.isArray(data) ? data.length : undefined,
    };
  } catch (error) {
    return {
      route: route || url,
      state: "error",
      status: 0,
      detail: error instanceof Error ? error.message : "probe failed",
    };
  }
}

export async function GET() {
  const [idApp, identityMe, pglRegistry] = await Promise.all([
    probe(VEKLOM_ID_BASE),
    probe(BYOS_API_BASE, "/api/v1/identity/me"),
    probe(BYOS_API_BASE, "/api/v1/pgl/registry"),
  ]);
  const probes = [idApp, identityMe, pglRegistry];
  const hardFailures = probes.filter((item) => item.state === "error").length;
  const proofGaps = probes.filter((item) => item.state === "needs_proof").length;

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    source: {
      identity_app: trimSlash(VEKLOM_ID_BASE),
      byos: trimSlash(BYOS_API_BASE),
    },
    proof: {
      state: hardFailures > 0 ? "error" : proofGaps > 0 ? "partial" : "verified",
      reason:
        hardFailures > 0
          ? "One or more Veklom ID sources failed."
          : proofGaps > 0
            ? "Identity app and PGL registry are live; user identity requires authenticated proof."
            : "Veklom ID app, user identity, and PGL registry returned live data.",
      probes,
    },
    registryRows: pglRegistry.count ?? null,
  });
}
