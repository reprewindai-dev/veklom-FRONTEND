"use client";

import { createContext, useContext } from "react";

export const SANDBOX_PROJECT = "sandbox";

const SandboxContext = createContext(false);

export const SandboxProvider = SandboxContext.Provider;

export function useSandboxMode() {
  return useContext(SandboxContext);
}

export function readEnvironmentIsSandbox(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("veklom.environment") === "sandbox";
  } catch {
    return false;
  }
}
