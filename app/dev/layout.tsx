import type { Metadata } from "next";

const TITLE = "Veklom — Verifiable Intent Orchestration";
const DESC =
  "M2M trust infrastructure for autonomous software. Every machine call gets identity, policy, a verdict, and evidence: IDENTITY → POLICY → SAFETY → COST → APPROVAL → EXECUTION → EVIDENCE → AUDIT → RESPONSE.";

export const metadata: Metadata = {
  metadataBase: new URL("https://veklom.dev"),
  title: TITLE,
  description: DESC,
  keywords: [
    "Veklom",
    "Verifiable Intent Orchestration",
    "VIO",
    "M2M trust infrastructure",
    "runtime authority",
    "governed execution",
    "capability mounts",
    "ephemeral execution tokens",
    "cryptographic evidence",
    "PGL",
    "Covenant",
    "cAPI",
  ],
  alternates: { canonical: "https://veklom.dev" },
  openGraph: {
    type: "website",
    siteName: "Veklom — Verifiable Intent Orchestration",
    title: TITLE,
    description: DESC,
    url: "https://veklom.dev",
    images: [{ url: "/og/og-home.jpg", alt: "Veklom — Verifiable Intent Orchestration" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@veklom",
    creator: "@veklom",
    title: TITLE,
    description: DESC,
    images: ["/og/og-home.jpg"],
  },
};

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return children;
}
