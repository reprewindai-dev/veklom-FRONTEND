type HeaderReader = { get(name: string): string | null };

/** Return a trusted public origin for OAuth redirects, never the internal bind URL. */
export function safePublicOrigin(headers: HeaderReader): string {
  const forwardedHost = headers.get("x-forwarded-host")?.split(",", 1)[0]?.trim();
  const requestHost = headers.get("host")?.trim();
  const host = forwardedHost || requestHost || "";
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim();
  const protocol = forwardedProto === "https" ? "https" : "http";

  const hostname = host.split(":", 1)[0].replace(/^\[|\]$/g, "").toLowerCase();
  const allowed =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "veklom.dev" ||
    hostname === "veklom.com" ||
    hostname.endsWith(".veklom.com");

  if (allowed) return `${protocol}://${host}`;

  const configured = process.env.PUBLIC_FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // Ignore malformed deployment configuration; use a safe local origin below.
    }
  }
  return "http://localhost:3002";
}
