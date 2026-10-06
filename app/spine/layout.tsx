import type { Metadata } from "next";

// /spine renders simulated data from lib/spine/mockData.ts. It is kept as a
// walkthrough but must not be indexed or presented as a live fabric.
export const metadata: Metadata = {
  title: "Veklom / Spine (simulated)",
  robots: { index: false, follow: false },
};

export default function SpineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
