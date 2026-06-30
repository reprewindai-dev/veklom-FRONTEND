'use client';

import React from 'react';
import TerminalApp from "@/components/terminal/App";

export default function RuntimePage() {
  return (
    <div className="w-full h-screen overflow-hidden">
      <TerminalApp defaultTab="runtime" />
    </div>
  );
}
