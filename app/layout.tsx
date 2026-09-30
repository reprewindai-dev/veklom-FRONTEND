import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { BRANDS, DEFAULT_ORIGIN, brandForHost, brandShareMetadata, originFromHost } from "@/lib/brandMetadata";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth-context";
import { WebMCPProvider } from "@/components/vnp/WebMCPProvider";
import AmbientIntervention from "@/components/ambient/AmbientIntervention";
import DegradedBanner from "@/components/DegradedBanner";
import PrivacyRuntime from "@/components/privacy/PrivacyRuntime";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const TITLE = "Veklom - Capability OS for Governed Machine Action";
const DESC = "Mount a capability. Bind it to identity, policy, budget, and time. Execute through a governed boundary. Preserve evidence after the machine disappears.";

const baseMetadata: Metadata = {
  metadataBase: new URL(DEFAULT_ORIGIN),
  applicationName: "Veklom",
  title: {
    default: TITLE,
    // Child titles already carry their own "| Veklom" / "· Veklom" suffix; the
    // old "%s | Veklom" template produced "VLink | Veklom | Veklom".
    template: "%s",
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
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
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
    "machine:discovery": "/machine",
    "machine:mcp": "/mcp/manifest.json",
  },
};

/**
 * The share card, icons and metadataBase follow the request host: veklom.com
 * gets the Veklom card, os.veklom.com the Capability OS card (same Next app).
 * Unknown hosts fall back to https://veklom.com. Canonical is set on the home
 * page and /vlink rather than here, so it is not inherited by every route.
 */
export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host");
  const origin = originFromHost(host);
  const brand = brandForHost(host);
  const share = brandShareMetadata(brand, origin, "/");
  const brandIcons = share.icons as { icon: object[]; apple: object[] };

  return {
    ...baseMetadata,
    metadataBase: new URL(origin),
    title: { default: brand === "veklom" ? TITLE : BRANDS[brand].title, template: "%s" },
    description: brand === "veklom" ? DESC : BRANDS[brand].description,
    icons: {
      icon: [
        ...brandIcons.icon,
        { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: [{ url: "/favicon.ico" }],
      apple: brandIcons.apple,
    },
    openGraph: share.openGraph,
    twitter: share.twitter,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0A",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head></head>
      <body className={`min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] antialiased ${inter.variable} ${fraunces.variable} ${jetBrainsMono.variable}`} suppressHydrationWarning>
        <ThemeProvider>
          <WebMCPProvider>
            <AuthProvider>
              <DegradedBanner />
              <div className="flex min-h-screen flex-1 flex-col">
                {children}
              </div>
              <AmbientIntervention />
            </AuthProvider>
          </WebMCPProvider>
        </ThemeProvider>
        <PrivacyRuntime gaId={gaId} />
      </body>
    </html>
  );
}
