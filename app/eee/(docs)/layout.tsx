"use client";

import React from 'react';
import { FileText, Database, ShieldCheck, BookOpen, Terminal, CheckCircle } from 'lucide-react';
import { DocsLayout } from '@/components/docs/DocsLayout';

const sidebarLinks = [
  {
    title: "EEE Protocol",
    items: [
      { name: "Documentation Hub", href: "/eee/docs", icon: BookOpen },
      { name: "Envelope Schema", href: "/eee/schema", icon: Database },
      { name: "Verification Rules", href: "/eee/verification", icon: ShieldCheck },
    ]
  }
];

export default function EEEDocsLayout({
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
