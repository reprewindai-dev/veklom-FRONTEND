"use client";

import { ConnectorsHub } from "@/components/cos/ConnectorsHub";

/**
 * Connectors & MCP Hub:
 * The operator's sovereign control plane for enterprise tools, M365 (Teams, OneDrive, Outlook),
 * cloud platforms (GCP, Azure), and custom user-provided MCP servers.
 *
 * Invariant: You own the consequence authority. Connectors hold zero ambient power.
 */
export default function ConnectorsPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <ConnectorsHub />
    </div>
  );
}
