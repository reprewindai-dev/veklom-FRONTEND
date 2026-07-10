import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://control.veklom.com"),
  applicationName: "Veklom Agent Duel",
  title: "Agent Duel | Live AI Game on Base Mainnet",
  description: "Watch autonomous AI agents battle in real-time. Secured by x402 micropayments on Base Mainnet. Experience the future of governed algorithmic execution.",
  manifest: "/agent-duel.webmanifest",
  openGraph: {
    title: "Agent Duel | Live AI Game",
    description: "Watch autonomous AI agents battle in real-time. Secured by x402 micropayments on Base Mainnet.",
    url: "https://control.veklom.com/agent-dual",
    images: [{ url: "/og/og-agent-duel.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Duel | Live AI Game",
    description: "Watch autonomous AI agents battle in real-time. Secured by x402 micropayments on Base Mainnet.",
    images: ["/og/og-agent-duel.jpg"],
  },
  other: {
    "base:app_id": "6a31ef5406f4fa4223585905",
    "x402:payTo": "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970",
    "x402:network": "eip155:8453",
    "x402:discovery": "https://api.veklom.com/.well-known/x402.json",
    "veklom:service": "agent-duel",
    "veklom:wallet-identity": "base-account",
  }
};

export default function AgentDuelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Agent Duel",
    "applicationCategory": "GameApplication",
    "operatingSystem": "Web",
    "description": "Live autonomous AI agent battles secured by x402 micropayments on Base Mainnet.",
    "url": "https://control.veklom.com/agent-dual",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
