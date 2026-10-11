"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { useSandboxMode } from "./sandbox";
import {
  approvalItems,
  rankAttention,
  runItems,
  summarizeAttention,
  type AttentionItem,
  type AttentionSummary,
  type SourceRead,
} from "./attention";

export const ATTENTION_POLL_MS = 20_000;

interface Reads {
  approvals: SourceRead;
  runs: SourceRead;
}

export interface AttentionState {
  items: AttentionItem[];
  summary: AttentionSummary;
  reads: Reads;
  refresh: () => void;
}

/**
 * Polls the two attention sources through the same CAPPO proxy the stages use, only while
 * someone is signed in and the tab is visible. Each source is read independently, so one
 * failing never hides what the other returned.
 */
export function useAttention(enabled: boolean): AttentionState {
  const sandbox = useSandboxMode();
  const [payloads, setPayloads] = useState<{ approvals?: unknown; runs?: unknown }>({});
  const [reads, setReads] = useState<Reads>({ approvals: "pending", runs: "pending" });
  const inflight = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    if (!enabled) return;
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    const read = async (key: keyof Reads, path: string, query?: Record<string, number>) => {
      try {
        const data = await api<unknown>(path, { signal: controller.signal, query, handlePaymentRequired: false });
        if (controller.signal.aborted) return;
        setPayloads((current) => ({ ...current, [key]: data }));
        setReads((current) => ({ ...current, [key]: "ok" }));
      } catch {
        if (controller.signal.aborted) return;
        setPayloads((current) => ({ ...current, [key]: undefined }));
        setReads((current) => ({ ...current, [key]: "unavailable" }));
      }
    };
    void read("approvals", "/api/cappo/v1/governance/v2/quarantine");
    void read("runs", "/api/cappo/v1/runs", { limit: 25 });
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      inflight.current?.abort();
      setPayloads({});
      setReads({ approvals: "pending", runs: "pending" });
      return;
    }
    refresh();
    const tick = () => {
      if (typeof document === "undefined" || document.visibilityState === "visible") refresh();
    };
    const timer = window.setInterval(tick, ATTENTION_POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
      inflight.current?.abort();
    };
  }, [enabled, refresh, sandbox]);

  const items = useMemo(
    () => rankAttention([...approvalItems(payloads.approvals, sandbox), ...runItems(payloads.runs, sandbox)]),
    [payloads, sandbox],
  );
  const summary = useMemo(() => summarizeAttention(items, [reads.approvals, reads.runs]), [items, reads]);
  return { items, summary, reads, refresh };
}
