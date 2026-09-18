import { NextResponse } from"next/server";
import { dependencyHttpStatus, summarizeDependencyStatuses } from"@/lib/dependency-status";
import { runtimeDependencies, type RuntimeDependency } from"@/lib/runtime-dependencies";

async function checkDependency(dependency: RuntimeDependency) {
 if (!dependency.url) {
 return { name: dependency.name, status:"unconfigured" as const };
 }

 const controller = new AbortController();
 const timeout = setTimeout(() => controller.abort(), 3_000);
 const url = `${dependency.url.replace(/\/+$/,"")}${dependency.healthPath || "/health"}`;

 try {
 const response = await fetch(url, {
 method:"GET",
 cache:"no-store",
 signal: controller.signal,
 });
 return {
 name: dependency.name,
 status: dependencyHttpStatus(response.status),
 http_status: response.status,
 };
 } catch {
 return { name: dependency.name, status:"unreachable" as const };
 } finally {
 clearTimeout(timeout);
 }
}

export async function GET() {
 const dependencies = await Promise.all(runtimeDependencies().map(checkDependency));

 const summary = summarizeDependencyStatuses(dependencies);

 return NextResponse.json({
 status: summary.status,
 dependencies,
 checked_at: new Date().toISOString(),
 }, { status: summary.httpStatus, headers: {"cache-control":"no-store" } });
}
