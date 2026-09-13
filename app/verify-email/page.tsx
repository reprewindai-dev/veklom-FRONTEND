"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/AuthLayout";
import { ErrorBox, SuccessBox } from "@/components/ui";

export default function VerifyEmailPage() {
  const [state, setState] = useState<"verifying" | "ok" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email address…");

  useEffect(() => {
    const token = new URL(window.location.href).searchParams.get("token");
    if (!token) {
      setState("error");
      setMessage("This verification link is missing its token.");
      return;
    }

    api<{ verified: boolean }>("/api/v1/auth/email-verification/confirm", {
      unauth: true,
      body: { token },
    })
      .then(() => {
        setState("ok");
        setMessage("Email verified. Your Veklom account is ready to sign in.");
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "This verification link is invalid or expired.");
      });
  }, []);

  return (
    <AuthLayout
      eyebrow="Account verification"
      title="Verify your email"
      subtitle="Email verification is required before password sign-in is enabled."
    >
      {state === "verifying" && <p className="text-sm text-ink-400">{message}</p>}
      {state === "ok" && <SuccessBox message={message} />}
      {state === "error" && <ErrorBox message={message} />}

      <p className="text-xs text-ink-400 mt-6 text-center">
        <Link href="/login" className="text-brand-400 hover:underline">Continue to sign in</Link>
      </p>
    </AuthLayout>
  );
}
