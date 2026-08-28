import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import { HumanAppShell } from "@/components/shell/HumanAppShell";

export const metadata = {
  title: 'Conformance | Veklom',
};

export default function ConformancePage() {
  const filePath = path.join(process.cwd(), 'docs', 'conformance.md');
  let markdown = '';
  try {
    markdown = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    markdown = '# Conformance Matrix\n\nConformance data is being compiled.';
  }

  return (
    <HumanAppShell>
      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="prose prose-invert max-w-none text-theme-ink prose-headings:text-theme-ink prose-a:text-theme-accent prose-code:text-theme-accent prose-strong:text-theme-ink">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </main>
    </HumanAppShell>
  );
}
