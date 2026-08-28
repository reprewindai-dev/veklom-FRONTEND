import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: `Subprocessors | Veklom` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="Subprocessors" description="List of authorized third-party service providers." />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: `<p>Veklom engages the following subprocessors. We do not invent vendors or share data unnecessarily.</p><ul><li>GitHub - OAuth, Device Flow, App installation</li><li>Cloudflare - DNS, edge routing</li></ul>` }} />
    </div>
  );
}