// Server-only helpers for the Coinbase Onramp API used by the CDP FundModal.
// Follows https://docs.cdp.coinbase.com/wallets/using-wallets/onramp/cross-platform
// (lib/cdp-auth.ts and lib/to-camel-case.ts in that guide) and the Onramp
// security requirements (https://docs.cdp.coinbase.com/onramp/security-requirements):
// same-origin only (no CORS headers) and an authenticated Veklom operator.
// Import only from route handlers (it reads the CDP secret API key).

import { generateJwt } from "@coinbase/cdp-sdk/auth";
import { NextRequest, NextResponse } from "next/server";

export const ONRAMP_API_BASE_URL = "https://api.developer.coinbase.com";

export function getCDPCredentials(): { apiKeyId: string; apiKeySecret: string } | null {
  const apiKeyId = process.env["CDP_API_KEY_ID"];
  const apiKeySecret = process.env["CDP_API_KEY_SECRET"];
  if (!apiKeyId || !apiKeySecret) return null;
  return { apiKeyId, apiKeySecret };
}

export async function generateOnrampJwt(requestMethod: "GET" | "POST", requestPath: string): Promise<string> {
  const credentials = getCDPCredentials();
  if (!credentials) throw new Error("CDP API credentials not configured");
  return generateJwt({
    apiKeyId: credentials.apiKeyId,
    apiKeySecret: credentials.apiKeySecret,
    requestMethod,
    requestHost: new URL(ONRAMP_API_BASE_URL).hostname,
    requestPath,
  });
}

type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;
export type CamelizeKeys<T> = T extends readonly unknown[]
  ? { [K in keyof T]: CamelizeKeys<T[K]> }
  : T extends object
    ? { [K in keyof T as SnakeToCamelCase<K & string>]: CamelizeKeys<T[K]> }
    : T;

const toCamelCase = (str: string) => str.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

export const convertSnakeToCamelCase = <T,>(obj: T): CamelizeKeys<T> => {
  if (Array.isArray(obj)) return obj.map((item) => convertSnakeToCamelCase(item)) as CamelizeKeys<T>;
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      (acc as Record<string, unknown>)[toCamelCase(key)] = convertSnakeToCamelCase((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as CamelizeKeys<T>);
  }
  return obj as CamelizeKeys<T>;
};

/**
 * Require a live Veklom operator session before creating Onramp quotes/URLs.
 * LockerPhycer owns identity; the bearer is checked against /api/v1/auth/me.
 */
export async function requireOperator(req: NextRequest): Promise<NextResponse | null> {
  const authorization = req.headers.get("authorization") || "";
  if (!/^bearer\s+\S+/i.test(authorization)) {
    return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  }
  const lockerphycer = (process.env["LOCKERPHYCER_URL"] || "").replace(/\/+$/, "");
  if (!lockerphycer) return NextResponse.json({ error: "identity service not configured" }, { status: 503 });
  try {
    const me = await fetch(`${lockerphycer}/api/v1/auth/me`, { headers: { authorization }, cache: "no-store" });
    if (!me.ok) return NextResponse.json({ error: "authentication_required" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "identity service unavailable" }, { status: 503 });
  }
  return null;
}

export function onrampUnavailable(): NextResponse {
  return NextResponse.json({ error: "Coinbase Onramp is not configured (wallet setup unavailable)" }, { status: 503 });
}
