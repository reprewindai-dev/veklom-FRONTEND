import { dependencyHttpStatus, summarizeDependencyStatuses } from "@/lib/dependency-status";

describe("dependency monitoring status", () => {
  it("does not report healthy when dependencies are missing or degraded", () => {
    expect(summarizeDependencyStatuses([])).toEqual({ status: "needs_proof", httpStatus: 503 });
    expect(summarizeDependencyStatuses([{ status: "unconfigured" }])).toEqual({ status: "needs_proof", httpStatus: 503 });
    expect(summarizeDependencyStatuses([{ status: "healthy" }, { status: "unreachable" }])).toEqual({ status: "degraded", httpStatus: 503 });
    expect(summarizeDependencyStatuses([{ status: "healthy" }])).toEqual({ status: "healthy", httpStatus: 200 });
  });

  it("maps an upstream HTTP result to an honest dependency state", () => {
    expect(dependencyHttpStatus(200)).toBe("healthy");
    expect(dependencyHttpStatus(503)).toBe("unhealthy");
  });
});
