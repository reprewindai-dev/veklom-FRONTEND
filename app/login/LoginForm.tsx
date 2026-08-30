"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Use the same client auth path as the rest of the application. This stores
      // the backend-issued token, writes the navigation session marker expected by
      // middleware, and immediately validates the profile before navigation.
      await login(email, password);

      let destination = "/os";
      if (typeof window !== "undefined") {
        const requested = new URL(window.location.href).searchParams.get("returnTo");
        if (requested && requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\")) {
          destination = requested;
        }
      }

      router.replace(destination);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during sign in");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded shadow-sm p-5 sm:p-8">
      <div className="text-center mb-7 sm:mb-8">
        <h1 className="text-2xl font-sans font-bold text-theme-ink mb-2">Capability OS Access</h1>
        <p className="text-theme-inkDim text-sm">Sign in to enter your governed machine-action workspace.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-theme-danger/10 border border-theme-danger/20 text-theme-danger text-sm rounded" role="alert">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="veklom-login-email" className="text-xs font-mono font-bold uppercase tracking-wider text-theme-inkDim block">
            Email or Username
          </label>
          <input
            id="veklom-login-email"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-11 bg-theme-bg border border-theme-border rounded px-3 py-2 text-base sm:text-sm text-theme-ink focus:outline-none focus:border-theme-accent transition-colors"
            placeholder="operator@example.com"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="veklom-login-password" className="text-xs font-mono font-bold uppercase tracking-wider text-theme-inkDim block">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-theme-accent hover:underline whitespace-nowrap">
              Forgot password?
            </Link>
          </div>
          <input
            id="veklom-login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full min-h-11 bg-theme-bg border border-theme-border rounded px-3 py-2 text-base sm:text-sm text-theme-ink focus:outline-none focus:border-theme-accent transition-colors"
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-12 bg-theme-ink text-theme-bg font-bold py-2.5 rounded transition-opacity hover:opacity-90 mt-2 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="mt-5 rounded border border-theme-border bg-theme-bg px-3 py-3 text-center">
        <p className="font-mono text-[10px] uppercase tracking-wider text-theme-inkDim">
          GitHub and headless-device authorization are not enabled in this beta yet.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/signup" className="text-xs text-theme-inkDim hover:text-theme-ink transition-colors">
          Create account / request access
        </Link>
      </div>
    </div>
  );
}
