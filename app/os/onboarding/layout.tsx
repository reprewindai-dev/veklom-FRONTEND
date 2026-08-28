import type { Metadata } from"next";
import BreadcrumbJsonLd from"@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
 title:"Onboarding",
 description:"Set up your Veklom Capability OS workspace — connect your identity, configure governance, and mount your first capability.",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
 return (
 <>
 <BreadcrumbJsonLd
 items={[
 { name:"Veklom", href:"https://veklom.com" },
 { name:"Capability OS", href:"https://veklom.com/os" },
 { name:"Onboarding" },
 ]}
 />
 {children}
 </>
 );
}
