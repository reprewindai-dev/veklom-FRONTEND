"use client";

import React, { useRef } from "react";
import { useTheme, Theme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isTransitioning = useRef(false);

  const handleThemeChange = (newTheme: Theme) => {
    if (newTheme === theme || isTransitioning.current) return;

    if (newTheme === "machine" || theme === "machine") {
      isTransitioning.current = true;
      document.body.classList.add("machine-transition-active");
      
      setTimeout(() => {
        setTheme(newTheme);
      }, 400); 

      setTimeout(() => {
        document.body.classList.remove("machine-transition-active");
        isTransitioning.current = false;
      }, 800);
    } else {
      setTheme(newTheme);
    }
  };

  return (
    <div className="flex bg-theme-surface border border-theme-border p-1 rounded-md shadow-sm">
      {(["light", "dark", "machine"] as const).map((t) => (
        <button
          key={t}
          onClick={() => handleThemeChange(t)}
          className={"px-3 py-1 text-xs font-mono font-bold rounded-sm transition-all " + (theme === t ? "bg-theme-bg text-theme-ink shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-theme-border" : "text-theme-inkDim hover:text-theme-ink")}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  );
}
