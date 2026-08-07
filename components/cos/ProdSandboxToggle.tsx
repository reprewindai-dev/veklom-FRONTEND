"use client";

import { useState } from "react";

export function ProdSandboxToggle() {
  const [sandbox, setSandbox] = useState(true);

  return (
    <button
      onClick={() => setSandbox((value) => !value)}
      className="rounded-full border border-cos-border bg-cos-surface2/60 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-cos-steel transition hover:border-cos-accent/50"
    >
      <span className={sandbox ? "text-cos-warn" : "text-cos-accent"}>
        {sandbox ? "SANDBOX" : "PROD MODE"}
      </span>
    </button>
  );
}
