"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { capabilities, type CapabilityContract } from "./capabilities";

/**
 * The selected capability (design brief, "Capability Identity"): every workspace operates on an
 * explicit capability, and moving between workspaces keeps it until the operator changes it.
 *
 * Source of truth, in order: the `?capability=` query parameter (so a link carries it), then this
 * tab's session. Selecting a capability is navigation context only; it grants nothing.
 */
export const CAPABILITY_CONTEXT_KEY = "veklom.capability_context";
export const CAPABILITY_CONTEXT_EVENT = "veklom.capability_context.changed";

export function findCapability(id: string | null | undefined): CapabilityContract | undefined {
  if (!id) return undefined;
  return capabilities.find((item) => item.id === id);
}

function readStoredId(): string | null {
  try {
    return window.sessionStorage.getItem(CAPABILITY_CONTEXT_KEY);
  } catch {
    return null;
  }
}

function writeStoredId(id: string | null) {
  try {
    if (id) window.sessionStorage.setItem(CAPABILITY_CONTEXT_KEY, id);
    else window.sessionStorage.removeItem(CAPABILITY_CONTEXT_KEY);
  } catch {
    // Storage may be unavailable; the query parameter still carries the context.
  }
  window.dispatchEvent(new Event(CAPABILITY_CONTEXT_EVENT));
}

/** Read the capability id from a query string, accepting only known capabilities. */
export function capabilityIdFromSearch(search: string): string | null {
  const id = new URLSearchParams(search).get("capability");
  return findCapability(id) ? id : null;
}

/** Append the selected capability to an in-OS route so the context survives navigation. */
export function withCapability(route: string, capabilityId: string | null | undefined): string {
  if (!capabilityId || !route.startsWith("/os")) return route;
  const [path, query = ""] = route.split("?");
  const params = new URLSearchParams(query);
  params.set("capability", capabilityId);
  return `${path}?${params.toString()}`;
}

/** Where a capability opens: its own workspace, carrying itself as context. */
export function capabilityHref(capability: CapabilityContract): string {
  return withCapability(capability.workspace, capability.id);
}

export function useCapabilityContext() {
  const pathname = usePathname();
  const [capabilityId, setCapabilityId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const fromUrl = capabilityIdFromSearch(window.location.search);
      if (fromUrl && fromUrl !== readStoredId()) {
        try {
          window.sessionStorage.setItem(CAPABILITY_CONTEXT_KEY, fromUrl);
        } catch {
          // ignore
        }
      }
      const stored = readStoredId();
      setCapabilityId(fromUrl ?? (findCapability(stored) ? stored : null));
    };
    sync();
    window.addEventListener(CAPABILITY_CONTEXT_EVENT, sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener(CAPABILITY_CONTEXT_EVENT, sync);
      window.removeEventListener("popstate", sync);
    };
  }, [pathname]);

  const select = useCallback((id: string) => {
    if (findCapability(id)) writeStoredId(id);
  }, []);

  const clear = useCallback(() => {
    writeStoredId(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has("capability")) {
      url.searchParams.delete("capability");
      window.history.replaceState(window.history.state, "", url.pathname + (url.search || "") + url.hash);
    }
  }, []);

  return { capabilityId, capability: findCapability(capabilityId), select, clear };
}
