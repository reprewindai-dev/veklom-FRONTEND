/**
 * UACP V3 Embed Page — Server Component
 *
 * Embeds the deployed UACP V3 Control Plane (uacpv3.veklom.com)
 * as a full-viewport iframe within the Veklom control plane shell.
 *
 * Kept as a Server Component (no 'use client') to avoid the
 * Next.js 15 route-group client-reference-manifest build bug on Vercel.
 * The client-side iframe is rendered via UacpEmbed (a child client component).
 */

import UacpEmbed from './uacp-embed';

export default function UacpPage() {
  return <UacpEmbed />;
}
