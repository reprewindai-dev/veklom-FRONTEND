"use client";

import React, { useEffect } from 'react';
import { useWebMCP } from '@/hooks/useWebMCP';

export function WebMCPProvider({ children }: { children: React.ReactNode }) {
  // Simply calling useWebMCP() at the root level will initialize 
  // the navigator.modelContext polyfill for all child components
  // and any iframes that look up to window.parent.
  useWebMCP();

  return <>{children}</>;
}
