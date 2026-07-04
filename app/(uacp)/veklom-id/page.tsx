"use client";

export const dynamic = "force-dynamic";

import React from "react";

export default function VeklomIdPage() {
  return (
    <div className="w-full h-full bg-[#030303] overflow-hidden">
      <iframe 
        src="https://id.veklom.com" 
        className="w-full h-full border-0" 
        title="Veklom ID Layer 1" 
      />
    </div>
  );
}
