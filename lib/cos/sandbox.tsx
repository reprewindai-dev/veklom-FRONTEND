"use client";

import { createContext, useContext } from "react";

const SandboxContext = createContext(false);

export const SandboxProvider = SandboxContext.Provider;

export function readEnvironmentIsSandbox(): boolean {
  return typeof window !== "undefined" && window.localStorage.getItem("veklom.environment") === "sandbox";
}

export function useSandboxMode() {
  return useContext(SandboxContext);
}
