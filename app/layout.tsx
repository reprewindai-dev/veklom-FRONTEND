import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { WebMCPProvider } from "@/components/vnp/WebMCPProvider";
import AmbientIntervention from "@/components/ambient/AmbientIntervention";
import { GoogleAnalytics } from '@next/third-parties/google';

const inter = Inter({ subsets: ["latin"] });
const BASE = "/control-plane-next";
const TITLE = "Veklom Control Plane";
const DESC = "Veklom — the Sovereign AI Hub. Test, plan, govern, deploy, and prove private AI from one tenant-scoped workspace.";
// Official Veklom brand package (raster) served at the site root + /static/branding.
// These are the exact assets the main veklom.com site uses for social cards.
const OG_IMAGE = "/og/og-home.jpg";
const TWITTER_IMAGE = "/og/og-home.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://control.veklom.com"),
  applicationName: "Veklom",
  title: {
    default: TITLE,
    template: "%s · Veklom",
  },
  description: DESC,
  keywords: ["Veklom", "Sovereign AI", "AI governance", "control plane", "private AI", "compliance", "AI routing", "Agentic Governance", "API benchmarking", "Runtime authority", "physics-based SLAs"],
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || "",
  },
  authors: [{ name: "Veklom" }],
  creator: "Veklom",
  publisher: "Veklom",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.svg" }],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  manifest: `${BASE}/site.webmanifest`,
  openGraph: {
    type: "website",
    siteName: "Veklom · Sovereign AI Hub",
    title: TITLE,
    description: DESC,
    url: `${BASE}/`,
    images: [{ url: OG_IMAGE, width: 1792, height: 1024, alt: "Veklom — Sovereign AI Hub" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@veklom",
    creator: "@veklom",
    title: TITLE,
    description: DESC,
    images: [TWITTER_IMAGE],
  },
  // Belt-and-suspenders: this is a preview/staging surface. The backend also
  // sends X-Robots-Tag: noindex for /control-plane-next, but we set the meta
  // tag too so the preview is never indexed.
  robots: { index: true, follow: true },
  // Base Network App ID — domain ownership verification for veklom.com
  other: {
    "base:app_id": "6a31ef5406f4fa4223585905",
    "fc:frame": JSON.stringify({
      version: "1",
      name: "Veklom Control Plane",
      appId: "6a20f24cc341f72c2f573eb5",
    }),
    "x402:payTo": "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970",
    "x402:network": "eip155:8453",
    "x402:discovery": "/.well-known/x402.json",
    "veklom:id-wallet": "0x3a74772e925b54F7dAD7FD95c9Ba30825033f970",
    "veklom:service": "control-plane",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied'
              });
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-900 text-ink-50 antialiased">
        <WebMCPProvider>
          <AuthProvider>
            {children}
            <AmbientIntervention />
          </AuthProvider>
        </WebMCPProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-KCZM27WWX7"} />
      </body>
    </html>
  );
}
