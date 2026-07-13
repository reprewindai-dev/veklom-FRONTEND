"use client";

import React from "react";
import Shell from "@/components/Shell";

export default function RepoRiskGatePage() {
  return (
    <Shell>
      <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
        <iframe
          src="https://repogate.veklom.com"
          className="w-full h-full border-0"
          title="Veklom Repo Gate"
          allow="clipboard-read; clipboard-write; display-capture; geolocation; microphone; camera"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </div>
    </Shell>
  );
}
