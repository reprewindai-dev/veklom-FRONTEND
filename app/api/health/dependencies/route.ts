import { NextResponse } from "next/server";
import { dependencyHttpStatus, summarizeDependencyStatuses } from "@/lib/dependency-status";

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
      status: dependencyHttpStatus(response.status),
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

  const summary = summarizeDependencyStatuses(dependencies);

  return NextResponse.json({
    status: summary.status,
    dependencies,
    checked_at: new Date().toISOString(),
  }, { status: summary.httpStatus, headers: { "cache-control": "no-store" } });
}
