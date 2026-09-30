"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FUNNEL_RETURN_TO, safeRelativePath } from "@/lib/funnel";
import { AuthLayout } from "@/components/AuthLayout";
import { ErrorBox, SuccessBox } from "@/components/ui";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [state, setState] = useState<"verifying" | "ok" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email address…");
  // The emailed link is built by the backend and carries only ?token=, so the
  // destination defaults to VLink unless a safe returnTo is present.
  const [loginHref, setLoginHref] = useState(`/login?returnTo=${encodeURIComponent(FUNNEL_RETURN_TO)}`);

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const token = params.get("token");
    const destination = `/login?returnTo=${encodeURIComponent(safeRelativePath(params.get("returnTo")))}`;
    setLoginHref(destination);
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
        window.setTimeout(() => router.replace(destination), 1400);
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "This verification link is invalid or expired.");
      });
  }, [router]);

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
        <Link href={loginHref} className="text-brand-400 hover:underline">Continue to sign in</Link>
      </p>
    </AuthLayout>
  );
}
