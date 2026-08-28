import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
export function GET() {
 return NextResponse.json({
 claims: [
 { gate: 'G0A', status: 'VERIFIED', tests: '9/9', liveness_claimed: false },
 { gate: 'G0B', status: 'VERIFIED', tests: '6/6', liveness_claimed: false },
 { gate: 'G1', status: 'IN_PROGRESS', tests: '1/5', liveness_claimed: false },
 { gate: 'P5', status: 'CLOSED', tag: 'veklom-p5-closure-v1', sha: 'b48007614bee92d1caacc628d96fe9a786e8cd47', tests: '75/75', liveness_claimed: false }
 ],
 generated_at: new Date().toISOString()
 });
}
