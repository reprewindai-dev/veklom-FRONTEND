import { NextResponse } from "next/server";

const BYOS_BACKEND_URL =
  process.env.VBB_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "https://api.veklom.com";

const CAPPO_BACKEND_URL =
  process.env.CAPI_BACKEND_URL ||
  process.env.CAPPO_BACKEND_URL ||
  "https://capi.veklom.com";

async function readJson(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    return { status: "Disconnected", httpStatus: response.status };
  }
  return response.json();
}

export async function GET() {
  const [byos, cappo] = await Promise.all([
    readJson(`${BYOS_BACKEND_URL.replace(/\/+$/, "")}/api/v1/vnp/methodology`),
    readJson(`${CAPPO_BACKEND_URL.replace(/\/+$/, "")}/v1/vnp/methodology`),
  ]);

  return NextResponse.json({
    methodology: "VNP Methodology v1.0",
    tagline: "Cryptographic API telemetry for the machine-to-machine economy",
    backends: {
      byos,
      cappo,
    },
    endpoints: {
      byos_x402_config: "/api/v1/x402/config",
      byos_x402_verify: "/api/v1/x402/verify",
      byos_vnp_metrics: "/api/v1/vnp/metrics",
      byos_vnp_beacon: "/api/v1/vnp/beacon",
      cappo_exec: "/v1/exec",
      cappo_vnp_methodology: "/v1/vnp/methodology",
    },
  });
}
