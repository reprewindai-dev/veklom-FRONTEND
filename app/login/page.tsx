"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function safeReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  const value = new URL(window.location.href).searchParams.get("returnTo");
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}

export default function LoginPage() {
  const { login, loginWithGithub } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(undefined);
    try {
      await login(email, pw);
      router.replace(safeReturnTo() ?? "/os");
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-bg p-6 text-theme-ink">
      <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl shadow-xl p-8 relative overflow-hidden">
        
        {/* Subtle accent glow top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-theme-accent"></div>

        <div className="text-center mb-10 mt-4">
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-theme-ink">Sign in to Capability OS</h1>
          <p className="text-sm text-theme-inkDim">Governed compute infrastructure.</p>
        </div>

        <button
          onClick={loginWithGithub}
          disabled={busy}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-theme-border bg-theme-bg hover:border-theme-ink/30 transition-all font-mono text-sm font-bold disabled:opacity-50"
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub
        </button>

        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-theme-inkDim font-bold">
          <span className="h-px flex-1 bg-theme-border" />
          or with email
          <span className="h-px flex-1 bg-theme-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-theme-inkDim mb-1.5">Email address</label>
            <input
              type="text" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@organization.com"
              className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-bg text-theme-ink text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-theme-inkDim">Password</label>
              <Link href="/forgot-password" className="text-[10px] text-theme-inkDim hover:text-theme-accent transition-colors">Forgot password?</Link>
            </div>
            <input
              type="password" required value={pw} onChange={(e) => setPw(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-2.5 rounded-lg border border-theme-border bg-theme-bg text-theme-ink text-sm focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
            />
          </div>
          {err && <div className="p-3 rounded border border-theme-danger/30 bg-theme-danger/10 text-theme-danger text-xs">{err}</div>}
          <button type="submit" disabled={busy} className="w-full mt-2 py-3 rounded-lg bg-theme-accent text-white font-bold tracking-wide hover:brightness-110 transition-all shadow-md shadow-theme-accent/20 disabled:opacity-50">
            {busy ? "Authenticating..." : "Sign in to Capability OS"}
          </button>
        </form>

        <p className="text-xs text-theme-inkDim mt-8 text-center">
          New to Veklom? <Link href="/signup" className="text-theme-accent hover:underline font-bold">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
