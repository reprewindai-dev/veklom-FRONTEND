import { NextResponse } from 'next/server';

const AUTHORITY_BACKEND_URL =
 process.env.VBB_BACKEND_URL ||
 process.env.BACKEND_URL ||"https://api.veklom.com";

export async function GET() {
 const upstreamUrl = `${AUTHORITY_BACKEND_URL.replace(/\/+$/,"")}/api/v1/beacon/topology`;

 try {
 const res = await fetch(upstreamUrl, {
 cache:"no-store",
 });

 if (!res.ok) {
 return NextResponse.json(
 {
 status:"error",
 topology: {
 nodes: [],
 eventsLog: [`Authority topology unavailable: HTTP ${res.status}`],
 ledgerFeed: [],
 totalSettledUsd: 0,
 activeNodes: 0,
 expectedNodes: 5,
 isActiveStorm: false,
 safetyGuardActive: true,
 },
 },
 { status: 502 }
 );
 }

 const data = await res.json();
 return NextResponse.json(data);
 } catch (error) {
 console.error("VNP Topology Error:", error);
 return NextResponse.json(
 {
 status:"error",
 topology: {
 nodes: [],
 eventsLog: ["Authority topology request failed"],
 ledgerFeed: [],
 totalSettledUsd: 0,
 activeNodes: 0,
 expectedNodes: 5,
 isActiveStorm: false,
 safetyGuardActive: true,
 },
 },
 { status: 502 }
 );
 }
}
