"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function TerminalPage() {
  // The active terminal is agent-control-need-pgl — a standalone UACP v5 Vite app.
  // We host it standalone in production at terminal.veklom.com.
  const [terminalUrl, setTerminalUrl] = useState<string>("https://terminal.veklom.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const defaultUrl = isLocal ? "http://localhost:3003" : "https://terminal.veklom.com";
      setTerminalUrl(process.env.NEXT_PUBLIC_TERMINAL_URL || defaultUrl);
    }
  }, []);

  return (
    <div className="w-full h-screen overflow-hidden bg-black flex flex-col">
      {/* Minimal status bar so the user knows they're in the terminal */}
      <div className="h-7 bg-black border-b border-white/10 flex items-center gap-3 px-4 shrink-0">
        <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shadow-[0_0_6px_#00E5FF]" />
        <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">
          UACP v5 — Swarm Terminal
        </span>
        <span className="ml-auto text-[9px] font-mono text-white/25">
          agent-control-need-pgl
        </span>
      </div>

      {/* Full-screen iframe into the live terminal */}
      <iframe
        src={terminalUrl}
        className="flex-1 w-full border-none"
        title="Veklom UACP v5 Swarm Terminal"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
}
