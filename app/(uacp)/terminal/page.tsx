"use client";

import dynamic from "next/dynamic";
import React from "react";
import TriageTelemetry from "@/components/telemetry/TriageTelemetry";

const QuantumTerminal = dynamic(() => import("@/components/terminal/components/QuantumTerminal"), { ssr: false });

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
