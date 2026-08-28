import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: `Support | Veklom` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="Support" description="Support contact page for GitHub review and customers." />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: `<p>For product, installation, account, Marketplace, or GitHub App support, contact <a href="mailto:support@veklom.com">support@veklom.com</a>. For suspected security issues, credential exposure, webhook abuse, or vulnerability reports, contact <a href="mailto:security@veklom.com">security@veklom.com</a>.</p>` }} />
    </div>
  );
}