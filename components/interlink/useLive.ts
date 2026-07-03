"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

/**
 * Interlink live snapshot hook.
 * Polls /api/v1/interlink/state via the standard Veklom proxy (api.ts)
 * which attaches the JWT and routes to api.veklom.com.
 */
export interface InterlinkMetrics {
  total: number;
  authorized: number;
  denied: number;
  quarantined: number;
  errored: number;
  agents: number;
  capabilities: number;
  anomalies: number;
  quarantine_open: number;
  authorized_rate: number;
}

export interface InterlinkSnapshot {
  metrics: InterlinkMetrics;
  agents: any[];
  capabilities: any[];
  policies: any[];
  audit: any[];
  anomalies: any[];
  quarantine: any[];
  cost: any[];
}

export function useInterlinkLive(pollMs = 5000): {
  data: InterlinkSnapshot | null;
  refresh: () => void;
  loading: boolean;
} {
  const [data, setData] = useState<InterlinkSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    api<InterlinkSnapshot>("/api/v1/interlink/state")
      .then((d) => setData(d))
      .catch(() => {}) // fail silently — backend may not have this endpoint yet
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, pollMs);
    const onEvent = () => refresh();
    window.addEventListener("interlink:refresh", onEvent);
    return () => {
      clearInterval(id);
      window.removeEventListener("interlink:refresh", onEvent);
    };
  }, [refresh, pollMs]);

  return { data, refresh, loading };
}

/** Fire an Interlink event call via the Veklom proxy */
export async function interlinkPost<T>(path: string, body: unknown): Promise<T> {
  return api<T>(`/api/v1/interlink${path}`, { method: "POST", body });
}

export async function interlinkGet<T>(path: string): Promise<T> {
  return api<T>(`/api/v1/interlink${path}`, { method: "GET" });
}

/** Trigger a UI refresh event */
export function refreshInterlink(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("interlink:refresh"));
  }
}
