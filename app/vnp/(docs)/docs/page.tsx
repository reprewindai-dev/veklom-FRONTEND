"use client";

import React from 'react';
import Link from 'next/link';
import { Activity, BookOpen, Code, Database, FileCheck, Scale, ShieldCheck } from 'lucide-react';

export default function DocsHubPage() {
  const sections = [
    {
      title: "Benchmark Card Doctrine",
      description: "Normative VNP documentation for benchmark scope, scoring interpretation, limitations, resources, validation, and governance.",
      icon: BookOpen,
      links: [
        { name: "Methodology v1.0", href: "/vnp/methodology" },
        { name: "Governance Charter", href: "/vnp/governance" },
        { name: "Slashing Mechanics (MAD)", href: "/vnp/slashing" },
        { name: "x402 Settlement (zk-SNARKs)", href: "/vnp/x402" }
      ]
    },
    {
      title: "Data & Integration",
      description: "Probe SDKs, interceptors, and operator requirements for producing signed measurements without fake or provider-controlled telemetry.",
      icon: Code,
      links: [
        { name: "Python Probe SDK", href: "/vnp/sdk/python" },
        { name: "FastAPI Interceptor", href: "/vnp/sdk/fastapi" },
        { name: "Node Operator Requirements", href: "/vnp/operators" }
      ]
    },
    {
      title: "Network Evidence",
      description: "Live directory, status, and topology surfaces for validating where measurements come from and whether the mesh is healthy.",
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
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 text-[#FFB800] text-xs font-bold uppercase tracking-widest mb-5">
          <FileCheck className="w-3.5 h-3.5" /> Updated July 7
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">VNP Documentation Hub</h1>
        <p className="text-xl text-gray-400 leading-relaxed mb-8">
          The local source of truth for integrating, operating, and auditing the Veklom Nexus Protocol v1.0 benchmark standard.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Database, label: "Data", value: "5-region signed probes" },
          { icon: ShieldCheck, label: "Validation", value: "Merkle anchored evidence" },
          { icon: Scale, label: "Governance", value: "Locked methodology + disputes" }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-black/40 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 text-[#FFB800] text-xs font-mono uppercase tracking-widest mb-2">
                <Icon className="w-3.5 h-3.5" /> {item.label}
              </div>
              <div className="text-sm font-semibold text-white">{item.value}</div>
            </div>
          );
        })}
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
