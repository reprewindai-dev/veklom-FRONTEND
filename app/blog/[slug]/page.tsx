import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { PageHeader } from "@/components/ui";
import { Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { VideoCarousel } from "@/components/blog/video-carousel";
import fs from "fs";
import path from "path";
import remarkGfm from "remark-gfm";

const getPostData = (slug: string) => {
  try {
    const filePath = path.join(process.cwd(), "content", "blog", `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const fileContent = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(fileContent);
    return data;
  } catch (error) {
    console.error("Error loading blog post:", error);
    return null;
  }
};

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = getPostData(params.slug);
  if (!post) {
    return { title: 'Post Not Found | Veklom' };
  }
  return {
    title: `${post.title} | Sovereign AI Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = getPostData(params.slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.publishDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <Link href="/blog" className="inline-flex items-center text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors mb-8 group">
        <ChevronLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
        Back to Sovereign Intelligence
      </Link>
      
      <div className="mb-12">
        <div className="flex items-center gap-2 text-sm text-brand-500 font-mono mb-4">
          <Calendar size={14} /> {formattedDate}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">{post.title}</h1>
        <p className="text-xl text-ink-300 leading-relaxed border-l-2 border-brand-500/30 pl-4">{post.excerpt}</p>
      </div>
      
      <article className="prose prose-invert prose-brand max-w-none prose-h3:text-2xl prose-h3:mt-8 prose-p:leading-relaxed prose-pre:bg-[#03070c] prose-pre:border prose-pre:border-border">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Handle custom Carousel component insertion
            p: ({ node, children }) => {
              // If paragraph is just <Carousel />, render our React component
              if (children && Array.isArray(children) && children[0] === "<Carousel />") {
                return <VideoCarousel />;
              }
              if (children === "<Carousel />") {
                return <VideoCarousel />;
              }
              return <p>{children}</p>;
            }
          }}
        >
          {post.content}
        </ReactMarkdown>
      </article>
      
      <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/10 flex items-center justify-center border border-brand-500/20">
            <span className="text-xl font-bold text-brand-400">V</span>
          </div>
          <div>
            <h4 className="font-semibold text-white">Veklom Engineering</h4>
            <p className="text-sm text-ink-400">Sovereign Control Node</p>
          </div>
        </div>
      </div>
    </div>
  );
}
