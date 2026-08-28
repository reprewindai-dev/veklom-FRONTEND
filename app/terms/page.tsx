import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: `Terms of Service | Veklom` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="Terms of Service" description="Terms of Service users agree to." />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: `<p>GitHub OAuth, Device Flow, installation access, or repository access does not by itself authorize consequence-bearing actions. Repository writes, workflow dispatches, deployments, and other consequential operations remain subject to Veklom governance, policy, tenant authority, and evidence controls.</p>` }} />
    </div>
  );
}