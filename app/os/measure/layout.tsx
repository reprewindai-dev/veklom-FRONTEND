import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Measure",
  description: "Observe measured performance and reliability of capability execution. Unmeasured values stay empty; measurement never grants authority.",
};

export default function MeasureLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Veklom", href: "https://veklom.com" },
          { name: "Capability OS", href: "https://veklom.com/os" },
          { name: "Measure" },
        ]}
      />
      {children}
    </>
  );
}
