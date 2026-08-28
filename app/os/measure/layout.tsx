import type { Metadata } from"next";
import BreadcrumbJsonLd from"@/components/seo/BreadcrumbJsonLd";

export const metadata: Metadata = {
 title:"Measure",
 description:"Benchmark capability execution performance with physics-verified telemetry in the Veklom Capability OS.",
};

export default function MeasureLayout({ children }: { children: React.ReactNode }) {
 return (
 <>
 <BreadcrumbJsonLd
 items={[
 { name:"Veklom", href:"https://veklom.com" },
 { name:"Capability OS", href:"https://veklom.com/os" },
 { name:"Measure" },
 ]}
 />
 {children}
 </>
 );
}
