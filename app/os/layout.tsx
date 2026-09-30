import type { Metadata } from "next";
import { headers } from "next/headers";
import { AppShell } from "@/components/cos/AppShell";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";
import { BRANDS, brandShareMetadata, originFromHost } from "@/lib/brandMetadata";

export async function generateMetadata(): Promise<Metadata> {
  const origin = originFromHost((await headers()).get("host"));
  return {
    ...brandShareMetadata("capability-os", origin, "/os"),
    title: {
      default: "Capability OS · Veklom",
      template: "%s · Capability OS · Veklom",
    },
    description: BRANDS["capability-os"].description,
  };
}

export default function CapabilityOsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Veklom", href: "https://veklom.com" },
          { name: "Capability OS", href: "https://veklom.com/os" },
        ]}
      />
      <AppShell>{children}</AppShell>
    </>
  );
}
