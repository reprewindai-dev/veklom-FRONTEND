import { NextResponse } from 'next/server';
export const dynamic = 'force-static';
export function GET() {
 return NextResponse.json({
 g0a_baseline: {
 status:"VERIFIED",
 completion:"9/9"
 },
 g0b_cryptographic: {
 status:"VERIFIED",
 completion:"6/6"
 },
 g1_offline_execution: {
 status:"IN_PROGRESS",
 completion:"1/5"
 }
 });
}
