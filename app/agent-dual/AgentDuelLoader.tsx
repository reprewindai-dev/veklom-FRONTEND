"use client";

import dynamic from "next/dynamic";

const AgentDuelClient = dynamic(() => import("./AgentDuelClient"), { ssr: false });

export default function AgentDuelLoader() {
  return <AgentDuelClient />;
}
