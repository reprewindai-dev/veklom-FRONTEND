"use client";

import dynamicImport from "next/dynamic";

const InteractiveLandingTerminal = dynamicImport(
  () => import("@/components/terminal/App"),
  { ssr: false, loading: () => <div className="h-screen w-screen bg-[#030303] flex items-center justify-center text-[#00E5FF] font-mono animate-pulse">INITIALIZING VEKLOM TERMINAL...</div> }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-[#030303] text-white overflow-hidden selection:bg-[#00E5FF]/30">
      <InteractiveLandingTerminal defaultTab="terminal" />
    </main>
  );
}
