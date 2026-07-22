"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export default function GoogleAnalyticsUserSync() {
  const { me, tier } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && window.gtag && me?.id) {
      // Sync the User ID to Google Analytics for cross-device tracking
      window.gtag("set", "user_id", me.id);
      
      // Sync user properties to distinguish Agents vs Humans
      window.gtag("set", "user_properties", {
        tier: tier,
        role: me.role || "unknown",
        is_agent: me.role === "agent" ? "true" : "false"
      });
    }
  }, [me, tier]);

  return null;
}
