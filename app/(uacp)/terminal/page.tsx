"use client";

import dynamic from "next/dynamic";
import React from "react";
import TriageTelemetry from "@/components/telemetry/TriageTelemetry";

// QuantumTerminal depends on @reown/appkit-adapter-wagmi → mppx → broken zod shim.
// Load with ssr: false and a fallback so it doesn't break the build.
const QuantumTerminal = dynamic(
  () => import("@/components/terminal/components/QuantumTerminal").catch(() => ({ default: () => (
    <div className="flex items-center justify-center h-full font-mono text-xs text-[#8A9BB0]">
      Terminal loading…
    </div>
  )})),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-full font-mono text-xs text-[#8A9BB0]">
      Initialising terminal…
    </div>
  )}
);

export default function TerminalPage() {
  return (
    <div className="w-full h-full flex flex-col xl:flex-row overflow-hidden">
      <div className="flex-grow h-full relative min-w-0">
        <QuantumTerminal />
      </div>
      <div className="w-full xl:w-96 shrink-0 h-full border-t xl:border-t-0 xl:border-l border-white/5 bg-[#030303]/85 overflow-y-auto">
        <TriageTelemetry context="terminal" />
      </div>
    </div>
  );
}
