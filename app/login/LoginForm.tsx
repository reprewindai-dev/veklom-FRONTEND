"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleAlert, Github, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type GithubStatus = {
  configured: boolean;
  present?: Record<string, boolean>;
  missing?: string[];
};

function safeDestination(): string {
  if (typeof window === "undefined") return "/os";
  const requested = new URL(window.location.href).searchParams.get("returnTo");
  if (requested && requested.startsWith("/") && !requested.startsWith("//") && !requested.includes("\\")) {
    return requested;
  }
  return "/os";
}

export function LoginForm() {
  const router = useRouter();
  const { login, loginWithGithub } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [github, setGithub] = useState<GithubStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/auth/github/config-status", { cache: "no-store", headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((status: GithubStatus) => { if (!cancelled) setGithub(status); })
      .catch(() => { if (!cancelled) setGithub({ configured: false }); });

    if (typeof window !== "undefined") {
      const params = new URL(window.location.href).searchParams;
      const oauthError = params.get("github_error_description") || params.get("github_error");
      if (oauthError) setError(oauthError);
    }

    return () => { cancelled = true; };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      router.replace(safeDestination());
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px]">
      <div className="mb-9">
        <div className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-surface px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.2em] text-theme-inkDim">
          <ShieldCheck className="h-3.5 w-3.5 text-theme-accent" />
          Backend-issued session
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-[-.055em] text-theme-ink sm:text-5xl">Enter Capability OS.</h1>
        <p className="mt-4 max-w-md text-sm leading-7 text-theme-inkDim">Authentication resolves against the real BYOS identity/session backend. GitHub and password sign-in converge on the same workspace-bound session authority.</p>
      </div>

      {error && (
        <div className="mb-5 flex gap-3 rounded-2xl border border-theme-danger/20 bg-theme-danger/5 p-4 text-sm leading-6 text-theme-danger" role="alert">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={loginWithGithub}
        disabled={github?.configured !== true}
        className="group flex min-h-14 w-full items-center justify-between rounded-2xl border border-theme-border bg-theme-surface px-5 text-sm font-semibold text-theme-ink shadow-[0_10px_35px_rgba(2,8,23,.05)] transition duration-300 hover:-translate-y-0.5 hover:border-theme-ink/15 hover:shadow-[0_18px_45px_rgba(2,8,23,.08)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <span className="flex items-center gap-3"><Github className="h-5 w-5" /> Continue with GitHub</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </button>

      <div className="mt-3 min-h-5 text-[11px] text-theme-inkDim">
        {github === null ? "Checking GitHub OAuth configuration…" : github.configured ? "GitHub OAuth is configured on the BYOS authentication boundary." : `GitHub OAuth setup is incomplete${github.missing?.length ? ` · missing ${github.missing.join(", ")}` : ""}.`}
      </div>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-theme-border" />
        <span className="text-[10px] font-semibold uppercase tracking-[.22em] text-theme-inkDim">or use your account</span>
        <div className="h-px flex-1 bg-theme-border" />
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="veklom-login-email" className="mb-2.5 block text-[11px] font-semibold text-theme-ink">Email address</label>
          <input
            id="veklom-login-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-theme-border bg-theme-surface px-4 text-base text-theme-ink outline-none transition placeholder:text-theme-inkDim/55 focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/5"
            placeholder="you@company.com"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
          />
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <label htmlFor="veklom-login-password" className="text-[11px] font-semibold text-theme-ink">Password</label>
            <Link href="/forgot-password" className="text-[11px] font-medium text-theme-inkDim transition hover:text-theme-ink">Forgot password?</Link>
          </div>
          <input
            id="veklom-login-password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-theme-border bg-theme-surface px-4 text-base text-theme-ink outline-none transition placeholder:text-theme-inkDim/55 focus:border-theme-accent focus:ring-4 focus:ring-theme-accent/5"
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group flex min-h-14 w-full items-center justify-center gap-4 rounded-full bg-theme-ink px-6 text-sm font-semibold text-theme-bg shadow-[0_18px_48px_rgba(0,0,0,.14)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(0,0,0,.2)] disabled:cursor-wait disabled:opacity-55 disabled:hover:translate-y-0"
        >
          {loading ? "Validating session…" : "Sign in to Capability OS"}
          {!loading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
        </button>
      </form>

      <div className="mt-7 flex items-center justify-between gap-4 border-t border-theme-border pt-6 text-xs text-theme-inkDim">
        <span>Need a workspace?</span>
        <Link href="/signup" className="font-semibold text-theme-ink transition hover:text-theme-accent">Create account →</Link>
      </div>
    </div>
  );
}
