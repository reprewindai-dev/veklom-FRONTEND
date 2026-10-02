import { NextResponse } from"next/server";

const AUTHORITY_BACKEND_URL =
 process.env.VBB_BACKEND_URL ||
 process.env.BACKEND_URL ||"https://api.veklom.com";

const CAPPO_BACKEND_URL =
 process.env.CAPI_BACKEND_URL ||
 process.env.CAPPO_BACKEND_URL ||
 process.env.CAPPO_URL ||"https://capi.veklom.com";

async function readJson(url: string) {
 const response = await fetch(url, { cache:"no-store" });
 if (!response.ok) {
 return { status:"Disconnected", httpStatus: response.status };
 }
 return response.json();
}

export async function GET() {
 const [authority, cappo] = await Promise.all([
 readJson(`${AUTHORITY_BACKEND_URL.replace(/\/+$/,"")}/api/v1/vnp/methodology`),
 readJson(`${CAPPO_BACKEND_URL.replace(/\/+$/,"")}/v1/vnp/methodology`),
 ]);

 return NextResponse.json({
 methodology:"VNP Methodology v1.0",
 tagline:"Cryptographic API telemetry for the machine-to-machine economy",
 backends: {
 authority,
 cappo,
 },
 endpoints: {
 authority_x402_config:"/api/v1/x402/config",
 authority_x402_verify:"/api/v1/x402/verify",
 authority_vnp_metrics:"/api/v1/vnp/metrics",
 authority_vnp_beacon:"/api/v1/vnp/beacon",
 cappo_exec:"/v1/exec",
 cappo_vnp_methodology:"/v1/vnp/methodology",
 },
 });
}
