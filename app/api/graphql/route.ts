import { NextRequest, NextResponse } from "next/server";
import { capabilities } from "@/lib/cos/capabilities";

/**
 * Machine-readable view of the Capability OS catalog (/api/graphql).
 *
 * This route answers only from data the control plane itself holds: the catalog of governed
 * computes in lib/cos/capabilities. It does not resolve audit trails, receipts, ledger proofs
 * or compliance findings. Those are served by the authority layer and the ledger
 * (CAPPO /v1/executions/{id}, PGL via /api/pgl) and read by the Evidence page from their
 * answers; this route never assembles or asserts one. Fields it does not serve return a
 * GraphQL error naming where the data lives, never a fabricated record.
 */

interface GraphQLRequest {
  query?: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

const NOT_SERVED: Record<string, string> = {
  auditTrail: "auditTrail is not served by the control plane. Read the execution from CAPPO (GET /api/cappo/v1/executions/{execution_id}) and its ledger event from PGL (GET /api/pgl/...); the Evidence page shows both as returned.",
  systemHealth: "systemHealth is not served here. Each service answers its own /health; see /api/control-node/canonical-backends for the registry.",
  compliance: "Compliance findings are not served by Veklom. No certification or regulatory conformance is asserted by this API.",
};

function resolve(query: string): { data: Record<string, unknown>; errors: { message: string; path: string[] }[] } {
  const data: Record<string, unknown> = {};
  const errors: { message: string; path: string[] }[] = [];

  if (query.includes("governedComputes")) {
    data.governedComputes = capabilities.map((c) => ({
      id: c.id,
      name: c.name,
      lifecycleStage: c.lifecycleStage,
      kind: c.kind,
      route: c.route,
      method: c.method,
      mountState: c.mountState,
      proofState: c.evidence.proofState,
      pglRequired: c.evidence.pglRequired,
    }));
  }

  for (const [field, message] of Object.entries(NOT_SERVED)) {
    if (query.includes(field)) errors.push({ message, path: [field] });
  }

  if (!Object.keys(data).length && !errors.length) {
    errors.push({ message: "Unknown query. This endpoint serves governedComputes only.", path: [] });
  }
  return { data, errors };
}

export async function POST(req: NextRequest) {
  let body: GraphQLRequest;
  try {
    body = (await req.json()) as GraphQLRequest;
  } catch {
    return NextResponse.json({ errors: [{ message: "Body must be JSON with a query string." }] }, { status: 400 });
  }
  const { data, errors } = resolve(body.query || "");
  return NextResponse.json(errors.length ? { data, errors } : { data });
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query") || "";
  if (!query) {
    return NextResponse.json({
      endpoint: "/api/graphql",
      serves: ["governedComputes"],
      note: "Audit trails, receipts, ledger proofs and compliance findings are not served here; see the errors returned for those fields.",
    });
  }
  const { data, errors } = resolve(query);
  return NextResponse.json(errors.length ? { data, errors } : { data });
}
