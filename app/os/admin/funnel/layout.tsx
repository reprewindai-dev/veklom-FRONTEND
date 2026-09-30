import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Funnel",
  description: "Admin-only first-party funnel analytics.",
  robots: { index: false, follow: false },
};

export default function FunnelLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
