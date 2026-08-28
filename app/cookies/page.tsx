import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: `Cookie Policy | Veklom` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="Cookie Policy" description="Cookie/session notice." />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: `<p>We use essential cookies including the veklom_session HTTP-only cookie and GitHub OAuth state cookies.</p>` }} />
    </div>
  );
}