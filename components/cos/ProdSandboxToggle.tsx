"use client";

import { useState, useEffect } from "react";

export function ProdSandboxToggle() {
  const [sandbox, setSandbox] = useState(true);

  useEffect(() => {
    const env = window.localStorage.getItem("veklom.environment");
    if (env === "production") {
      setSandbox(false);
    } else {
      window.localStorage.setItem("veklom.environment", "sandbox");
    }
  }, []);

  const toggleSandbox = () => {
    const nextState = !sandbox;
    setSandbox(nextState);
    window.localStorage.setItem("veklom.environment", nextState ? "sandbox" : "production");
    window.dispatchEvent(new Event("veklom.environment.changed"));
  };

  return (
    <button
      onClick={toggleSandbox}
      className="rounded-full border border-cos-border bg-cos-surface2/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel transition hover:border-cos-accent/50"
    >
      <span className={sandbox ? "text-cos-warn" : "text-cos-accent"}>
        {sandbox ? "SANDBOX" : "PROD MODE"}
      </span>
    </button>
  );
}
