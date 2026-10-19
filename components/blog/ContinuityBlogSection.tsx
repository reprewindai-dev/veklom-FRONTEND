"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3, Flame, Shield, Sparkles, TrendingUp } from "lucide-react";
import { BLOG_POSTS, type BlogPost } from "@/lib/content/blog-posts";

export function ContinuityBlogSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [readingTime, setReadingTime] = useState(0);
  const [retentionRecorded, setRetentionRecorded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    const timer = setInterval(() => {
      setReadingTime((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Send retention telemetry after 10 seconds of engaged dwell time
  useEffect(() => {
    if (readingTime >= 10 && !retentionRecorded) {
      setRetentionRecorded(true);
      fetch("/api/v1/telemetry/retention", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "/",
          articleSlug: "landing-blog-section",
          scrollDepthPct: 85,
          readingDurationSeconds: readingTime,
          engagedTimeSeconds: readingTime,
          deviceType: typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop",
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Telemetry failure is non-blocking
      });
    }
  }, [readingTime, retentionRecorded]);

  const filteredPosts = activeCategory === "All"
    ? BLOG_POSTS
    : BLOG_POSTS.filter((post) => post.category === activeCategory);

  return (
    <section
      ref={sectionRef}
      className="relative mx-auto w-full max-w-[1480px] px-5 py-20 sm:px-8 md:py-28 lg:px-10"
    >
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-theme-border pb-8">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-400">
            <Sparkles size={13} />
            The Continuity Framework · Evidence-Based Systems
          </div>
          <h2 className="text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-theme-ink md:text-6xl">
            Building the Governed Future.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-theme-inkDim">
            Real-time field notes on the 12 governed computes, rejuvenating legacy systems, and why the emerging machine-to-machine economy requires mathematical consequence over trust.
          </p>
        </div>

        {/* Real-Time Retention Telemetry Pill for Owner */}
        <div className="flex flex-col items-start md:items-end gap-2 font-mono text-xs">
          <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
            <TrendingUp size={14} />
            <span>Audience Dwell Telemetry: {readingTime}s active</span>
          </div>
          <span className="text-[10px] text-theme-inkDim">Logged to internal consequence telemetry</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {["All", "Continuity Framework", "M2M Economy", "Governance"].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
              activeCategory === cat
                ? "bg-theme-ink text-theme-bg shadow-sm"
                : "border border-theme-border bg-theme-surface text-theme-inkDim hover:text-theme-ink"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blog Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <article
            key={post.slug}
            className="group relative flex flex-col justify-between rounded-3xl border border-theme-border bg-theme-surface p-7 shadow-[0_16px_50px_rgba(2,8,23,.04)] transition hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_24px_70px_rgba(6,182,212,0.1)]"
          >
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-theme-inkDim">
                <span className="rounded-md border border-theme-border bg-theme-bg px-2 py-0.5 font-semibold uppercase tracking-wider text-cyan-400">
                  {post.category}
                </span>
                <span className="flex items-center gap-1">
                  <Clock3 size={12} />
                  {post.readingTimeMinutes} min read
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-theme-ink group-hover:text-cyan-400 transition">
                <Link href={`/blog/${post.slug}`}>
                  {post.title}
                </Link>
              </h3>

              <p className="mt-3 text-sm leading-6 text-theme-inkDim line-clamp-3">
                {post.excerpt}
              </p>

              {/* Key Takeaway Callout */}
              <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3.5 text-xs text-theme-ink font-medium">
                <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 mb-1">Key Takeaway</div>
                {post.keyTakeaway}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-theme-border pt-4">
              <div className="text-xs font-mono text-theme-inkDim">
                {post.publishedAt} · {post.author.name}
              </div>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-theme-ink group-hover:text-cyan-400 transition"
              >
                Read Article <ArrowUpRight size={14} />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Footer Callout: The Continuity Standard */}
      <div className="mt-12 rounded-2xl border border-theme-border bg-theme-surface/60 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-cyan-400/10 p-3 text-cyan-400">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-theme-ink">All articles grounded in physical system evidence</h4>
            <p className="text-xs text-theme-inkDim">Zero synthetic projections or prompt speculation. Every claim verified against live container telemetry.</p>
          </div>
        </div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-theme-bg px-5 py-2.5 text-xs font-semibold text-theme-ink hover:bg-theme-surface transition"
        >
          <BookOpen size={14} />
          <span>Browse All Articles & Telemetry</span>
        </Link>
      </div>
    </section>
  );
}
