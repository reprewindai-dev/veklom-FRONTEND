import type { Metadata } from"next";
import { AppShell } from"@/components/cos/AppShell";
import BreadcrumbJsonLd from"@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
 title: {
 default:"Capability OS · Veklom",
 template:"%s · Capability OS · Veklom",
 },
 description:"Veklom Capability OS — the trust layer machines pass through. Prove identity, capability, governance, execution, evidence, and settlement.",
 openGraph: {
 type: "website",
 siteName: "Veklom Capability OS",
 title: "Capability OS · Veklom",
 description: "Veklom Capability OS — the trust layer machines pass through.",
 url: "/os",
 images: [{ url: "/og-capability-os.jpg", width: 1024, height: 1024, alt: "Veklom Capability OS" }],
 },
 twitter: {
 card: "summary_large_image",
 title: "Capability OS · Veklom",
 description: "Veklom Capability OS — the trust layer machines pass through.",
 images: ["/og-capability-os.jpg"],
 },
};

import { cookies } from"next/headers";

export default async function CapabilityOsLayout({ children }: { children: React.ReactNode }) {
 // Opt out of static prerendering so the auth guards correctly process the request on every load
 await cookies();

 return (
 <>
 <BreadcrumbJsonLd
 items={[
 { name:"Veklom", href:"https://veklom.com" },
 { name:"Capability OS", href:"https://veklom.com/os" },
 ]}
 />
 <AppShell>{children}</AppShell>
 </>
 );
}
