"use client";

export const dynamic = "force-dynamic";

// Agent Duel page within the UACP v5 cinematic shell.
// Dynamically imports the full agent-dual app (SSR disabled — browser-only).
import dynamicImport from "next/dynamic";

const AgentDualApp = dynamicImport(
  () => import("@/app/agent-dual/page"),
  { ssr: false }
);

export default function AgentDuelPage() {
  return <AgentDualApp />;
}
