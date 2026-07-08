import React from 'react';
import Link from 'next/link';

export default function VeklomFooter() {
  return (
    <footer className="py-16 border-t border-white/5 bg-[#0A0A0C] text-sm relative z-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#FFB800] rounded flex items-center justify-center brand-glow">
                <span className="font-bold text-black text-sm leading-none">V</span>
              </div>
              <span className="font-bold font-mono tracking-wider text-white text-lg">VEKLOM</span>
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              The Sovereign AI Hub. Test, plan, govern, deploy, and prove private AI from one tenant-scoped workspace.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Platform</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/workspace" className="hover:text-[#FFB800] transition-colors">Control Plane</Link></li>
              <li><Link href="/vnp" className="hover:text-[#FFB800] transition-colors">VNP Benchmark</Link></li>
              <li><Link href="/agent-dual" className="hover:text-[#FFB800] transition-colors">Agent Duel</Link></li>
              <li><Link href="/gpc" className="hover:text-[#FFB800] transition-colors">Pipeline Builder</Link></li>
              <li><Link href="/pricing" className="hover:text-[#FFB800] transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Resources</h3>
            <ul className="space-y-3 text-gray-400">
              <li><a href="https://docs.veklom.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB800] transition-colors">Documentation</a></li>
              <li><Link href="/blog" className="hover:text-[#FFB800] transition-colors">Engineering Blog</Link></li>
              <li><a href="https://status.veklom.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#FFB800] transition-colors">System Status</a></li>
              <li><a href="mailto:support@veklom.com" className="hover:text-[#FFB800] transition-colors">Support</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-xs">Legal & Compliance</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/legal/terms" className="hover:text-[#FFB800] transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-[#FFB800] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/sla" className="hover:text-[#FFB800] transition-colors">Service Level Agreement</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-xs">
          <p>© {new Date().getFullYear()} Veklom Corporation. All rights reserved. 99.9% Uptime Guaranteed.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
