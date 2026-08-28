"use client";

import React from 'react';
import { Target, ListChecks, CheckSquare, BookOpen } from 'lucide-react';
import { DocsLayout } from '@/components/docs/DocsLayout';

const sidebarLinks = [
 {
 title:"VCGB Specification",
 items: [
 { name:"Documentation Hub", href:"/vcgb/docs", icon: BookOpen },
 { name:"Evaluation Criteria", href:"/vcgb/criteria", icon: CheckSquare },
 { name:"Test Scenarios", href:"/vcgb/scenarios", icon: ListChecks },
 ]
 }
];

export default function VCGBDocsLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <DocsLayout sidebarGroups={sidebarLinks}>
 {children}
 </DocsLayout>
 );
}
