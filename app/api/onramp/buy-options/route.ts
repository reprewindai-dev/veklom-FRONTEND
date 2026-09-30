// Buy Options for the CDP FundModal (Coinbase Onramp), per
// https://docs.cdp.coinbase.com/wallets/using-wallets/onramp/cross-platform
import type { FetchBuyOptions, OnrampBuyOptionsSnakeCaseResponse } from "@coinbase/cdp-react";
import { NextRequest, NextResponse } from "next/server";
import {
  convertSnakeToCamelCase,
  generateOnrampJwt,
  getCDPCredentials,
  ONRAMP_API_BASE_URL,
  onrampUnavailable,
  requireOperator,
} from "@/lib/wallet/onramp-server";

export const dynamic = "force-dynamic";

type OnrampBuyOptionsResponse = Awaited<ReturnType<FetchBuyOptions>>;

export async function GET(request: NextRequest) {
  if (!getCDPCredentials()) return onrampUnavailable();
  const denied = await requireOperator(request);
  if (denied) return denied;
  try {
    const search = request.nextUrl.searchParams;
    const query = new URLSearchParams();
    for (const key of ["country", "subdivision", "networks"]) {
      const value = search.get(key);
      if (value) query.append(key, value);
    }
    const apiPath = "/onramp/v1/buy/options";
    const jwt = await generateOnrampJwt("GET", apiPath);
    const response = await fetch(`${ONRAMP_API_BASE_URL}${apiPath}${query.size ? `?${query}` : ""}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      const text = await response.text();
      let message = "Failed to fetch buy options";
      try {
        message = (JSON.parse(text) as { message?: string }).message || message;
      } catch {
        // non-JSON upstream error
      }
      return NextResponse.json({ error: message }, { status: response.status });
    }
    const data = (await response.json()) as OnrampBuyOptionsSnakeCaseResponse;
    return NextResponse.json(convertSnakeToCamelCase(data) as unknown as OnrampBuyOptionsResponse);
  } catch (error) {
    console.error("Onramp buy options failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
