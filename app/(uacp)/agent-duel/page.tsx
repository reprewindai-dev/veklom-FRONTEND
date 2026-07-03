"use client";

// Agent Duel page within the UACP v5 cinematic shell.
// The agent-dual page is a large, self-contained component. We render it here
// directly by delegating to the agent-dual page component.
// Note: this works because app/agent-dual/page.tsx is a valid React component.

import dynamic from "next/dynamic";

const AgentDualApp = dynamic(
  () => import("@/app/agent-dual/page"),
  { ssr: false }
);

export default function AgentDuelPage() {
  return <AgentDualApp />;
}
