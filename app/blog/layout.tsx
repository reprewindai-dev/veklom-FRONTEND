import type { Metadata } from "next";
import VeklomFooter from "@/components/marketing/VeklomFooter";

export const metadata: Metadata = {
  title: "Veklom Blog | Sovereign AI Engineering & Governance",
  description: "Deep technical insights on Runtime Authority, Agentic Workflows, and physics-based SLAs. The engineering blog of Veklom.",
  openGraph: {
    title: "Veklom Blog",
    description: "Deep technical insights on Runtime Authority, Agentic Workflows, and physics-based SLAs.",
    url: "https://veklom.com/blog",
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Veklom Engineering Blog",
    "description": "Deep technical insights on Runtime Authority and AI Governance.",
    "url": "https://veklom.com/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Veklom"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="min-h-[calc(100vh-64px)]">
        {children}
      </div>
      <VeklomFooter />
    </>
  );
}
