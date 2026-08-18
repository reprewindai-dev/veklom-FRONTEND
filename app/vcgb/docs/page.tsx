import fs from 'fs';
import path from 'path';
import ReactMarkdown from 'react-markdown';
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function VCGBDocsPage() {
  const filePath = path.join(process.cwd(), 'lib/content/vcgb.md');
  let content = 'Content not found.';
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error(e);
  }

  return (
    <MarketingLayout isMachine={true}>
      <section className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto min-h-screen">
        <div className="prose prose-invert prose-cosmic max-w-none">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-4xl font-bold mb-6 text-cos-text border-b border-cos-border pb-4" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-10 mb-4 text-cos-text" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-8 mb-3 text-cos-text" {...props} />,
              p: ({node, ...props}) => <p className="mb-4 text-cos-text/80 leading-relaxed" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-cos-text/80 space-y-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-cos-text/80 space-y-2" {...props} />,
              li: ({node, ...props}) => <li className="ml-4" {...props} />,
              a: ({node, ...props}) => <a className="text-cos-accent hover:underline" {...props} />,
              code: ({node, inline, ...props}: any) => 
                inline ? 
                  <code className="bg-cos-surface px-1.5 py-0.5 rounded text-sm text-cos-accent font-mono" {...props} /> : 
                  <pre className="bg-cos-bg-dim border border-cos-border p-4 rounded-lg overflow-x-auto mb-6"><code className="text-sm font-mono text-cos-text/90" {...props} /></pre>,
              strong: ({node, ...props}) => <strong className="font-bold text-cos-text" {...props} />,
              hr: ({node, ...props}) => <hr className="my-8 border-cos-border" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-cos-accent pl-4 italic text-cos-text/70 my-6" {...props} />
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </section>
    </MarketingLayout>
  );
}
