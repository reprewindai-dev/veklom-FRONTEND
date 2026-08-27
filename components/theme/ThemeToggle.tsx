"use client";

import React, { useRef } from "react";
import { useTheme, Theme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="flex bg-theme-surface border border-theme-border p-1 rounded-md shadow-sm">
      {(["light", "dark"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={"px-3 py-1 text-xs font-mono font-bold rounded-sm transition-all " + (theme === t ? "bg-theme-bg text-theme-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-theme-border" : "text-theme-inkDim hover:text-theme-ink")}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}
