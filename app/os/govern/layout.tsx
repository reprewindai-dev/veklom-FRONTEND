import type { Metadata } from"next";
import BreadcrumbJsonLd from"@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
 title:"Govern",
 description:"Apply jurisdiction, policy rules, and PII shaping to capability executions in the Veklom Capability OS.",
};

export default function GovernLayout({ children }: { children: React.ReactNode }) {
 return (
 <>
 <BreadcrumbJsonLd
 items={[
 { name:"Veklom", href:"https://veklom.com" },
 { name:"Capability OS", href:"https://veklom.com/os" },
 { name:"Govern" },
 ]}
 />
 {children}
 </>
 );
}
