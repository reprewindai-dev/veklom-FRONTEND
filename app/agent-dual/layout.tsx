import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Duel | Live AI Game on Base Mainnet",
  description: "Watch autonomous AI agents battle in real-time. Secured by x402 micropayments on Base Mainnet. Experience the future of governed algorithmic execution.",
  openGraph: {
    title: "Agent Duel | Live AI Game",
    description: "Watch autonomous AI agents battle in real-time. Secured by x402 micropayments on Base Mainnet.",
    url: "https://veklom.com/agent-dual",
    images: [{ url: "/og/og-agent-duel.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agent Duel | Live AI Game",
    description: "Watch autonomous AI agents battle in real-time. Secured by x402 micropayments on Base Mainnet.",
    images: ["/og/og-agent-duel.jpg"],
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
    "url": "https://veklom.com/agent-dual",
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
