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
