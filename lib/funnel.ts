/** Front-door funnel: every new visitor lands in VLink after signup and verification. */
export const FUNNEL_RETURN_TO = "/vlink/connect/";

/** /signup?returnTo=%2Fvlink%2Fconnect%2F */
export const SIGNUP_URL = `/signup?returnTo=${encodeURIComponent(FUNNEL_RETURN_TO)}`;

/** Same rule as LoginForm and the GitHub login route: a same-origin relative path only. */
export function safeRelativePath(value: string | null | undefined, fallback = FUNNEL_RETURN_TO): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

/**
 * The emailed verification link is built by the identity service and carries only ?token=,
 * so a returnTo given at signup (for example /os) would be lost across the email hop and the
 * user would land in VLink. Signup remembers it in this browser for the life of the link
 * (30 minutes); verification reads it and clears it once verified. Only a safe relative
 * path is ever stored or returned.
 */
export const PENDING_RETURN_TO_KEY = "veklom.pending_return_to";
const PENDING_RETURN_TO_TTL_MS = 30 * 60 * 1000;

export function rememberReturnTo(path: string, now = Date.now()): void {
  const safe = safeRelativePath(path);
  try {
    if (safe === FUNNEL_RETURN_TO) window.localStorage.removeItem(PENDING_RETURN_TO_KEY);
    else window.localStorage.setItem(PENDING_RETURN_TO_KEY, JSON.stringify({ path: safe, at: now }));
  } catch { /* storage blocked: verification falls back to VLink */ }
}

export function recallReturnTo(now = Date.now()): string | null {
  try {
    const raw = window.localStorage.getItem(PENDING_RETURN_TO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { path?: unknown; at?: unknown };
    if (typeof parsed.path !== "string" || typeof parsed.at !== "number") return null;
    if (now - parsed.at > PENDING_RETURN_TO_TTL_MS || parsed.at > now) return null;
    const safe = safeRelativePath(parsed.path, "");
    return safe || null;
  } catch {
    return null;
  }
}

export function forgetReturnTo(): void {
  try {
    window.localStorage.removeItem(PENDING_RETURN_TO_KEY);
  } catch { /* storage blocked: nothing was stored */ }
}
