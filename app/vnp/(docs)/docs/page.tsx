"use client";

import React from 'react';
import Link from 'next/link';
import { Activity, Shield, BookOpen, Terminal, Code, Cpu } from 'lucide-react';

export default function DocsHubPage() {
  const sections = [
    {
      title: "Protocol Specifications",
      description: "Dive deep into the mathematics and cryptographic primitives powering VNP.",
      icon: BookOpen,
      links: [
        { name: "Methodology v1.0", href: "/vnp/methodology" },
        { name: "Governance Charter", href: "/vnp/governance" },
        { name: "Slashing Mechanics (MAD)", href: "/vnp/slashing" },
        { name: "x402 Settlement (zk-SNARKs)", href: "/vnp/x402" }
      ]
    },
    {
      title: "Developer SDKs",
      description: "Integrate VNP assertions into your autonomous agents or backend APIs.",
      icon: Code,
      links: [
        { name: "Python Probe SDK", href: "/vnp/sdk/python" },
        { name: "FastAPI Interceptor", href: "/vnp/sdk/fastapi" },
        { name: "STAMP Network Timings", href: "/vnp/docs/edge-probes" }
      ]
    },
    {
      title: "Network & Tooling",
      description: "Explore the live mesh and operate infrastructure.",
      icon: Activity,
      links: [
        { name: "Global Topology Map", href: "/vnp/topology" },
        { name: "Node Operator Requirements", href: "/vnp/operators" },
        { name: "Live Network Status", href: "/vnp/status" }
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-24">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">Documentation Hub</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The definitive guide to integrating, operating, and understanding the Veklom Nexus Protocol V1.0 architecture.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:border-[#FFB800]/30 transition-colors group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#FFB800]/10 flex items-center justify-center border border-[#FFB800]/20 group-hover:bg-[#FFB800]/20 transition-colors">
                  <Icon className="w-6 h-6 text-[#FFB800]" />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">{section.description}</p>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-gray-300 hover:text-[#FFB800] transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB800]/50" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  );
}
