"use client";

import { createContext, useContext } from "react";

/**
 * Sandbox mode for Capability OS.
 *
 * How sandbox reaches CAPPO (the only mechanism CAPPO enforces):
 *   Every mount request carries `execution_scope.project = "sandbox"`.
 *   CAPPO persists that scope on the mount (capability_mount/service.py),
 *   binds the issued token to it, and the governed-counter adapter keys all
 *   state by (workspace, project, resource) (capability_mount/effects.py).
 *   All later calls (actions / execute / readback / terminate) are addressed
 *   to that mount id, so they inherit the sandbox scope server-side, and the
 *   readback route reports the persisted project back.
 *
 * The `X-Veklom-Environment` / `X-Veklom-Data-Mode` headers the browser also
 * sends are advisory only: cAPI strips them and CAPPO never reads them.
 * Calls that are not mount-scoped therefore have NO sandbox enforcement and
 * are rendered "Live only" while sandbox mode is on.
 */
export const SANDBOX_PROJECT = "sandbox";
export const ENVIRONMENT_STORAGE_KEY = "veklom.environment";
export const ENVIRONMENT_CHANGED_EVENT = "veklom.environment.changed";

export type RecordEnvironment = "sandbox" | "live" | "unscoped";

export const SANDBOX_COPY = {
  banner: "⚗ SANDBOX — NON-PRODUCTION ENVIRONMENT · SAFE REHEARSAL · NO LIVE CONSEQUENCE",
  strip: ["Sandbox routes only", "Non-production environment", "No live consequence"],
  railFooter: "SANDBOX ENABLES MACHINES TO REHEARSE — NON-PRODUCTION GOVERNED COMPUTE SAFE TO EXPLORE",
  // The Mode question (playground or live). Not a runtime health signal.
  runtimePill: "Mode · Sandbox",
  liveRuntimePill: "Mode · Live",
  footer: "SANDBOX ENVIRONMENT",
  liveFooter: "LIVE ENVIRONMENT",
  badge: "SANDBOX",
  beaconHeader: "LISTENING FOR BEACONS (SANDBOX)",
  liveBeaconHeader: "LISTENING FOR BEACONS",
  liveOnly: "Live only",
} as const;

const SandboxContext = createContext(false);

export const SandboxProvider = SandboxContext.Provider;

export function useSandboxMode() {
  return useContext(SandboxContext);
}

export function readEnvironmentIsSandbox(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ENVIRONMENT_STORAGE_KEY) === "sandbox";
  } catch {
    return false;
  }
}

/** Persist the environment and notify every listener (shell, lease views). */
export function writeEnvironmentIsSandbox(sandbox: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENVIRONMENT_STORAGE_KEY, sandbox ? "sandbox" : "production");
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
  window.dispatchEvent(new Event(ENVIRONMENT_CHANGED_EVENT));
  // Lease/consequence storage is segregated per environment; tell views to re-read.
  window.dispatchEvent(new Event("veklom.capability_lease.changed"));
}

/** Suffix used to segregate browser-side caches per environment. */
export function environmentStorageSuffix(sandbox: boolean = readEnvironmentIsSandbox()): string {
  return sandbox ? ".sandbox" : "";
}

/** Environment of a record as returned by a backend, based only on its project scope. */
export function environmentForProject(project: unknown): RecordEnvironment {
  if (typeof project !== "string" || !project) return "unscoped";
  return project === SANDBOX_PROJECT ? "sandbox" : "live";
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

/** Find a returned project scope on a backend row (top level, scope, execution_scope, mount, payload). */
export function projectOfRecord(row: unknown): string | undefined {
  const record = asRecord(row);
  if (!record) return undefined;
  const mount = asRecord(record.mount);
  const payload = asRecord(record.payload);
  const candidates = [
    record.project,
    asRecord(record.scope)?.project,
    asRecord(record.execution_scope)?.project,
    asRecord(mount?.scope)?.project,
    asRecord(mount?.execution_scope)?.project,
    payload?.project,
    asRecord(payload?.scope)?.project,
  ];
  const found = candidates.find((value) => typeof value === "string" && value);
  return typeof found === "string" ? found : undefined;
}

/**
 * Hard separation: sandbox views only show rows CAPPO scoped to project=sandbox;
 * live views never show sandbox rows. Unscoped rows are shown (tagged) in live only.
 */
export function rowVisibleInEnvironment(row: unknown, sandbox: boolean): boolean {
  const environment = environmentForProject(projectOfRecord(row));
  return sandbox ? environment === "sandbox" : environment !== "sandbox";
}
