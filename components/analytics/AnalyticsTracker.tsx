"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { initAnalytics, noteSignedIn, trackPage, type AnalyticsHost } from "@/lib/analytics/tracker";

function hostLabel(hostname: string): AnalyticsHost {
  return hostname === "os.veklom.com" || hostname.startsWith("os.") ? "os" : "veklom.com";
}

/** Mounted once in the root layout (inside AuthProvider). Renders nothing. */
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { me } = useAuth();

  useEffect(() => {
    initAnalytics({ host: hostLabel(window.location.hostname) });
  }, []);

  useEffect(() => {
    if (pathname) trackPage(pathname);
  }, [pathname]);

  const signedInId = me?.id;
  useEffect(() => {
    if (signedInId) noteSignedIn(getToken());
  }, [signedInId]);

  return null;
}
