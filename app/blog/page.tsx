import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3, Shield, Sparkles, TrendingUp } from "lucide-react";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { BLOG_POSTS } from "@/lib/content/blog-posts";

export default function BlogIndexPage() {
  return (
    <HumanAppShell>
      <div className="relative min-h-screen bg-theme-bg py-20 px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-14 border-b border-theme-border pb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
              <Sparkles size={13} />
              The Continuity Framework · Public Journal
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-theme-ink md:text-6xl">
              Notes on Governed Consequence & The M2M Economy
            </h1>
            <p className="mt-4 max-w-3xl text-lg text-theme-inkDim">
              Ground-truth essays, mathematical architectural principles, and real-time field reports from the Veklom Lab on replacing trust with physical evidence.
            </p>
          </div>

          {/* Article List */}
          <div className="space-y-8">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.slug}
                className="group rounded-3xl border border-theme-border bg-theme-surface p-8 shadow-sm transition hover:border-cyan-400/40 hover:shadow-lg"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-theme-inkDim">
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 font-semibold uppercase tracking-wider text-cyan-400">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{post.publishedAt}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock3 size={13} />
                      {post.readingTimeMinutes} min read
                    </span>
                  </div>
                </div>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-theme-ink group-hover:text-cyan-400 transition">
                  <Link href={`/blog/${post.slug}`}>
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-2 text-base text-theme-inkDim font-medium">
                  {post.subtitle}
                </p>

                <p className="mt-4 text-sm leading-7 text-theme-inkDim">
                  {post.excerpt}
                </p>

                {/* Law 0 Alignment Banner */}
                <div className="mt-6 rounded-xl border border-theme-border bg-theme-bg/60 p-4 font-mono text-xs text-theme-ink">
                  <span className="text-cyan-400 font-semibold uppercase mr-2">Governing Invariant:</span>
                  {post.law0Alignment}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-theme-border pt-4">
                  <div className="text-xs font-mono text-theme-inkDim">
                    By {post.author.name} · {post.author.role}
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-theme-ink group-hover:text-cyan-400 transition"
                  >
                    Read full article <ArrowUpRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </HumanAppShell>
  );
}
