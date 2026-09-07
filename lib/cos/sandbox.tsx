"use client";

import { createContext, useContext } from "react";

const SandboxContext = createContext(true);

export const SandboxProvider = SandboxContext.Provider;

export function useSandboxMode() {
  return useContext(SandboxContext);
}
