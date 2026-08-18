"use client";

import React from 'react';
import Link from 'next/link';
import { FileText, Database, ShieldCheck, Terminal, CheckCircle } from 'lucide-react';

export default function EEEDocsHubPage() {
  const sections = [
    {
      title: "Envelope Schema",
      description: "The complete structure of the Execution Evidence Envelope (EEE), detailing Identity, Capability, Authority, Policy, Execution, and Integrity fields.",
      icon: Database,
      links: [
        { name: "Envelope Schema Definition", href: "/eee/schema" }
      ]
    },
    {
      title: "Verification Procedure",
      description: "The exact 12-step cryptographic verification process. How to prove an execution is valid without trusting the issuer's infrastructure.",
      icon: ShieldCheck,
      links: [
        { name: "Verification Rules", href: "/eee/verification" }
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-24 text-cos-text">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cos-accent/10 border border-cos-accent/20 text-cos-accent text-xs font-bold uppercase tracking-widest mb-5">
          <FileText className="w-3.5 h-3.5" /> Frozen: v0.1.0
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-6">EEE Documentation Hub</h1>
        <p className="text-xl text-cos-text/70 leading-relaxed mb-8">
          The Execution Evidence Envelope (EEE) standardizes execution evidence. A portable, signed, independently verifiable record of a single governed machine execution.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Terminal, label: "Verifiable", value: "Issuer-neutral design" },
          { icon: ShieldCheck, label: "Deterministic", value: "JCS Canonicalization" },
          { icon: Database, label: "Portable", value: "Detached attestations" }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-bg-900/40 border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 text-cos-accent text-xs font-mono uppercase tracking-widest mb-2">
                <Icon className="w-3.5 h-3.5" /> {item.label}
              </div>
              <div className="text-sm font-semibold text-cos-text">{item.value}</div>
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {sections.map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="bg-bg-900/50 border border-border p-8 rounded-2xl hover:border-cos-accent/30 transition-colors group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cos-accent/10 flex items-center justify-center border border-cos-accent/20 group-hover:bg-cos-accent/20 transition-colors">
                  <Icon className="w-6 h-6 text-cos-accent" />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
              </div>
              <p className="text-cos-text/70 mb-6 leading-relaxed">{section.description}</p>
              <ul className="space-y-3">
                {section.links.map((link, i) => (
                  <li key={i}>
                    <Link href={link.href} className="text-cos-text/90 hover:text-cos-accent transition-colors flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cos-accent/50" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
      
      <div className="mt-12 p-6 rounded-xl bg-cos-accent/5 border border-cos-accent/10">
        <h3 className="font-bold mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-cos-accent" /> Design Principle</h3>
        <p className="text-sm text-cos-text/80">
          <strong>Scores are opinions derived from evidence. This document standardizes the evidence.</strong> EEE is issuer-neutral. Any enforcement boundary, agent runtime, orchestrator, or policy engine MAY produce Envelopes. Any party MAY verify them.
        </p>
      </div>
    </div>
  );
}
