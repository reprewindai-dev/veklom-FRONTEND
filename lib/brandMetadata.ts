import type { Metadata } from "next";

/**
 * Per-product share cards (Open Graph / Twitter) and icons.
 *
 * The same Next.js app answers veklom.com and os.veklom.com, so the brand is
 * chosen from the request host. vlink.veklom.com is served by the separate
 * VLink app; the VLink brand here covers veklom.com/vlink.
 */
export type BrandKey = "veklom" | "capability-os" | "vlink";

export const DEFAULT_ORIGIN = "https://veklom.com";

type BrandCard = {
  title: string;
  description: string;
  siteName: string;
  image: string;
  imageAlt: string;
  favicon32: string;
  appleTouch180: string;
};

export const BRANDS: Record<BrandKey, BrandCard> = {
  veklom: {
    title: "Veklom — M2M Trust Infrastructure",
    description:
      "Mount a capability. Bind it to identity, policy, budget, and time. Execute through a governed boundary. Preserve evidence after the machine disappears.",
    siteName: "Veklom",
    image: "/brand/og/veklom-og-1200x630.png",
    imageAlt: "Veklom — M2M Trust Infrastructure",
    favicon32: "/brand/og/veklom-favicon-32.png",
    appleTouch180: "/brand/og/veklom-apple-touch-180.png",
  },
  "capability-os": {
    title: "Capability OS — Governed machines. Verifiable actions.",
    description:
      "Veklom Capability OS — the trust layer machines pass through. Prove identity, capability, governance, execution, evidence, and settlement.",
    siteName: "Veklom Capability OS",
    image: "/brand/og/capability-os-og-1200x630.png",
    imageAlt: "Capability OS — Governed machines. Verifiable actions.",
    favicon32: "/brand/og/capability-os-favicon-32.png",
    appleTouch180: "/brand/og/capability-os-apple-touch-180.png",
  },
  vlink: {
    title: "VLink — Governed agent connections",
    description: "The low-friction portable connection primitive into Veklom.",
    siteName: "Veklom VLink",
    image: "/brand/og/vlink-og-1200x630.png",
    imageAlt: "VLink — Governed agent connections",
    favicon32: "/brand/og/vlink-favicon-32.png",
    appleTouch180: "/brand/og/vlink-apple-touch-180.png",
  },
};

const HOST_PATTERN = /^[a-z0-9.-]+(:\d+)?$/i;

/** Absolute https origin for the request host; falls back to https://veklom.com. */
export function originFromHost(host: string | null | undefined): string {
  const value = (host || "").trim().toLowerCase();
  if (!value || !HOST_PATTERN.test(value)) return DEFAULT_ORIGIN;
  const bare = value.replace(/:\d+$/, "");
  if (bare === "veklom.com" || bare.endsWith(".veklom.com")) return `https://${bare}`;
  return DEFAULT_ORIGIN;
}

export function brandForHost(host: string | null | undefined): BrandKey {
  const bare = (host || "").trim().toLowerCase().replace(/:\d+$/, "");
  if (bare.startsWith("os.")) return "capability-os";
  if (bare.startsWith("vlink.")) return "vlink";
  return "veklom";
}

/** Open Graph, Twitter, canonical and icon metadata for one brand, with absolute URLs. */
export function brandShareMetadata(brand: BrandKey, origin: string, path = "/"): Metadata {
  const card = BRANDS[brand];
  const url = `${origin}${path}`;
  const image = `${origin}${card.image}`;
  return {
    alternates: { canonical: url },
    icons: {
      icon: [{ url: card.favicon32, sizes: "32x32", type: "image/png" }],
      apple: [{ url: card.appleTouch180, sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      type: "website",
      siteName: card.siteName,
      title: card.title,
      description: card.description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: card.imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@veklom",
      creator: "@veklom",
      title: card.title,
      description: card.description,
      images: [image],
    },
  };
}
