import { PageHeader, Card } from "@/components/ui";
import Link from "next/link";
import { Calendar, ChevronRight } from "lucide-react";
import blogsData from "../../data/blog-index.json";

export const metadata = {
  title: "Sovereign AI Blog | Veklom",
  description: "Enterprise insights on Agentic Governance, SEKED Policy Engines, PGL Identity, and AI Micropayments.",
};

export default function BlogIndex() {
  const now = new Date();
  
  // Filter out future posts, sort newest first
  const activeBlogs = blogsData
    .filter(blog => new Date(blog.publishDate) <= now)
    .sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gradient mb-4">Sovereign Intelligence</h1>
        <p className="text-lg text-ink-300">Technical essays, infrastructure teardowns, and architectural blueprints for deploying safe, auditable, and financially constrained autonomous agents.</p>
      </div>
      
      <div className="space-y-6">
        {activeBlogs.map(blog => {
          const formattedDate = new Date(blog.publishDate).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
          });
          
          return (
            <Link key={blog.slug} href={`/blog/${blog.slug}`} className="block group">
              <Card className="border-border hover:border-brand-500/50 transition-colors p-6 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-brand-400 font-mono mb-1">
                  <Calendar size={14} /> {formattedDate}
                </div>
                <h2 className="text-2xl font-semibold text-white group-hover:text-brand-300 transition-colors">{blog.title}</h2>
                <p className="text-ink-300 leading-relaxed">{blog.excerpt}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-brand-500">
                  Read Article <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
