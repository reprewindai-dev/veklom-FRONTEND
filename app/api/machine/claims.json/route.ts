import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
// Nothing here is checked against live data at request time, so no gate may be
// published as VERIFIED. SOURCE_ONLY means "asserted by the source tree only";
// graded claims live in the public registry.
export function GET() {
 return NextResponse.json({
 note: 'Statuses below are source assertions, not verified results. Every graded claim is in the public registry.',
 registry: 'https://veklom.dev/claims',
 registry_api: 'https://veklom.dev/api/claims',
 claims: [
 { gate: 'G0A', status: 'SOURCE_ONLY', tests: '9/9', liveness_claimed: false },
 { gate: 'G0B', status: 'SOURCE_ONLY', tests: '6/6', liveness_claimed: false },
 { gate: 'G1', status: 'IN_PROGRESS', tests: '1/5', liveness_claimed: false },
 { gate: 'P5', status: 'SOURCE_ONLY', tag: 'veklom-p5-closure-v1', sha: 'b48007614bee92d1caacc628d96fe9a786e8cd47', tests: '75/75', liveness_claimed: false }
 ],
 generated_at: new Date().toISOString()
 });
}
