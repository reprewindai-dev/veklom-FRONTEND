import type { Metadata } from "next";
import { AppShell } from "@/components/cos/AppShell";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: {
    default: "Capability OS · Veklom",
    template: "%s · Capability OS · Veklom",
  },
  description:
    "Veklom Capability OS — the trust layer machines pass through. Prove identity, capability, governance, execution, evidence, and settlement.",
};

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
