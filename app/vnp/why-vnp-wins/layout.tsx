import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Why VNP Wins | The End of Legacy API Benchmarks',
  description: 'How the Veklom Nexus Protocol replaces opaque, marketing-driven benchmarks (ABI/CASC) with live, physics-verified infrastructure telemetry.',
  keywords: ['Legacy API Benchmarks vs VNP', 'VNP vs ABI', 'VNP vs CASC', 'AI API reliability', 'Physics-based SLAs'],
};

export default function WhyVnpWinsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
