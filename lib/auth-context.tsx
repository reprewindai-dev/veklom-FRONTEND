"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError, clearTokens, getToken, SESSION_INVALID_EVENT, setTokens } from "./api";
import { normalizeTier, Tier } from "./tiers";
import type { Me, Subscription } from "@/types/api";

interface AuthState {
  me?: Me;
  sub?: Subscription;
  tier: Tier;
  loading: boolean;
  /** Set when the profile could not be loaded for a reason that is not a sign-out. */
  error?: string;
  /**
   * True only when the identity authority definitely rejected the session
   * (401 "Invalid token", 403 "Not authenticated" with no bearer) or the
   * operator signed out. A transient failure (429, 5xx, network, timeout)
   * leaves it false and keeps the tokens and the previous profile.
   */
  signedOut: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ autoSignedIn: boolean }>;
  /** Optional fallback destination used when the page URL carries no returnTo. */
  loginWithGithub: (fallbackReturnTo?: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const Ctx = createContext<AuthState | null>(null);

/** Delay before the single retry of a transient /auth/me failure. */
export const PROFILE_RETRY_DELAY_MS = 1500;

/**
 * Live LockerPhycer answers `/api/v1/auth/me` with 403 "Not authenticated"
 * when no bearer is presented (FastAPI HTTPBearer) and 401 "Invalid token"
 * for a bad or expired bearer. Both are definite sign-outs. Anything else
 * (429, 5xx, the proxy's 503, network failure, malformed body) says nothing
 * about the session and must not drop it.
 */
export function isDefiniteSignOut(cause: unknown): boolean {
  if (!(cause instanceof ApiError)) return false;
  if (cause.status === 401) return true;
  return cause.status === 403 && /not authenticated/i.test(cause.message);
}

/**
 * Whether the signed-in operator's email is verified. LockerPhycer's
 * `/api/v1/auth/me` (UserResponse) has never returned `is_verified`, so reading
 * only that field labelled every operator "Email not yet verified". Prefer the
 * explicit `email_verified` flag when LockerPhycer sends it, then the legacy
 * `is_verified`, then the account status: login is refused until the email is
 * verified, so an "active" account is a verified one.
 */
export function isEmailVerified(
  me: Pick<Me, "email_verified" | "is_verified" | "status"> | null | undefined,
): boolean {
  if (!me) return false;
  if (typeof me.email_verified === "boolean") return me.email_verified;
  if (typeof me.is_verified === "boolean") return me.is_verified;
  return typeof me.status === "string" && me.status.trim().toLowerCase() === "active";
}

function safeReturnTo(value: string | null, fallback = "/os/onboarding"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

function markNavigationSession(present: boolean) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = present
    ? `veklom.session=present; Path=/; SameSite=Lax; Max-Age=86400${secure}`
    : `veklom.session=; Path=/; SameSite=Lax; Max-Age=0${secure}`;
}

/** LockerPhycer requires a 3-50 char username; derive one from the name or email local part. */
function deriveUsername(email: string, name?: string): string {
  const source = (name?.trim() || email.split("@")[0] || "operator")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");
  const padded = source.length >= 3 ? source : `${source}-user`;
  return padded.slice(0, 50);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | undefined>();
  const [sub, setSub] = useState<Subscription | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [signedOut, setSignedOut] = useState(false);
  const mounted = useRef(true);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  const dropSession = useCallback(() => {
    clearTokens();
    markNavigationSession(false);
    setMe(undefined);
    setSub(undefined);
    setSignedOut(true);
  }, []);

  const loadProfile = useCallback(async (attempt = 0): Promise<void> => {
    if (attempt === 0) {
      setLoading(true);
      setError(undefined);
    }

    const hasBrowserSession = typeof document !== "undefined" && (
      Boolean(getToken()) || document.cookie.split(";").some((cookie) => cookie.trim() === "veklom.session=present")
    );
    if (!hasBrowserSession) {
      setMe(undefined);
      setSub(undefined);
      setLoading(false);
      return;
    }

    try {
      const data = await api<Me>("/api/v1/auth/me");
      if (!mounted.current) return;
      setMe(data);
      setSignedOut(false);
      setError(undefined);
      markNavigationSession(true);
      // LockerPhycer exposes the effective tier on the identity profile. There
      // is no subscription endpoint in the deployed identity contract, so do
      // not generate a guaranteed 404 during every successful login.
      setSub(undefined);
      if (mounted.current) setLoading(false);
    } catch (cause) {
      if (!mounted.current) return;
      if (isDefiniteSignOut(cause)) {
        dropSession();
        setLoading(false);
        return;
      }

      // Transient: keep the tokens and whatever profile we already had. Retry
      // once after a short delay; only then surface the error.
      if (attempt === 0) {
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null;
          void loadProfile(1);
        }, PROFILE_RETRY_DELAY_MS);
        return;
      }
      setError(cause instanceof Error ? cause.message : "Unable to validate session");
      setLoading(false);
    }
  }, [dropSession]);

  // The transport signals a 401 from the identity authority for the bearer it
  // presented; the session is dropped here, without a navigation.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSessionInvalid = () => {
      dropSession();
      setLoading(false);
    };
    window.addEventListener(SESSION_INVALID_EVENT, onSessionInvalid);
    return () => window.removeEventListener(SESSION_INVALID_EVENT, onSessionInvalid);
  }, [dropSession]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      // Password-reset and email-verification links carry their own one-time
      // `token`. It is not a session token: taking it here stored it as the
      // login, stripped it from the URL and broke both flows.
      const ownsTokenParam = ["/reset-password", "/verify-email"].some(
        (route) => url.pathname === route || url.pathname.startsWith(`${route}/`),
      );
      const urlToken = (ownsTokenParam ? null : url.searchParams.get("token")) || url.searchParams.get("veklom_token");
      const urlRefresh = url.searchParams.get("refresh_token") || url.searchParams.get("veklom_refresh_token");

      if (urlToken) {
        setTokens(urlToken, urlRefresh);
        url.searchParams.delete("token");
        url.searchParams.delete("veklom_token");
        url.searchParams.delete("refresh_token");
        url.searchParams.delete("veklom_refresh_token");
        window.history.replaceState({}, document.title, url.toString());
      }
    }
    loadProfile();
  }, [loadProfile]);

  const login = useCallback(async (email: string, password: string, mfaCode?: string) => {
    setError(undefined);
    const res = await api<{ access_token: string; refresh_token?: string; token?: string }>(
      "/api/v1/auth/login",
      { unauth: true, body: { email: email.trim().toLowerCase(), password, ...(mfaCode ? { mfa_code: mfaCode.trim() } : {}) } },
    );
    const access = res.access_token || res.token;
    if (!access) throw new Error("Authentication succeeded without an access token");
    setTokens(access, res.refresh_token);
    markNavigationSession(true);
    await loadProfile();
  }, [loadProfile]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    setError(undefined);
    const normalizedEmail = email.trim().toLowerCase();
    const baseUsername = deriveUsername(normalizedEmail, name);
    const register = (username: string) =>
      api<{ id: string; email: string; username: string; status: string }>("/api/v1/auth/register", {
        unauth: true,
        body: { email: normalizedEmail, username, password, full_name: name?.trim() || undefined },
      });

    try {
      await register(baseUsername);
    } catch (cause) {
      const usernameTaken =
        cause instanceof ApiError &&
        (cause.status === 400 || cause.status === 409 || cause.status === 500) &&
        /username|unique|duplicate|integrity/i.test(cause.message);
      if (!usernameTaken) throw cause;
      await register(`${baseUsername.slice(0, 43)}-${Math.random().toString(36).slice(2, 8)}`);
    }

    // Email/password accounts are deliberately not auto-signed-in. LockerPhycer
    // sends a short-lived sovereign-mail verification link and refuses login until the
    // address is verified. GitHub OAuth remains a separate verified identity path.
    clearTokens();
    markNavigationSession(false);
    return { autoSignedIn: false };
  }, []);

  const loginWithGithub = useCallback((fallbackReturnTo?: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    // Guard: this is also wired directly as an onClick handler, which passes an event.
    const fallback =
      typeof fallbackReturnTo === "string" ? safeReturnTo(fallbackReturnTo, `${BASE_PATH}/os/onboarding`) : `${BASE_PATH}/os/onboarding`;
    const next = safeReturnTo(params.get("returnTo"), fallback);
    window.location.href = `${BASE_PATH}/api/auth/github/login?next=${encodeURIComponent(next)}`;
  }, []);

  const logout = useCallback(() => {
    api("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    dropSession();
  }, [dropSession]);

  // `refresh` takes no arguments so it can be wired straight to onClick
  // without the event being read as the retry attempt.
  const refresh = useCallback(() => loadProfile(0), [loadProfile]);

  const tier: Tier = useMemo(() => normalizeTier(sub?.tier || sub?.plan || me?.tier), [sub, me]);

  return (
    <Ctx.Provider value={{ me, sub, tier, loading, error, signedOut, login, signup, loginWithGithub, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
