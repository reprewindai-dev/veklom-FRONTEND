/**
 * BreadcrumbJsonLd — server component (no "use client")
 *
 * Injects a schema.org BreadcrumbList JSON-LD script into any layout or page.
 * The last item does NOT need an `item` URL — Google infers it from the
 * canonical page URL per the spec.
 *
 * Usage:
 *   <BreadcrumbJsonLd
 *     items={[
 *       { name: "Veklom", href: "https://veklom.com" },
 *       { name: "Capability OS", href: "https://veklom.com/os" },
 *       { name: "Blueprint" },   // last item — href optional
 *     ]}
 *   />
 */

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface Props {
  items: BreadcrumbItem[];
}

export default function BreadcrumbJsonLd({ items }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.href ? { item: item.href } : {}),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
