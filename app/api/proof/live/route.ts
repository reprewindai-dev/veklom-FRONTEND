import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ServiceSpec = {
  id: string;
  label: string;
  role: string;
  url: string;
};

function join(base: string, path: string) {
  return `${base.replace(/\/$/, "")}${path}`;
}

async function probe(service: ServiceSpec) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(service.url, {
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
      id: service.id,
      label: service.label,
      role: service.role,
      endpoint: service.url,
      reachable: true,
      healthy: response.ok,
      status: response.status,
      latencyMs: elapsed,
      payload,
    };
  } catch (error) {
    return {
      id: service.id,
      label: service.label,
      role: service.role,
      endpoint: service.url,
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

export async function GET() {
  const byos = process.env.BACKEND_URL || process.env.VEKLOM_BACKEND_URL || "https://api.veklom.com";
  const lockerphycer = process.env.LOCKERPHYCER_URL || "http://host.docker.internal:8092";
  const capi = process.env.CAPI_URL || "https://capi.veklom.com";
  const cappo = process.env.CAPPO_URL || "https://cappo.veklom.com";
  const pgl = process.env.PGL_URL || "https://pgl.veklom.com";

  const services: ServiceSpec[] = [
    {
      id: "byos",
      label: "BYOS Runtime",
      role: "Tenant / workspace execution substrate",
      url: join(byos, "/ready"),
    },
    {
      id: "lockerphycer",
      label: "LockerPhycer",
      role: "Governed security, key, identity and execution-host boundary",
      url: join(lockerphycer, "/health"),
    },
    {
      id: "cappo",
      label: "CAPPO",
      role: "Consequence authorization boundary",
      url: join(cappo, "/health"),
    },
    {
      id: "capi",
      label: "cAPI",
      role: "Cross-service connection layer",
      url: join(capi, "/health"),
    },
    {
      id: "pgl",
      label: "Gnomledger / PGL",
      role: "Durable evidence and provenance",
      url: join(pgl, "/health"),
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
