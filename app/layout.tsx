import type { Metadata, Viewport } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth-context";
import { WebMCPProvider } from "@/components/vnp/WebMCPProvider";
import AmbientIntervention from "@/components/ambient/AmbientIntervention";
import GoogleAnalyticsUserSync from "@/components/GoogleAnalyticsUserSync";
import { GoogleAnalytics } from "@next/third-parties/google";
import CookieBanner from "@/components/CookieBanner";
import DegradedBanner from "@/components/DegradedBanner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const TITLE = "Veklom - Capability OS for Governed Machine Action";
const DESC = "Mount a capability. Bind it to identity, policy, budget, and time. Execute through a governed boundary. Preserve evidence after the machine disappears.";

const OG_IMAGE = "/og/og-home.jpg";
const TWITTER_IMAGE = "/og/og-home.jpg";

export const metadata: Metadata = {
  metadataBase: new URL("https://veklom.com"),
  applicationName: "Veklom",
  title: {
    default: TITLE,
    template: "%s | Veklom",
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
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "Veklom - Capability OS",
    title: TITLE,
    description: DESC,
    url: "/",
    images: [{ url: OG_IMAGE, width: 1792, height: 1024, alt: "Veklom - Capability OS" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@veklom",
    creator: "@veklom",
    title: TITLE,
    description: DESC,
    images: [TWITTER_IMAGE],
  },
  robots: { index: true, follow: true },
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
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] antialiased ${inter.variable} ${fraunces.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <WebMCPProvider>
            <AuthProvider>
              <DegradedBanner />
              <div className="flex-1 flex flex-col min-h-screen">
                {children}
              </div>
              <AmbientIntervention />
              <GoogleAnalyticsUserSync />
            </AuthProvider>
          </WebMCPProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-KCZM27WWX7"} />
        <CookieBanner />
      </body>
    </html>
  );
}
