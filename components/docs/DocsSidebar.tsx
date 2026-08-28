"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';

export type SidebarGroup = {
 title: string;
 items: {
 name: string;
 href: string;
 icon?: LucideIcon;
 }[];
};

interface DocsSidebarProps {
 groups: SidebarGroup[];
}

export function DocsSidebar({ groups }: DocsSidebarProps) {
 const pathname = usePathname();

 return (
 <aside className="w-64 shrink-0 hidden lg:block border-r border-rule pt-8 pr-6 pb-20 sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
 {groups.map((group, i) => (
 <div key={i} className="mb-8">
 <h4 className="text-xs font-bold text-cos-text/50 uppercase tracking-widest mb-3 px-3">{group.title}</h4>
 <ul className="space-y-1">
 {group.items.map((item, j) => {
 const isActive = pathname === item.href;
 const Icon = item.icon;
 return (
 <li key={j}>
 <Link 
 href={item.href}
 className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
 isActive 
 ? 'text-cos-accent font-medium bg-cos-accent/10' 
 : 'text-cos-text/70 hover:text-cos-text hover:bg-cos-text/5 font-normal'
 }`}
 >
 {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-cos-accent' : 'opacity-60'}`} />}
 {item.name}
 </Link>
 </li>
 );
 })}
 </ul>
 </div>
 ))}
 </aside>
 );
}
