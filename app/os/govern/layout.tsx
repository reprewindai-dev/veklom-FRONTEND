import type { Metadata } from "next";
import BreadcrumbJsonLd from "@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Govern",
  description: "Lay a plan out as a governed pipeline, check it against the live capability catalog, and compile it to code that can act only under a single-use permit.",
};

export default function GovernLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Veklom", href: "https://veklom.com" },
          { name: "Capability OS", href: "https://veklom.com/os" },
          { name: "Govern" },
        ]}
      />
      {children}
    </>
  );
}
