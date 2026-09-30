// Buy Quote (exchange rate + one-click-buy URL) for the CDP FundModal, per
// https://docs.cdp.coinbase.com/wallets/using-wallets/onramp/cross-platform
import type { FetchBuyQuote, OnrampBuyQuoteSnakeCaseResponse } from "@coinbase/cdp-react";
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

type OnrampBuyQuoteRequest = Parameters<FetchBuyQuote>[0];
type OnrampBuyQuoteResponse = Awaited<ReturnType<FetchBuyQuote>>;

export async function POST(request: NextRequest) {
  if (!getCDPCredentials()) return onrampUnavailable();
  const denied = await requireOperator(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as OnrampBuyQuoteRequest;
    if (!body.purchaseCurrency || !body.paymentAmount || !body.paymentCurrency || !body.paymentMethod || !body.country) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }
    if (body.country === "US" && !body.subdivision) {
      return NextResponse.json({ error: "State/subdivision is required for US" }, { status: 400 });
    }
    const apiPath = "/onramp/v1/buy/quote";
    const jwt = await generateOnrampJwt("POST", apiPath);
    const response = await fetch(`${ONRAMP_API_BASE_URL}${apiPath}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        purchaseCurrency: body.purchaseCurrency,
        purchaseNetwork: body.purchaseNetwork,
        paymentAmount: body.paymentAmount,
        paymentCurrency: body.paymentCurrency,
        paymentMethod: body.paymentMethod,
        country: body.country,
        subdivision: body.subdivision,
        destinationAddress: body.destinationAddress,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const text = await response.text();
      let message = "Failed to create buy quote";
      try {
        message = (JSON.parse(text) as { message?: string }).message || message;
      } catch {
        // non-JSON upstream error
      }
      return NextResponse.json({ error: message }, { status: response.status });
    }
    const data = (await response.json()) as OnrampBuyQuoteSnakeCaseResponse;
    return NextResponse.json(convertSnakeToCamelCase(data) as unknown as OnrampBuyQuoteResponse);
  } catch (error) {
    console.error("Onramp buy quote failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
