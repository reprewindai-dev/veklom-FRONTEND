"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/AuthLayout";
import { Button, ErrorBox, SuccessBox } from "@/components/ui";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(undefined);
    setSuccess(undefined);

    const token = new URL(window.location.href).searchParams.get("token");
    if (!token) {
      setError("This password reset link is missing its token.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await api("/api/v1/auth/password-reset/confirm", {
        unauth: true,
        body: { token, new_password: password },
      });
      setSuccess("Password reset complete. All previous sessions were revoked; sign in again with your new password.");
      setPassword("");
      setConfirmPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="A successful reset revokes existing sessions for this account."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-ink-400">New password</label>
          <input
            type="password"
            required
            autoFocus
            minLength={MIN_PASSWORD_LENGTH}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input mt-1.5"
          />
        </div>
        <div>
          <label className="text-xs text-ink-400">Confirm new password</label>
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="input mt-1.5"
          />
        </div>
        {error && <ErrorBox message={error} />}
        {success && <SuccessBox message={success} />}
        <Button type="submit" loading={busy} disabled={busy || Boolean(success)} className="w-full">
          {busy ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <p className="text-xs text-ink-400 mt-6 text-center">
        <Link href="/login" className="text-brand-400 hover:underline">Back to sign in</Link>
      </p>
    </AuthLayout>
  );
}
