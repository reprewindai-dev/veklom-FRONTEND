import { NextResponse } from "next/server";

const RETIRED_EXECUTION_RESPONSE = {
  error: "LEGACY_CAPI_EXECUTION_RETIRED",
  detail: "cAPI is a capability discovery/connection surface, not Veklom consequence authority. Consequential execution must enter through the CAPPO governed execution path with operation-specific authority.",
  canonical_path: "/api/cappo/v1/exec",
  truth_state: "FAILED",
};

/**
 * Legacy compatibility endpoint.
 *
 * This route previously injected server-side operator/credit/confidence headers
 * and forwarded browser requests into cAPI execution. That created a shadow
 * authority path outside the frozen Capability OS consequence boundary.
 *
 * Fail closed instead of preserving an ambiguous execution bypass.
 */
export async function POST() {
  return NextResponse.json(RETIRED_EXECUTION_RESPONSE, {
    status: 410,
    headers: { "cache-control": "no-store" },
  });
}

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "POST, OPTIONS",
      "Cache-Control": "no-store",
    },
  });
}
