"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button, ErrorBox, SuccessBox } from "@/components/ui";
import { AuthLayout } from "@/components/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState<string | undefined>();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(undefined); setOk(undefined); setBusy(true);
    try {
      // Backend endpoint may or may not be enabled; we always show a neutral
      // confirmation so we don't leak which emails exist.
      await api("/api/v1/auth/password-reset", { unauth: true, body: { email } }).catch(() => {});
      setOk("If an account exists for that email, a reset link is on its way.");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email tied to your workspace and we’ll send a recovery link."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-ink-400">Email</label>
          <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="input mt-1.5" />
        </div>
        {err && <ErrorBox message={err} />}
        {ok && <SuccessBox message={ok} />}
        <Button type="submit" loading={busy} disabled={!!ok} className="w-full">
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-xs text-ink-400 mt-6 text-center">
        Remembered it? <Link href="/login" className="text-brand-400 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
