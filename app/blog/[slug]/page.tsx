"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, Clock3, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { HumanAppShell } from "@/components/shell/HumanAppShell";
import { BLOG_POSTS, type BlogPost } from "@/lib/content/blog-posts";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  const [dwellSeconds, setDwellSeconds] = useState(0);
  const [maxScrollPct, setMaxScrollPct] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDwellSeconds((prev) => prev + 1);
    }, 1000);

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const pct = Math.min(100, Math.round((window.scrollY / scrollHeight) * 100));
        setMaxScrollPct((prev) => Math.max(prev, pct));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearInterval(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Flush retention telemetry on unmount or milestone
  useEffect(() => {
    if (dwellSeconds === 15 || dwellSeconds === 60 || dwellSeconds === 180) {
      fetch("/api/v1/telemetry/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: `/blog/${slug}`,
          articleSlug: slug,
          scrollDepthPct: maxScrollPct,
          readingDurationSeconds: dwellSeconds,
          engagedTimeSeconds: dwellSeconds,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  }, [dwellSeconds, maxScrollPct, slug]);

  if (!post) {
    return notFound();
  }

  return (
    <HumanAppShell>
      <div className="relative min-h-screen bg-theme-bg py-16 px-5 sm:px-8 lg:px-12">
        <article className="mx-auto max-w-3xl">
          {/* Back link & retention banner */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-theme-border pb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-xs font-mono text-theme-inkDim hover:text-cyan-400 transition"
            >
              <ArrowLeft size={14} /> Back to all articles
            </Link>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[10px] text-emerald-400">
              <TrendingUp size={12} />
              <span>Telemetry: {dwellSeconds}s dwell · {maxScrollPct}% depth</span>
            </div>
          </div>

          {/* Article Header */}
          <div className="mb-10">
            <span className="inline-block rounded-md border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
              {post.category}
            </span>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-theme-ink sm:text-4xl md:text-5xl leading-tight">
              {post.title}
            </h1>

            <p className="mt-4 text-lg font-medium text-theme-inkDim leading-relaxed">
              {post.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-theme-inkDim border-t border-b border-theme-border py-3">
              <span>{post.publishedAt}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock3 size={13} />
                {post.readingTimeMinutes} min read
              </span>
              <span>•</span>
              <span>By {post.author.name}</span>
            </div>
          </div>

          {/* Law 0 Callout */}
          <div className="mb-10 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 shadow-sm">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">
              <ShieldCheck size={16} />
              Governing Continuity Law
            </div>
            <p className="text-sm font-mono text-theme-ink leading-relaxed">
              {post.law0Alignment}
            </p>
          </div>

          {/* Article Body */}
          <div className="space-y-6 text-base leading-8 text-theme-ink/90 font-sans">
            {post.content.map((paragraph, index) => {
              if (paragraph.startsWith("1. ") || paragraph.startsWith("RepoGate")) {
                return (
                  <div key={index} className="rounded-xl border border-theme-border bg-theme-surface p-5 font-mono text-xs text-theme-ink leading-relaxed whitespace-pre-line">
                    {paragraph}
                  </div>
                );
              }
              if (paragraph === "Computational Possession does not imply Consequence Authority.") {
                return (
                  <blockquote key={index} className="my-8 border-l-4 border-cyan-400 pl-6 text-xl font-semibold italic text-theme-ink">
                    &ldquo;{paragraph}&rdquo;
                  </blockquote>
                );
              }
              return (
                <p key={index} className="text-theme-ink/90">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Author Footer */}
          <div className="mt-16 rounded-3xl border border-theme-border bg-theme-surface p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/20 text-cyan-400 font-mono font-bold">
                VK
              </div>
              <div>
                <h3 className="text-base font-semibold text-theme-ink">{post.author.name}</h3>
                <p className="text-xs text-theme-inkDim">{post.author.role}</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-theme-inkDim leading-relaxed">
              The Veklom Lab develops the Continuity Framework, sink-enforced consequence firewalls, and machine-to-machine coordination protocols for mission-critical enterprise autonomy.
            </p>
          </div>
        </article>
      </div>
    </HumanAppShell>
  );
}
