"use client";
import useSWR, { SWRConfiguration } from "swr";
import { fetcher, getTransportState, type TransportState } from "@/lib/api";

export function useApi<T = unknown>(path: string | null, options?: SWRConfiguration) {
  const swrOptions = { ...options, keepPreviousData: false };
  const response = useSWR<T>(path, fetcher, {
    revalidateOnFocus: true, // Resume polling when tab is active
    revalidateOnReconnect: true,
    errorRetryCount: 3,
    errorRetryInterval: 5000, // Starts at 5s, exponential backoff handled natively by SWR
    focusThrottleInterval: 5000, // visibility-aware pausing limits rapid re-fetches
    ...swrOptions,
  });
  const transportState: TransportState | null = response.error
    ? getTransportState(response.error)
    : null;
  return {
    ...response,
    data: response.error ? undefined : response.data,
    transportState
  };
}
