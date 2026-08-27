import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
export function GET() {
  return NextResponse.json({
    name: 'Veklom',
    product: 'Capability OS',
    version: '1.0.0',
    description: 'Governed machine action platform',
    canonical_tag: 'veklom-p5-closure-v1',
    canonical_sha: 'b48007614bee92d1caacc628d96fe9a786e8cd47',
    canonical_repo: 'github.com/reprewindai-dev/cappo-backend',
    endpoints: {
      manifest: '/api/machine/manifest.json',
      claims: '/api/machine/claims.json',
      conformance: '/api/machine/conformance.json',
      evidence_index: '/api/machine/evidence-index.json',
      routes: '/api/machine/routes.json',
      openapi: '/api/machine/openapi.json'
    },
    liveness_claimed: false,
    generated_at: new Date().toISOString()
  });
}
