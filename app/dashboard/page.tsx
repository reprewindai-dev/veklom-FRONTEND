"use client";

import dynamicImport from "next/dynamic";

const HighFidelityTerminal = dynamicImport(
  () => import("@/components/terminal/App"),
  { ssr: false }
);

export default function DashboardPage() {
  return <HighFidelityTerminal defaultTab="overview" />;
}
