import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: `Acceptable Use Policy | Veklom` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="Acceptable Use Policy" description="User conduct and prohibited uses." />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: `<p>No illegal activity, no credential theft, no malware...</p>` }} />
    </div>
  );
}