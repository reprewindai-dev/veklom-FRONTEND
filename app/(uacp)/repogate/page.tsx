"use client";

import React from "react";
import Shell from "@/components/Shell";
import { ModuleHeader, Pill } from "@/components/telemetry";

export default function RepogatePage() {
  return (
    <Shell>
      <ModuleHeader
        breadcrumb="Operations · RepoGate Terminal"
        title="RepoGate Governance Terminal"
        subtitle="100% PGL-Verified Agent Pipeline & MCP Integration Hub"
        pills={
          <>
            <Pill tone="green" dot>All Agents Cleared</Pill>
            <Pill tone="cyan">MCP API Live</Pill>
            <Pill tone="violet">Cappo Connected</Pill>
          </>
        }
      />
      <div className="w-full h-[85vh] rounded-xl overflow-hidden border border-[#222]">
        <iframe src="https://repogate.veklom.com" className="w-full h-full border-none" title="RepoGate App" />
      </div>
    </Shell>
  );
}
