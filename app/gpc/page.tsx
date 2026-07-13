"use client";

import React from "react";
import Shell from "@/components/Shell";

export default function GpcPage() {
  return (
    <Shell>
      <div className="w-full h-[calc(100vh-64px)] overflow-hidden">
        <iframe
          src="https://uacpv3.onrender.com"
          className="w-full h-full border-0"
          title="Veklom GPC Pipeline"
          allow="clipboard-read; clipboard-write; display-capture; geolocation; microphone; camera"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
        />
      </div>
    </Shell>
  );
}
