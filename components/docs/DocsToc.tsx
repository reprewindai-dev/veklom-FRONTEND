"use client";

import React from 'react';
import Link from 'next/link';

export type TocHeading = {
  id: string;
  title: string;
  level: number;
};

interface DocsTocProps {
  headings?: TocHeading[];
}

export function DocsToc({ headings = [] }: DocsTocProps) {
  // If no headings are provided, we render a static placeholder 
  // that can be filled out later when parsing Markdown/MDX.
  const displayHeadings = headings.length > 0 ? headings : [
    { id: 'overview', title: 'Overview', level: 2 },
    { id: 'what-to-build', title: 'What to build', level: 2 },
    { id: 'before-you-begin', title: 'Before you begin', level: 2 },
    { id: 'integration', title: 'Integration', level: 2 },
    { id: 'next-steps', title: 'Next steps', level: 2 },
  ];

  return (
    <aside className="w-64 shrink-0 hidden xl:block pt-8 pl-6 pb-20 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
      <h4 className="text-xs font-bold text-cos-text uppercase mb-4 tracking-wide">On this page</h4>
      <ul className="space-y-3 border-l border-rule">
        {displayHeadings.map((heading, i) => (
          <li 
            key={i} 
            className={`pl-4 text-sm ${heading.level > 2 ? 'ml-2' : ''}`}
          >
            <Link 
              href={`#${heading.id}`}
              className="text-cos-text/70 hover:text-cos-text transition-colors"
            >
              {heading.title}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
