import type { NextRequest } from "next/server";

const DEFAULT_ORIGIN = "https://veklom.com";
const HOST_PATTERN = /^[a-z0-9.-]+(:\d+)?$/i;

/**
 * The origin the visitor actually used. Behind the Cloudflare tunnel `req.url` is the
 * container bind address (http://0.0.0.0:3002), so redirects built from it are unreachable.
 * Only Veklom hostnames are trusted; anything else falls back to https://veklom.com.
 */
export function publicOrigin(req: NextRequest): string {
  const raw = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(",")[0].trim().toLowerCase();
  if (!raw || !HOST_PATTERN.test(raw)) return DEFAULT_ORIGIN;
  const bare = raw.replace(/:\d+$/, "");
  if (bare === "veklom.com" || bare.endsWith(".veklom.com")) return `https://${bare}`;
  if (bare === "localhost" || bare === "127.0.0.1") return `http://${raw}`;
  return DEFAULT_ORIGIN;
}
