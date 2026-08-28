import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: `Documentation | Veklom` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="Documentation" description="Product setup and integration documentation." />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: `<p>Veklom�s public demo may show backend demo-harness behavior unless explicitly marked canonical-evidence-backed.</p><h3>GitHub App Installation</h3><p>Guide to installing...</p>` }} />
    </div>
  );
}