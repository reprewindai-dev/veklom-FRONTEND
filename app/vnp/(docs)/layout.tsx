"use client";

import React from 'react';
import { Shield, BookOpen, Terminal, Scale, Activity, Lock, Cpu, Globe } from 'lucide-react';
import { DocsLayout } from '@/components/docs/DocsLayout';

const sidebarLinks = [
 {
 title:"Protocol Specifications",
 items: [
 { name:"Methodology v1.0", href:"/vnp/methodology", icon: Activity },
 { name:"Governance Charter", href:"/vnp/governance", icon: Scale },
 { name:"Slashing Mechanics", href:"/vnp/slashing", icon: Shield },
 { name:"x402 Settlement", href:"/vnp/x402", icon: Lock },
 ]
 },
 {
 title:"Developers",
 items: [
 { name:"Documentation Hub", href:"/vnp/docs", icon: BookOpen },
 { name:"Python Probe SDK", href:"/vnp/sdk/python", icon: Terminal },
 { name:"FastAPI Integration", href:"/vnp/sdk/fastapi", icon: Cpu },
 ]
 },
 {
 title:"Network Tools",
 items: [
 { name:"Global Topology", href:"/vnp/topology", icon: Globe },
 { name:"API Directory", href:"/vnp/directory", icon: BookOpen },
 { name:"Network Status", href:"/vnp/status", icon: Activity },
 ]
 }
];

export default function VNPDocsLayout({
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
