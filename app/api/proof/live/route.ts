import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ServiceSpec = {
  id: string;
  label: string;
  role: string;
  url: string;
  fallbackUrl: string;
};

function join(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path}`;
}

async function probeSingle(url: string, id: string, label: string, role: string) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json, text/plain;q=0.9, */*;q=0.5" },
      cache: "no-store",
      signal: controller.signal,
    });
    const elapsed = Math.max(1, Math.round(performance.now() - started));
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      if (contentType.includes("json")) {
        try { payload = JSON.parse(text); } catch { payload = { raw: text.slice(0, 240) }; }
      } else {
        payload = { raw: text.slice(0, 240) };
      }
    }

    return {
      id,
      label,
      role,
      endpoint: url,
      reachable: true,
      healthy: response.ok,
      status: response.status,
      latencyMs: elapsed,
      payload,
    };
  } catch (error) {
    return {
      id,
      label,
      role,
      endpoint: url,
      reachable: false,
      healthy: false,
      status: null,
      latencyMs: Math.max(1, Math.round(performance.now() - started)),
      error: error instanceof Error ? error.name : "probe_failed",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function probe(service: ServiceSpec) {
  let result = await probeSingle(service.url, service.id, service.label, service.role);
  if (!result.reachable && service.fallbackUrl && service.fallbackUrl !== service.url) {
    const fallbackResult = await probeSingle(service.fallbackUrl, service.id, service.label, service.role);
    if (fallbackResult.reachable) {
      result = fallbackResult;
    }
  }

  // Canonical Truth Boundary for GnomLedger (PGL) per Issue #16
  // Port 8001 health (200 OK) is OBSERVED; cAPI registration remains NOT_VERIFIED.
  // Step 5 (evidence) must NOT be marked proven based on GnomLedger health.
  if (service.id === "pgl") {
    return {
      ...result,
      registration: "NOT_VERIFIED",
      truthStatus: result.healthy ? "OBSERVED" : "UNAVAILABLE",
      evidenceBoundary: "NOT_INDEPENDENTLY_PROVEN",
      attested: false,
      truthBoundaryNote: "GnomLedger port 8001 health is OBSERVED; cAPI registration remains NOT_VERIFIED per Issue #16. Step 5 (evidence) is not proven based on health.",
    };
  }

  return result;
}

export async function GET() {
  const lockerphycerUrl = process.env.LOCKERPHYCER_URL || "http://host.docker.internal:8092";
  const cappoUrl = process.env.CAPPO_BACKEND_URL || process.env.CAPPO_URL || "http://host.docker.internal:8002";
  const capiUrl = process.env.CAPI_URL || "http://host.docker.internal:3003";
  const pglUrl = process.env.PGL_URL || "http://host.docker.internal:8001";

  const services: ServiceSpec[] = [
    {
      id: "lockerphycer",
      label: "LockerPhycer",
      role: "Governed security, key, identity and execution-host boundary",
      url: join(lockerphycerUrl, "/health"),
      fallbackUrl: "http://localhost:8092/health",
    },
    {
      id: "cappo",
      label: "CAPPO",
      role: "Consequence authorization boundary",
      url: join(cappoUrl, "/health"),
      fallbackUrl: "http://localhost:8002/health",
    },
    {
      id: "capi",
      label: "cAPI",
      role: "Cross-service connection layer",
      url: join(capiUrl, "/health"),
      fallbackUrl: "http://localhost:3003/health",
    },
    {
      id: "pgl",
      label: "Gnomledger / PGL",
      role: "Durable evidence and provenance",
      url: join(pglUrl, "/health"),
      fallbackUrl: "http://localhost:8001/health",
    },
  ];

  const results = await Promise.all(services.map(probe));
  const healthy = results.filter((item) => item.healthy).length;

  return NextResponse.json(
    {
      source: "LIVE_BACKEND_PROBES",
      synthetic: false,
      observedAt: new Date().toISOString(),
      summary: {
        healthy,
        total: results.length,
        state: healthy === results.length ? "HEALTHY" : healthy === 0 ? "UNAVAILABLE" : "DEGRADED",
      },
      services: results,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Veklom-Proof-Source": "live-backend-probes",
      },
    },
  );
}
