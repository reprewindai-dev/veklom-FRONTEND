"use client";

import React from 'react';
import { DocsSidebar, SidebarGroup } from './DocsSidebar';
import { DocsToc, TocHeading } from './DocsToc';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';

interface DocsLayoutProps {
 children: React.ReactNode;
 sidebarGroups: SidebarGroup[];
 tocHeadings?: TocHeading[];
}

export function DocsLayout({ children, sidebarGroups, tocHeadings }: DocsLayoutProps) {
 return (
 <MarketingLayout>
 <div className="flex-grow max-w-[1400px] mx-auto w-full flex px-4 sm:px-6 lg:px-8">
 
 {/* Left Navigation Sidebar */}
 <DocsSidebar groups={sidebarGroups} />

 {/* Main Content Area */}
 <main className="flex-1 min-w-0 pt-12 pb-24 px-0 lg:px-12 xl:px-16 overflow-hidden">
 <div className="max-w-3xl mx-auto docs-content">
 {children}
 </div>
 </main>

 {/* Right Table of Contents Sidebar */}
 <DocsToc headings={tocHeadings} />
 
 </div>
 </MarketingLayout>
 );
}

