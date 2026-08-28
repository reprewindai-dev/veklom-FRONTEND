"use client";

import Link from"next/link";
import React from"react";

interface GlobalFooterProps {
 isMachine?: boolean;
}

export function GlobalFooter({ isMachine = true }: GlobalFooterProps) {
 return (
 <footer 
 className="mt-24 border-t border-rule data-[machine=true]:border-wire p-12 lg:px-24 text-sm transition-colors duration-500 text-cos-text/60 data-[machine=true]:text-cos-text/50 font-mono relative z-20" 
 data-machine={isMachine}
 >
 <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 max-w-6xl mx-auto">
 <div className="col-span-2 md:col-span-1">
 <Link href="/">
 <img src="/veklom-wordmark.svg" alt="Veklom Wordmark" className="h-6 w-auto mb-6 opacity-70" />
 </Link>
 <div className="text-xs mb-1 italic">&quot;Anything is possible, if you&apos;re willing to build the wire first.&quot;</div>
 </div>
 
 <div className="flex flex-col gap-3">
 <h4 className="font-bold text-cos-text uppercase tracking-wider text-xs mb-2">Platform</h4>
 <Link href="/vnp" className="hover:text-cos-accent transition-colors">Veklom Nexus Protocol (VNP)</Link>
 <Link href="/eee" className="hover:text-cos-accent transition-colors">Enterprise Exchange (EEE)</Link>
 <Link href="/vcgb" className="hover:text-cos-accent transition-colors">Governed Boundaries (VCGB)</Link>
 <Link href="/402-settlement" className="hover:text-cos-accent transition-colors">Settlement (x402)</Link>
 </div>

 <div className="flex flex-col gap-3">
 <h4 className="font-bold text-cos-text uppercase tracking-wider text-xs mb-2">Resources</h4>
 <Link href="/docs" className="hover:text-cos-accent transition-colors">Documentation</Link>
 <Link href="/python-probe-sdk" className="hover:text-cos-accent transition-colors">Python Probe SDK</Link>
 <Link href="/fast-api-integration" className="hover:text-cos-accent transition-colors">Fast API Integration</Link>
 <Link href="/github-repository" className="hover:text-cos-accent transition-colors">GitHub Repository</Link>
 <Link href="/directory" className="hover:text-cos-accent transition-colors">API Directory</Link>
 <Link href="/node-operator-guide" className="hover:text-cos-accent transition-colors">Node Operator Guide</Link>
 </div>

 <div className="flex flex-col gap-3">
 <h4 className="font-bold text-cos-text uppercase tracking-wider text-xs mb-2">Trust & Ops</h4>
 <Link href="/status" className="hover:text-cos-accent transition-colors">Status & Uptime</Link>
 <Link href="/protocol-mythology-v1" className="hover:text-cos-accent transition-colors">Protocol Mythology V1</Link>
 <Link href="/governance-charter" className="hover:text-cos-accent transition-colors">Governance Charter</Link>
 <Link href="/slashing-mechanics" className="hover:text-cos-accent transition-colors">Slashing Mechanics</Link>
 <Link href="/global-topology-map" className="hover:text-cos-accent transition-colors">Global Topology Map</Link>
 </div>
 </div>
 
 <div className="border-t border-rule data-[machine=true]:border-wire pt-8 flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl mx-auto text-xs">
 <div>&copy; {new Date().getFullYear()} VEKLOM — the era is early.</div>
 <div className="flex gap-6">
 <Link href="#" className="hover:text-cos-text">Privacy</Link>
 <Link href="#" className="hover:text-cos-text">Terms</Link>
 </div>
 </div>
 </footer>
 );
}
