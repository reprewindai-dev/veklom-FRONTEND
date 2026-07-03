"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      if (path.endsWith("/token-wallet") || path.endsWith("/token-wallet/")) {
        router.replace("/treasury/");
      } else if (path.endsWith("/wallet") || path.endsWith("/wallet/")) {
        router.replace("/treasury/");
      }
    }
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="card p-10 max-w-md w-full text-center animate-fade-up">
        <div className="flex justify-center mb-5"><LogoMark size={56} /></div>
        <div className="text-[11px] text-brand-400 uppercase tracking-[0.2em] mb-2">Error 404</div>
        <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
        <p className="text-sm text-ink-400 mt-2">
          The page you’re looking for doesn’t exist or has moved. Let’s get you back to the control plane.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/control-node" className="btn btn-primary">Back to Control Node</Link>
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
        </div>
      </div>
    </main>
  );
}
