"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import VNPFooter from '@/components/vnp/VNPFooter';
import { Shield, BookOpen, Terminal, Scale, Activity, Lock, Cpu, Globe } from 'lucide-react';

const sidebarLinks = [
  {
    title: "Protocol Specifications",
    items: [
      { name: "Methodology v1.0", href: "/vnp/methodology", icon: Activity },
      { name: "Governance Charter", href: "/vnp/governance", icon: Scale },
      { name: "Slashing Mechanics", href: "/vnp/slashing", icon: Shield },
      { name: "x402 Settlement", href: "/vnp/x402", icon: Lock },
    ]
  },
  {
    title: "Developers",
    items: [
      { name: "Documentation Hub", href: "/vnp/docs", icon: BookOpen },
      { name: "Python Probe SDK", href: "/vnp/sdk/python", icon: Terminal },
      { name: "FastAPI Integration", href: "/vnp/sdk/fastapi", icon: Cpu },
    ]
  },
  {
    title: "Network Tools",
    items: [
      { name: "Global Topology", href: "/vnp/topology", icon: Globe },
      { name: "API Directory", href: "/vnp/directory", icon: BookOpen },
      { name: "Network Status", href: "/vnp/status", icon: Activity },
    ]
  }
];

export default function VNPDocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#FFB800]/30 font-sans flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/vnp" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FFB800] rounded flex items-center justify-center brand-glow">
              <span className="font-bold text-black leading-none">V</span>
            </div>
            <span className="font-bold tracking-wider text-lg font-mono">VEKLOM<span className="text-gray-500">_VNP</span></span>
          </Link>
          <div className="flex items-center gap-6 text-sm font-medium">
            <Link href="/workspace" className="text-gray-400 hover:text-white transition-colors">Access Workspace</Link>
          </div>
        </div>
      </nav>

      <div className="flex-grow pt-16 flex max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 hidden lg:block border-r border-white/5 pt-12 pr-8 pb-20 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {sidebarLinks.map((group, i) => (
            <div key={i} className="mb-8">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{group.title}</h4>
              <ul className="space-y-2">
                {group.items.map((item, j) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <li key={j}>
                      <Link 
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive 
                            ? 'bg-[#FFB800]/10 text-[#FFB800]' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow min-w-0 px-6 py-12 lg:pl-16">
          <div className="max-w-3xl">
            {children}
          </div>
        </main>
      </div>

      <VNPFooter />
    </div>
  );
}
