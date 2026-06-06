"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// /overview is an alias for the dashboard (matches the workspace landing route).
export default function OverviewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <main className="min-h-screen grid place-items-center">
      <div className="flex items-center gap-3 text-ink-400 text-sm">
        <span className="spinner" /> Opening overview…
      </div>
    </main>
  );
}
