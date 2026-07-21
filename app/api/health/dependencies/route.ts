import { NextResponse } from "next/server";

type Dependency = {
  name: string;
  url: string | undefined;
};

async function checkDependency(dependency: Dependency) {
  if (!dependency.url) {
    return { name: dependency.name, status: "unconfigured" as const };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3_000);
  const url = `${dependency.url.replace(/\/+$/, "")}/health`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    return {
      name: dependency.name,
      status: response.ok ? ("healthy" as const) : ("unhealthy" as const),
      http_status: response.status,
    };
  } catch {
    return { name: dependency.name, status: "unreachable" as const };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const dependencies = await Promise.all([
    checkDependency({ name: "byos", url: process.env.BACKEND_URL }),
    checkDependency({ name: "capi", url: process.env.CAPI_BACKEND_URL || process.env.INTERLINK_CAPI_URL }),
    checkDependency({ name: "gnomledger", url: process.env.GNOMLEDGER_URL }),
    checkDependency({ name: "lockerphycer", url: process.env.LOCKERPHYCER_URL }),
    checkDependency({ name: "abide", url: process.env.ABIDE_URL }),
  ]);

  const configured = dependencies.filter((dependency) => dependency.status !== "unconfigured");
  const healthy = configured.filter((dependency) => dependency.status === "healthy");
  const status = configured.length > 0 && healthy.length === configured.length
    ? "healthy"
    : "degraded";

  return NextResponse.json({
    status,
    dependencies,
    checked_at: new Date().toISOString(),
  }, { headers: { "cache-control": "no-store" } });
}
