import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Methodology | Veklom Nexus Protocol (VNP)',
  description: 'The public standard for physics-based API benchmarking. Learn how Option-C math, Merkle roots, and Ed25519 signatures power the VNP 10-D Trust Matrix.',
  keywords: ['VNP Methodology', 'API benchmarking standard', 'Option-C latency', 'x402 settlement', 'Merkle root proofs'],
};

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}
