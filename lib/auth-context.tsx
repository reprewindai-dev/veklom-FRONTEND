"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError, clearTokens, setTokens } from "./api";
import { normalizeTier, Tier } from "./tiers";
import type { Me, Subscription } from "@/types/api";

interface AuthState {
  me?: Me;
  sub?: Subscription;
  tier: Tier;
  loading: boolean;
  error?: string;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<{ autoSignedIn: boolean }>;
  loginWithGithub: () => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const Ctx = createContext<AuthState | null>(null);

function safeReturnTo(value: string | null, fallback = "/os"): string {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | undefined>();
  const [sub, setSub] = useState<Subscription | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      // Always ask the backend. Password login may provide a local bearer token,
      // while GitHub OAuth intentionally provides an HttpOnly access_token cookie.
      // Same-origin fetch sends that cookie automatically, so both login methods
      // converge on the same /auth/me truth boundary.
      const data = await api<Me>("/api/v1/auth/me");
      setMe(data);
      markNavigationSession(true);

      try {
        const subData = await api<Subscription>("/api/v1/billing/subscription");
        setSub(subData);
      } catch {
        // Subscription transport failure must never manufacture a paid/sovereign tier.
        setSub(undefined);
      }
    } catch (cause) {
      const isSignedOut = cause instanceof ApiError && cause.status === 401;
      if (!isSignedOut) {
        setError(cause instanceof Error ? cause.message : "Unable to validate session");
      }
      clearTokens();
      markNavigationSession(false);
      setMe(undefined);
      setSub(undefined);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const urlToken = url.searchParams.get("token") || url.searchParams.get("veklom_token");
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

  const login = useCallback(async (email: string, password: string) => {
    setError(undefined);
    const res = await api<{ access_token: string; refresh_token?: string; token?: string }>(
      "/api/v1/auth/login",
      { unauth: true, body: { email: email.trim().toLowerCase(), password } },
    );
    const access = res.access_token || res.token;
    if (!access) throw new Error("Authentication succeeded without an access token");
    setTokens(access, res.refresh_token);
    markNavigationSession(true);
    await loadProfile();
  }, [loadProfile]);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    setError(undefined);
    const res = await api<{ access_token?: string; token?: string; refresh_token?: string }>(
      "/api/v1/auth/signup",
      { unauth: true, body: { email: email.trim().toLowerCase(), password, full_name: name, name } },
    );
    const access = res.access_token || res.token;
    if (access) {
      setTokens(access, res.refresh_token);
      markNavigationSession(true);

      try {
        await api("/api/v1/pgl/onboarding/operator-identity", {
          method: "POST",
          body: { operator_name: name || "Sovereign Operator", role: "OWNER" },
        });
        await api("/api/v1/pgl/onboarding/workspace-authority", {
          method: "POST",
          body: { workspace_name: "Default Workspace", network_zone: "VNP-Global" },
        });
      } catch (cause) {
        console.warn("PGL Identity initialization warning:", cause);
      }

      await loadProfile();
      return { autoSignedIn: true };
    }
    return { autoSignedIn: false };
  }, [loadProfile]);

  const loginWithGithub = useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = safeReturnTo(params.get("returnTo"), `${BASE_PATH}/os`);
    window.location.href = `${BASE_PATH}/api/auth/github/login?next=${encodeURIComponent(next)}`;
  }, []);

  const logout = useCallback(() => {
    api("/api/v1/auth/logout", { method: "POST" }).catch(() => {});
    clearTokens();
    markNavigationSession(false);
    setMe(undefined);
    setSub(undefined);
  }, []);

  const tier: Tier = useMemo(() => normalizeTier(sub?.tier || sub?.plan || me?.tier), [sub, me]);

  return (
    <Ctx.Provider value={{ me, sub, tier, loading, error, login, signup, loginWithGithub, logout, refresh: loadProfile }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth(): AuthState {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
