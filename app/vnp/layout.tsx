import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Veklom Nexus Protocol (VNP) | The Physics-Based Benchmark',
  description: 'Scores backed by physics, cryptography, and five live regions — not marketing. VNP benchmarks the APIs that matter to enterprise AI routing.',
  keywords: ['Veklom', 'VNP', 'API benchmarking', 'physics-based SLAs', 'AI routing', 'x402 settlement', 'crypto-verified telemetry', 'Agentic Governance'],
  openGraph: {
    title: 'Veklom Nexus Protocol (VNP) | Trust through Physics',
    description: 'VNP replaces legacy SLA monitoring with 5-region physical networking and cryptographically anchored benchmarks for AI routing.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Veklom Nexus Protocol (VNP)',
    description: 'Scores backed by physics, cryptography, and five live regions — not marketing.',
  }
};

export default function VnpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Veklom Nexus Protocol (VNP)",
    "operatingSystem": "Web",
    "applicationCategory": "DeveloperApplication",
    "description": "A decentralized, physics-verified API benchmarking standard and settlement network.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "provider": {
      "@type": "Organization",
      "name": "Veklom"
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
