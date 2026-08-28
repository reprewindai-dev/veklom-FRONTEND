import { PageHeader } from "@/components/ui/SharedUI";

export const metadata = { title: `Security Policy | Veklom` };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 w-full">
      <PageHeader title="Security Policy" description="Security policy." />
      <div className="prose prose-invert max-w-none text-theme-inkDim mt-8 [&>h3]:text-theme-ink [&>h3]:mb-2 [&>h3]:mt-8 [&>p]:mb-4" dangerouslySetInnerHTML={{ __html: `<p>Do not submit secrets, private keys, access tokens, refresh tokens, installation tokens, or production credentials in public issues, screenshots, chats, or pull requests.</p>` }} />
    </div>
  );
}