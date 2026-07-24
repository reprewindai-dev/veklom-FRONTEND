export type DependencyState = "healthy" | "unhealthy" | "unreachable" | "unconfigured";

export function dependencyHttpStatus(status: number): "healthy" | "unhealthy" {
  return status >= 200 && status < 300 ? "healthy" : "unhealthy";
}

export function summarizeDependencyStatuses(dependencies: Array<{ status: DependencyState }>) {
  const configured = dependencies.filter(({ status }) => status !== "unconfigured");
  const healthy = configured.length > 0 && configured.every(({ status }) => status === "healthy");

  if (healthy) return { status: "healthy" as const, httpStatus: 200 };
  if (configured.length === 0) return { status: "needs_proof" as const, httpStatus: 503 };
  return { status: "degraded" as const, httpStatus: 503 };
}
