"use client";

import { createContext, useContext } from "react";

const SandboxContext = createContext(true);

export const SandboxProvider = SandboxContext.Provider;

export function useSandboxMode() {
  return useContext(SandboxContext);
}

export function readEnvironmentIsSandbox(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("veklom.environment") === "sandbox";
}
